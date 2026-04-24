import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const studentPool = mysql.createPool({
  host: process.env.MYSQL_STUDENT_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_STUDENT_PORT || 3306),
  user: process.env.MYSQL_STUDENT_USER || "root",
  password: process.env.MYSQL_STUDENT_PASSWORD || "",
  database: process.env.MYSQL_STUDENT_DATABASE || "vjtiachievements",
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_STUDENT_CONNECTION_LIMIT || 10),
});

export async function studentQuery(sql, params = []) {
  const [rows] = await studentPool.query(sql, params);
  return rows;
}

export async function studentExecute(sql, params = []) {
  const [result] = await studentPool.execute(sql, params);
  return result;
}

export { studentPool };
