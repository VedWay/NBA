import { supabaseAdmin } from "../db/supabase.js";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { emitToUser } from "../realtime/wsHub.js";

const jwtSecret = process.env.JWT_SECRET || "dev-nba-jwt-secret";
const adminSignupCode = process.env.ADMIN_SIGNUP_CODE || "";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "faculty"]),
  designation: z.string().optional().default("Assistant Professor"),
  department: z.string().optional().default("Computer Engineering and IT"),
  phone: z.string().optional().default("+91 0000000000"),
});

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function syncUserRoleRow({ authUserId, email, role, passwordHash }) {
  const normalizedEmail = normalizeEmail(email);
  const payload = {
    auth_user_id: authUserId,
    email: normalizedEmail,
    role,
  };

  if (passwordHash) {
    payload.password_hash = passwordHash;
  }

  const { error } = await supabaseAdmin.from("users").upsert(
    payload,
    { onConflict: "auth_user_id" },
  );

  return error;
}

async function linkFacultyProfileToAuthUser(authUserId, email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  await supabaseAdmin
    .from("faculty")
    .update({ user_id: authUserId })
    .is("user_id", null)
    .ilike("email", normalizedEmail);
}

async function notifyAdmins(title, message) {
  const { data: admins } = await supabaseAdmin
    .from("users")
    .select("auth_user_id")
    .eq("role", "admin");

  for (const admin of admins ?? []) {
    const adminId = admin?.auth_user_id;
    if (!adminId) continue;

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({ recipient_user_id: adminId, title, message, is_read: false })
      .select("*")
      .single();

    if (error || !data) {
      emitToUser(adminId, "notification.created", {
        id: `ws-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        recipient_user_id: adminId,
        title,
        message,
        is_read: false,
        created_at: new Date().toISOString(),
      });
      continue;
    }

    emitToUser(adminId, "notification.created", data);
  }
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid credentials payload" });
  }

  const { email, password } = parsed.data;
  const normalizedEmail = normalizeEmail(email);

  const { data: userRow, error: userReadError } = await supabaseAdmin
    .from("users")
    .select("auth_user_id,email,role,password_hash")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (userReadError) {
    return res.status(500).json({ message: userReadError.message });
  }

  if (!userRow?.password_hash) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const passwordOk = await bcrypt.compare(password, userRow.password_hash);
  if (!passwordOk) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const role = userRow.role || "viewer";
  await linkFacultyProfileToAuthUser(userRow.auth_user_id, userRow.email);

  const backendToken = jwt.sign(
    {
      sub: userRow.auth_user_id,
      email: userRow.email,
      role,
    },
    jwtSecret,
    { expiresIn: "7d" },
  );

  return res.json({
    access_token: backendToken,
    refresh_token: null,
    role,
    user: {
      id: userRow.auth_user_id,
      email: userRow.email,
    },
  });
}

export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid registration payload", errors: parsed.error.flatten() });
  }

  const { name, email, password, role, designation, department, phone } = parsed.data;

  if (role === "admin" && adminSignupCode) {
    const suppliedCode = String(req.body.admin_signup_code ?? "").trim();
    const expectedCode = String(adminSignupCode).trim();
    if (suppliedCode !== expectedCode) {
      return res.status(403).json({ message: "Invalid admin signup code" });
    }
  }

  const normalizedEmail = normalizeEmail(email);

  const { data: existingUser, error: existingError } = await supabaseAdmin
    .from("users")
    .select("auth_user_id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingError) {
    return res.status(500).json({ message: existingError.message });
  }

  if (existingUser) {
    return res.status(409).json({ message: "Account already exists for this email" });
  }

  const authUserId = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  const roleSyncError = await syncUserRoleRow({
    authUserId,
    email: normalizedEmail,
    role,
    passwordHash,
  });

  if (roleSyncError) {
    return res.status(500).json({ message: `Account created but role sync failed: ${roleSyncError.message}` });
  }

  if (role === "faculty") {
    const { error: facultyError } = await supabaseAdmin.from("faculty").insert({
      user_id: authUserId,
      name,
      designation,
      department,
      email: normalizedEmail,
      phone,
      bio: "New faculty profile. Update details from dashboard.",
      research_area: "",
      experience_teaching: 0,
      experience_industry: 0,
      is_approved: false,
      created_by: authUserId,
    });

    if (facultyError) {
      return res.status(500).json({ message: facultyError.message });
    }

    await notifyAdmins(
      "New Faculty Registration Pending",
      `${name} registered as faculty and profile approval is pending.`,
    );
  }

  await linkFacultyProfileToAuthUser(authUserId, normalizedEmail);

  const backendToken = jwt.sign(
    {
      sub: authUserId,
      email: normalizedEmail,
      role,
    },
    jwtSecret,
    { expiresIn: "7d" },
  );

  return res.status(201).json({
    message: "Account created successfully",
    access_token: backendToken,
    refresh_token: null,
    role,
    user: {
      id: authUserId,
      email: normalizedEmail,
    },
  });
}
