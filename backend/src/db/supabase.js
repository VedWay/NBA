import { randomUUID } from "crypto";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
const mysqlHost = process.env.MYSQL_HOST || "127.0.0.1";
const mysqlPort = Number(process.env.MYSQL_PORT || 3306);
const mysqlUser = process.env.MYSQL_USER || "root";
const mysqlPassword = process.env.MYSQL_PASSWORD || "";
const mysqlDatabase = process.env.MYSQL_DATABASE || "nba";

if (!mysqlUrl && !mysqlDatabase) {
  throw new Error("Missing MySQL configuration. Set MYSQL_URL (or DATABASE_URL) or MYSQL_DATABASE.");
}

const mysqlPool = mysqlUrl
  ? mysql.createPool(mysqlUrl)
  : mysql.createPool({
      host: mysqlHost,
      port: mysqlPort,
      user: mysqlUser,
      password: mysqlPassword,
      database: mysqlDatabase,
      waitForConnections: true,
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
    });

const JSON_LIKE_COLUMNS = new Set(["custom_fields", "old_data", "new_data"]);

function ensureIdentifier(identifier) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `\`${identifier}\``;
}

function normalizeValue(value) {
  if (value === undefined) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value;
  if (Buffer.isBuffer(value)) return value;
  if (value && typeof value === "object") return JSON.stringify(value);
  return value;
}

function parseSelectClause(selectClause) {
  const raw = String(selectClause || "*").trim();
  if (raw === "*") return "*";

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return "*";

  return parts
    .map((part) => {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(part)) {
        throw new Error(`Unsupported select field: ${part}`);
      }
      return ensureIdentifier(part);
    })
    .join(", ");
}

function parseJsonColumns(rows) {
  return rows.map((row) => {
    const next = { ...row };
    for (const key of Object.keys(next)) {
      const value = next[key];
      if (!JSON_LIKE_COLUMNS.has(key) || typeof value !== "string") continue;
      try {
        next[key] = JSON.parse(value);
      } catch {
        next[key] = value;
      }
    }
    return next;
  });
}

function normalizePayloadRows(payload) {
  const rows = Array.isArray(payload) ? payload : [payload];
  return rows.map((row) => {
    const cloned = { ...(row || {}) };
    if (!("id" in cloned)) {
      cloned.id = randomUUID();
    }
    return cloned;
  });
}

function buildWhere(filters = []) {
  if (!filters.length) {
    return { clause: "", params: [] };
  }

  const parts = [];
  const params = [];

  for (const filter of filters) {
    const column = ensureIdentifier(filter.column);
    if (filter.type === "eq") {
      parts.push(`${column} = ?`);
      params.push(normalizeValue(filter.value));
      continue;
    }
    if (filter.type === "ilike") {
      parts.push(`LOWER(${column}) = LOWER(?)`);
      params.push(String(filter.value ?? ""));
      continue;
    }
    if (filter.type === "is") {
      if (filter.value === null) {
        parts.push(`${column} IS NULL`);
      } else {
        parts.push(`${column} = ?`);
        params.push(normalizeValue(filter.value));
      }
      continue;
    }
    if (filter.type === "not") {
      if (String(filter.operator || "").toLowerCase() === "is" && filter.value === null) {
        parts.push(`${column} IS NOT NULL`);
      } else {
        throw new Error(`Unsupported not() condition for ${filter.column}`);
      }
    }
  }

  return {
    clause: ` WHERE ${parts.join(" AND ")}`,
    params,
  };
}

function buildOrder(orders = []) {
  if (!orders.length) return "";
  const orderSql = orders
    .map((order) => `${ensureIdentifier(order.column)} ${order.ascending ? "ASC" : "DESC"}`)
    .join(", ");
  return ` ORDER BY ${orderSql}`;
}

async function dbQuery(sql, params = []) {
  const [rows] = await mysqlPool.query(sql, params);
  return rows;
}

