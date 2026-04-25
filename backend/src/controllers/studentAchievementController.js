import { z } from "zod";
import { studentExecute, studentQuery } from "../db/studentDb.js";
import { notifyAdmins } from "../utils/notifications.js";


const achievementSchema = z.object({
  name: z.string().min(2),
  roll_no: z.string().min(2),
  department_id: z.coerce.number().int(),
  year_id: z.coerce.number().int(),
  category_id: z.coerce.number().int(),
  title: z.string().min(2),
  level: z.string(),
  position: z.string(),
});

// ================= ADD ACHIEVEMENT =================
export async function addAchievement(req, res) {
  const parsed = achievementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      message: "Invalid payload ❌", 
      errors: parsed.error.flatten().fieldErrors 
    });
  }

  const {
    name,
    roll_no,
    department_id,
    year_id,
    category_id,
    title,
    level,
    position
  } = parsed.data;

  const filePath = req.file ? req.file.path : null;

  try {
    // Insert or update student
    const studentQueryStr = `
      INSERT INTO students (name, roll_no, department_id, year_id)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE student_id=LAST_INSERT_ID(student_id), name=?, department_id=?, year_id=?
    `;

    const studentResult = await studentExecute(studentQueryStr, [
      name, roll_no, department_id, year_id,
      name, department_id, year_id
    ]);

    const student_id = studentResult.insertId;

    // Insert achievement
    const achievementQuery = `
      INSERT INTO achievements 
      (student_id, category_id, title, level, position, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `;

    const achievementResult = await studentExecute(
      achievementQuery,
      [student_id, category_id, title, level, position]
    );

    const achievement_id = achievementResult.insertId;
 
    // Notify Admins about new student submission
    await notifyAdmins(
      "New Student Achievement",
      "New Student Achievement submitted and is waiting for approval."
    );

    if (filePath) {
      const fileQuery = `
        INSERT INTO files (achievement_id, file_path, file_type)
        VALUES (?, ?, ?)
      `;
      await studentExecute(fileQuery, [achievement_id, filePath, req.file.mimetype]);
      return res.json({ message: "Inserted with file ✅", achievement_id });
    } else {
      return res.json({ message: "Inserted without file ✅", achievement_id });
    }
  } catch (error) {
    console.error("Add achievement error:", error);
    return res.status(500).json({ message: error.message });
  }
}

// ================= GET APPROVED =================
export async function getAchievements(req, res) {
  const { department_id, category_id } = req.query;
  let sql = `
    SELECT 
      s.name, 
      s.roll_no,
      d.dept_name,
      y.year_name,
      a.achievement_id,
      a.title,
      c.category_name,
      a.level,
      a.position,
      a.status,
      f.file_path
    FROM achievements a
    JOIN students s ON a.student_id = s.student_id
    JOIN departments d ON s.department_id = d.department_id
    JOIN years y ON s.year_id = y.year_id
    LEFT JOIN categories c ON a.category_id = c.category_id
    LEFT JOIN files f ON a.achievement_id = f.achievement_id
    WHERE a.status='approved'
  `;

  const params = [];
  if (department_id && department_id !== 'All') {
    sql += " AND s.department_id = ?";
    params.push(department_id);
  }
  if (category_id && category_id !== 'All') {
    sql += " AND a.category_id = ?";
    params.push(category_id);
  }

  sql += " ORDER BY a.achievement_id DESC";

  try {
    const result = await studentQuery(sql, params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ================= GET PENDING =================
export async function getPending(req, res) {
  const { department_id, category_id } = req.query;
  let sql = `
    SELECT 
      s.name, 
      s.roll_no,
      d.dept_name,
      y.year_name,
      a.achievement_id,
      a.title,
      c.category_name,
      a.level,
      a.position,
      a.status,
      f.file_path
    FROM achievements a
    JOIN students s ON a.student_id = s.student_id
    JOIN departments d ON s.department_id = d.department_id
    JOIN years y ON s.year_id = y.year_id
    LEFT JOIN categories c ON a.category_id = c.category_id
    LEFT JOIN files f ON a.achievement_id = f.achievement_id
    WHERE a.status = 'pending'
  `;

  const params = [];
  if (department_id && department_id !== 'All') {
    sql += " AND s.department_id = ?";
    params.push(department_id);
  }
  if (category_id && category_id !== 'All') {
    sql += " AND a.category_id = ?";
    params.push(category_id);
  }

  sql += " ORDER BY a.achievement_id DESC";

  try {
    const result = await studentQuery(sql, params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ================= GET REJECTED =================
export async function getRejected(req, res) {
  const { department_id, category_id } = req.query;
  let sql = `
    SELECT 
      s.name, 
      s.roll_no,
      d.dept_name,
      y.year_name,
      a.achievement_id,
      a.title,
      c.category_name,
      a.level,
      a.position,
      a.status,
      f.file_path
    FROM achievements a
    JOIN students s ON a.student_id = s.student_id
    LEFT JOIN departments d ON s.department_id = d.department_id
    LEFT JOIN years y ON s.year_id = y.year_id
    LEFT JOIN categories c ON a.category_id = c.category_id
    LEFT JOIN files f ON a.achievement_id = f.achievement_id
    WHERE a.status = 'rejected'
  `;

  const params = [];
  if (department_id && department_id !== 'All') {
    sql += " AND s.department_id = ?";
    params.push(department_id);
  }
  if (category_id && category_id !== 'All') {
    sql += " AND a.category_id = ?";
    params.push(category_id);
  }

  sql += " ORDER BY a.achievement_id DESC";

  try {
    const result = await studentQuery(sql, params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// ================= UPDATE STATUS =================
export async function updateStatus(req, res) {
  const id = req.params.id;
  const { status, admin_id } = req.body;
  
  // Ensure we have a valid admin_id to avoid FK constraint errors
  // We'll default to 1 (the one we seeded) if none provided or if it fails
  let approvedBy = admin_id || 1;

  try {
    // Optional: Verify if admin exists, if not, use default 1
    const adminCheck = await studentQuery("SELECT admin_id FROM admins WHERE admin_id = ?", [approvedBy]);
    if (adminCheck.length === 0) {
      approvedBy = 1; 
    }

    const sql = "UPDATE achievements SET status=?, approved_by=? WHERE achievement_id=?";
    await studentExecute(sql, [status, approvedBy, id]);
    res.json({ message: "Status updated ✅", approvedBy });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: error.message });
  }
}

// ================= FILTER DATA =================
export async function getFilters(req, res) {
  try {
    const [departments, years, categories] = await Promise.all([
      studentQuery("SELECT * FROM departments ORDER BY dept_name ASC"),
      studentQuery("SELECT * FROM years ORDER BY year_id ASC"),
      studentQuery("SELECT * FROM categories ORDER BY category_name ASC"),
    ]);

    res.json({
      departments,
      years,
      categories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Re-export as original names for compatibility if needed
export { addAchievement as createAchievement };
