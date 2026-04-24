import { z } from "zod";
import { studentExecute, studentQuery } from "../db/studentDb.js";

const studentSchema = z.object({
  name: z.string().min(2),
  roll_no: z.string().min(1),
  department_id: z.coerce.number().int().positive().nullable().optional(),
  year_id: z.coerce.number().int().positive().nullable().optional(),
});

const achievementSchema = z.object({
  student_id: z.coerce.number().int().positive(),
  category_id: z.coerce.number().int().positive().nullable().optional(),
  title: z.string().min(2),
  level: z.string().optional().default(""),
  position: z.string().optional().default(""),
});

const achievementStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

const fileSchema = z.object({
  achievement_id: z.coerce.number().int().positive(),
  file_path: z.string().min(1),
  file_type: z.string().optional().default("other"),
});

function normalizeNullableText(value) {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

async function ensureAdminIdByEmail(email, name = "System Admin") {
  if (!email) return null;

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await studentQuery("SELECT admin_id FROM admins WHERE email = ? LIMIT 1", [normalizedEmail]);
  if (existing.length) return existing[0].admin_id;

  const insertResult = await studentExecute("INSERT INTO admins (name, email) VALUES (?, ?)", [name, normalizedEmail]);
  return insertResult.insertId || null;
}

export async function listPublicAchievements(_req, res) {
  try {
    const rows = await studentQuery(
      `
      SELECT
        a.achievement_id,
        a.title,
        a.level,
        a.position,
        a.status,
        s.student_id,
        s.name AS student_name,
        s.roll_no,
        d.dept_name,
        y.year_name,
        c.category_name
      FROM achievements a
      JOIN students s ON s.student_id = a.student_id
      LEFT JOIN departments d ON d.department_id = s.department_id
      LEFT JOIN years y ON y.year_id = s.year_id
      LEFT JOIN categories c ON c.category_id = a.category_id
      WHERE a.status = 'approved'
      ORDER BY a.achievement_id DESC
      `,
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function listAchievementsAdmin(_req, res) {
  try {
    const rows = await studentQuery(
      `
      SELECT
        a.achievement_id,
        a.student_id,
        a.category_id,
        a.title,
        a.level,
        a.position,
        a.status,
        a.approved_by,
        s.name AS student_name,
        s.roll_no,
        d.dept_name,
        y.year_name,
        c.category_name
      FROM achievements a
      JOIN students s ON s.student_id = a.student_id
      LEFT JOIN departments d ON d.department_id = s.department_id
      LEFT JOIN years y ON y.year_id = s.year_id
      LEFT JOIN categories c ON c.category_id = a.category_id
      ORDER BY a.achievement_id DESC
      `,
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function createStudent(req, res) {
  const parsed = studentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  try {
    const payload = parsed.data;
    const insertResult = await studentExecute(
      "INSERT INTO students (name, roll_no, department_id, year_id) VALUES (?, ?, ?, ?)",
      [payload.name, payload.roll_no, payload.department_id ?? null, payload.year_id ?? null],
    );

    const rows = await studentQuery("SELECT * FROM students WHERE student_id = ? LIMIT 1", [insertResult.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function createAchievement(req, res) {
  const parsed = achievementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  try {
    const payload = parsed.data;
    const insertResult = await studentExecute(
      "INSERT INTO achievements (student_id, category_id, title, level, position, status, approved_by) VALUES (?, ?, ?, ?, ?, 'pending', NULL)",
      [
        payload.student_id,
        payload.category_id ?? null,
        payload.title,
        normalizeNullableText(payload.level),
        normalizeNullableText(payload.position),
      ],
    );

    const rows = await studentQuery("SELECT * FROM achievements WHERE achievement_id = ? LIMIT 1", [insertResult.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function updateAchievementStatus(req, res) {
  const achievementId = Number(req.params.id);
  if (!Number.isInteger(achievementId) || achievementId <= 0) {
    return res.status(400).json({ message: "Invalid achievement id" });
  }

  const parsed = achievementStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  try {
    const { status } = parsed.data;
    const adminId = await ensureAdminIdByEmail(req.user?.email, "System Admin");

    const result = await studentExecute(
      "UPDATE achievements SET status = ?, approved_by = ? WHERE achievement_id = ?",
      [status, status === "approved" ? adminId : null, achievementId],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Achievement not found" });
    }

    const rows = await studentQuery("SELECT * FROM achievements WHERE achievement_id = ? LIMIT 1", [achievementId]);
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function uploadAchievementFile(req, res) {
  const parsed = fileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  try {
    const payload = parsed.data;
    const insertResult = await studentExecute(
      "INSERT INTO files (achievement_id, file_path, file_type) VALUES (?, ?, ?)",
      [payload.achievement_id, payload.file_path, payload.file_type],
    );

    const rows = await studentQuery("SELECT * FROM files WHERE file_id = ? LIMIT 1", [insertResult.insertId]);
    return res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function listReferenceData(_req, res) {
  try {
    const [departments, years, categories] = await Promise.all([
      studentQuery("SELECT * FROM departments ORDER BY dept_name ASC"),
      studentQuery("SELECT * FROM years ORDER BY year_id ASC"),
      studentQuery("SELECT * FROM categories ORDER BY category_name ASC"),
    ]);

    return res.json({ departments, years, categories });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