async function writeAuditEntries(entries) {
  if (!entries?.length) return;

  const valueGroups = [];
  const values = [];
  for (const entry of entries) {
    valueGroups.push("(?, ?, ?, ?, ?, ?)");
    values.push(entry.table_name);
    values.push(entry.row_id || null);
    values.push(entry.action);
    values.push(entry.changed_by || null);
    values.push(entry.old_data ? JSON.stringify(entry.old_data) : null);
    values.push(entry.new_data ? JSON.stringify(entry.new_data) : null);
  }

  const sql = `
    INSERT INTO audit_log (table_name, row_id, action, changed_by, old_data, new_data)
    VALUES ${valueGroups.join(",")}
  `;

  try {
    await dbQuery(sql, values);
  } catch {
    // Skip audit logging if the table is not ready yet (for first-time setup/migrations).
  }
}

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.action = "select";
    this.selectClause = "*";
    this.selectOptions = {};
    this.payload = null;
    this.filters = [];
    this.orders = [];
    this.rowLimit = null;
    this.returnMode = "many";
  }

  select(columns = "*", options = {}) {
    this.selectClause = columns;
    this.selectOptions = options || {};
    return this;
  }

  insert(payload) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  upsert(payload, options = {}) {
    this.action = "upsert";
    this.payload = payload;
    this.upsertOptions = options;
    return this;
  }

  eq(column, value) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  ilike(column, value) {
    this.filters.push({ type: "ilike", column, value });
    return this;
  }

  is(column, value) {
    this.filters.push({ type: "is", column, value });
    return this;
  }

  not(column, operator, value) {
    this.filters.push({ type: "not", column, operator, value });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orders.push({ column, ascending });
    return this;
  }

  limit(count) {
    this.rowLimit = Number(count);
    return this;
  }

  single() {
    this.returnMode = "single";
    return this;
  }

  maybeSingle() {
    this.returnMode = "maybeSingle";
    return this;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }

  finally(callback) {
    return this.execute().finally(callback);
  }

  async execute() {
    try {
      switch (this.action) {
        case "select":
          return await this.executeSelect();
        case "insert":
          return await this.executeInsert();
        case "update":
          return await this.executeUpdate();
        case "delete":
          return await this.executeDelete();
        case "upsert":
          return await this.executeUpsert();
        default:
          throw new Error(`Unsupported action: ${this.action}`);
      }
    } catch (error) {
      return { data: null, error, count: null };
    }
  }

  async executeSelect() {
    const table = ensureIdentifier(this.table);
    const { clause, params } = buildWhere(this.filters);
    const orderClause = buildOrder(this.orders);
    const limitClause = Number.isFinite(this.rowLimit) ? ` LIMIT ${Math.max(0, this.rowLimit)}` : "";

    let count = null;
    if (this.selectOptions?.count === "exact") {
      const countRows = await dbQuery(`SELECT COUNT(*) AS count FROM ${table}${clause}`, params);
      count = Number(countRows?.[0]?.count || 0);
      if (this.selectOptions?.head) {
        return { data: null, error: null, count };
      }
    }

    if (this.selectOptions?.head) {
      return { data: null, error: null, count };
    }

    const columns = parseSelectClause(this.selectClause);
    const rows = await dbQuery(`SELECT ${columns} FROM ${table}${clause}${orderClause}${limitClause}`, params);
    const parsedRows = parseJsonColumns(rows || []);

    if (this.returnMode === "single") {
      if (parsedRows.length !== 1) {
        return { data: null, error: new Error("Expected a single row"), count };
      }
      return { data: parsedRows[0], error: null, count };
    }

    if (this.returnMode === "maybeSingle") {
      if (!parsedRows.length) {
        return { data: null, error: null, count };
      }
      return { data: parsedRows[0], error: null, count };
    }

    return { data: parsedRows, error: null, count };
  }

  async executeInsert() {
    const table = ensureIdentifier(this.table);
    const rows = normalizePayloadRows(this.payload || {});
    if (!rows.length) {
      return { data: null, error: new Error("Insert payload is empty"), count: null };
    }

    const columns = Object.keys(rows[0]);
    if (!columns.length) {
      return { data: null, error: new Error("Insert payload has no columns"), count: null };
    }

    const valueGroups = [];
    const values = [];
    for (const row of rows) {
      valueGroups.push(`(${columns.map(() => "?").join(",")})`);
      for (const column of columns) {
        values.push(normalizeValue(row[column]));
      }
    }

    const sql = `INSERT INTO ${table} (${columns.map(ensureIdentifier).join(", ")}) VALUES ${valueGroups.join(", ")}`;
    await dbQuery(sql, values);

    if (this.table !== "audit_log") {
      await writeAuditEntries(
        rows.map((row) => ({
          table_name: this.table,
          row_id: row.id || null,
          action: "INSERT",
          changed_by: row.updated_by || row.created_by || null,
          old_data: null,
          new_data: row,
        })),
      );
    }

    const shouldReturnRows = this.selectClause !== "*" || this.returnMode !== "many";
    if (!shouldReturnRows) {
      return { data: null, error: null, count: null };
    }

    const insertedIds = rows.map((row) => row.id).filter(Boolean);
    if (!insertedIds.length) {
      return { data: null, error: null, count: null };
    }

    const placeholders = insertedIds.map(() => "?").join(",");
    const rowsOut = await dbQuery(
      `SELECT ${parseSelectClause(this.selectClause)} FROM ${table} WHERE ${ensureIdentifier("id")} IN (${placeholders})`,
      insertedIds,
    );
    const parsedRows = parseJsonColumns(rowsOut || []);

    if (this.returnMode === "single") {
      if (parsedRows.length !== 1) {
        return { data: null, error: new Error("Expected a single row"), count: null };
      }
      return { data: parsedRows[0], error: null, count: null };
    }

    if (this.returnMode === "maybeSingle") {
      return { data: parsedRows[0] || null, error: null, count: null };
    }

    return { data: parsedRows, error: null, count: null };
  }

  async executeUpdate() {
    const table = ensureIdentifier(this.table);
    const payload = this.payload || {};
    const keys = Object.keys(payload);
    if (!keys.length) {
      return { data: null, error: new Error("Update payload is empty"), count: null };
    }

    const setClause = keys.map((key) => `${ensureIdentifier(key)} = ?`).join(", ");
    const setValues = keys.map((key) => normalizeValue(payload[key]));
    const { clause, params } = buildWhere(this.filters);

    const oldRows = this.table === "audit_log" ? [] : await dbQuery(`SELECT * FROM ${table}${clause}`, params);
    await dbQuery(`UPDATE ${table} SET ${setClause}${clause}`, [...setValues, ...params]);

    if (this.table !== "audit_log" && oldRows.length) {
      const ids = oldRows.map((row) => row.id).filter(Boolean);
      const placeholders = ids.map(() => "?").join(",");
      const newRows = ids.length
        ? await dbQuery(`SELECT * FROM ${table} WHERE ${ensureIdentifier("id")} IN (${placeholders})`, ids)
        : [];
      const newRowMap = new Map((newRows || []).map((row) => [row.id, row]));

      await writeAuditEntries(
        oldRows.map((oldRow) => {
          const newRow = oldRow.id ? newRowMap.get(oldRow.id) || null : null;
          return {
            table_name: this.table,
            row_id: oldRow.id || newRow?.id || null,
            action: "UPDATE",
            changed_by: newRow?.updated_by || oldRow.updated_by || oldRow.created_by || null,
            old_data: oldRow,
            new_data: newRow,
          };
        }),
      );
    }

    const shouldReturnRows = this.selectClause !== "*" || this.returnMode !== "many";
    if (!shouldReturnRows) {
      return { data: null, error: null, count: null };
    }

    const followUp = new QueryBuilder(this.table)
      .select(this.selectClause)
      .order(this.orders[0]?.column || "id", this.orders[0] ? { ascending: this.orders[0].ascending } : { ascending: true });

    followUp.filters = [...this.filters];
    followUp.orders = [...this.orders];
    followUp.rowLimit = this.rowLimit;
    followUp.returnMode = this.returnMode;
    return followUp.executeSelect();
  }

  async executeDelete() {
    const table = ensureIdentifier(this.table);
    const { clause, params } = buildWhere(this.filters);

    const oldRows = this.table === "audit_log" ? [] : await dbQuery(`SELECT * FROM ${table}${clause}`, params);
    await dbQuery(`DELETE FROM ${table}${clause}`, params);

    if (this.table !== "audit_log" && oldRows.length) {
      await writeAuditEntries(
        oldRows.map((oldRow) => ({
          table_name: this.table,
          row_id: oldRow.id || null,
          action: "DELETE",
          changed_by: oldRow.updated_by || oldRow.created_by || null,
          old_data: oldRow,
          new_data: null,
        })),
      );
    }

    return { data: null, error: null, count: null };
  }

  async executeUpsert() {
    const table = ensureIdentifier(this.table);
    const rows = normalizePayloadRows(this.payload || {});
    if (!rows.length) {
      return { data: null, error: new Error("Upsert payload is empty"), count: null };
    }

    const onConflictColumn = String(this.upsertOptions?.onConflict || "id");
    const columns = Object.keys(rows[0]);
    const valueGroups = [];
    const values = [];

    for (const row of rows) {
      valueGroups.push(`(${columns.map(() => "?").join(",")})`);
      for (const column of columns) {
        values.push(normalizeValue(row[column]));
      }
    }

    const updatableColumns = columns.filter((column) => column !== "id" && column !== onConflictColumn);
    const updateClause = updatableColumns.length
      ? updatableColumns.map((column) => `${ensureIdentifier(column)} = VALUES(${ensureIdentifier(column)})`).join(", ")
      : `${ensureIdentifier(onConflictColumn)} = VALUES(${ensureIdentifier(onConflictColumn)})`;

    const sql = `INSERT INTO ${table} (${columns.map(ensureIdentifier).join(", ")}) VALUES ${valueGroups.join(", ")} ON DUPLICATE KEY UPDATE ${updateClause}`;
    await dbQuery(sql, values);

    return { data: null, error: null, count: null };
  }
}

export const supabaseAdmin = {
  from(table) {
    return new QueryBuilder(table);
  },
};

export const supabaseAnon = supabaseAdmin;
export { dbQuery, mysqlPool };
