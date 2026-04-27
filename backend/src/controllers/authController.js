import { supabaseAdmin } from "../db/supabase.js";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { emitToUser } from "../realtime/wsHub.js";
import { getAuth } from "../utils/firebase.js";

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

const googleLoginSchema = z.object({
  idToken: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  photoURL: z.string().optional(),
});

const USER_ROLES = new Set(["admin", "faculty", "viewer", "student"]);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeRole(role, fallback = "viewer") {
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (USER_ROLES.has(normalizedRole)) {
    return normalizedRole;
  }
  return fallback;
}

async function getFacultyApprovalStatusByIdentity({ authUserId, email }) {
  const normalizedEmail = normalizeEmail(email);

  let query = supabaseAdmin
    .from("faculty")
    .select("id,is_approved")
    .limit(1);

  if (authUserId) {
    query = query.eq("user_id", authUserId);
  } else if (normalizedEmail) {
    query = query.ilike("email", normalizedEmail);
  } else {
    return null;
  }

  const { data } = await query.maybeSingle();
  return data || null;
}

async function syncUserRoleRow({ authUserId, email, role, passwordHash }) {
  const normalizedEmail = normalizeEmail(email);
  const payload = {
    auth_user_id: authUserId,
    email: normalizedEmail,
    role: normalizeRole(role),
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

  let role = normalizeRole(userRow.role);
  await linkFacultyProfileToAuthUser(userRow.auth_user_id, userRow.email);

  const facultyProfile = await getFacultyApprovalStatusByIdentity({
    authUserId: userRow.auth_user_id,
    email: userRow.email,
  });

  // Backfill role for legacy accounts that were approved in faculty table but still marked as viewer.
  if (facultyProfile?.is_approved && role !== "admin" && role !== "student") {
    role = "faculty";
    if (userRow.role !== "faculty") {
      await supabaseAdmin
        .from("users")
        .update({ role: "faculty" })
        .eq("auth_user_id", userRow.auth_user_id);
    }
  }

  if (role === "faculty") {
    if (!facultyProfile?.is_approved) {
      return res.status(403).json({ message: "Your faculty account is pending admin approval." });
    }
  }

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
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin" && adminSignupCode) {
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
    role: normalizedRole,
    passwordHash,
  });

  if (roleSyncError) {
    return res.status(500).json({ message: `Account created but role sync failed: ${roleSyncError.message}` });
  }

  if (normalizedRole === "faculty") {
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

  if (normalizedRole === "faculty") {
    return res.status(201).json({
      message: "Faculty account created. Wait for admin approval before signing in.",
      role: normalizedRole,
      user: {
        id: authUserId,
        email: normalizedEmail,
      },
    });
  }

  const backendToken = jwt.sign(
    {
      sub: authUserId,
      email: normalizedEmail,
      role: normalizedRole,
    },
    jwtSecret,
    { expiresIn: "7d" },
  );

  return res.status(201).json({
    message: "Account created successfully",
    access_token: backendToken,
    refresh_token: null,
    role: normalizedRole,
    user: {
      id: authUserId,
      email: normalizedEmail,
    },
  });
}

const STUDENT_EMAIL_DOMAINS = ["it.vjti.ac.in", "vjti.ac.in"];

function isStudentEmail(email) {
  const domain = email.split("@")[1] || "";
  return STUDENT_EMAIL_DOMAINS.some((d) => domain === d);
}

export async function googleLogin(req, res) {
  const parsed = googleLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid Google login payload" });
  }

  const { idToken, email, displayName, photoURL } = parsed.data;
  const normalizedEmail = normalizeEmail(email);
  const loginAsStudent = req.body.loginAsStudent === true;

  try {
    // Verify Firebase ID token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Check if the email matches the token
    if (decodedToken.email !== normalizedEmail) {
      return res.status(401).json({ message: "Email mismatch in Google authentication" });
    }

    // Enforce vjti.ac.in org domain for ALL Google logins
    const emailDomain = normalizedEmail.split("@")[1] || "";
    if (emailDomain !== "vjti.ac.in" && !emailDomain.endsWith(".vjti.ac.in")) {
      return res.status(403).json({
        message: "Only VJTI organization accounts (@it.vjti.ac.in or @vjti.ac.in) are allowed to sign in.",
      });
    }

    // If logging in as student, enforce subdomain restriction
    if (loginAsStudent) {
      if (!isStudentEmail(normalizedEmail)) {
        return res.status(403).json({
          message: "Only students with @it.vjti.ac.in or @vjti.ac.in email addresses can log in as students.",
        });
      }
    }

    // Check if user exists in our database
    const { data: existingUser, error: existingError } = await supabaseAdmin
      .from("users")
      .select("auth_user_id,email,role")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (existingError) {
      return res.status(500).json({ message: existingError.message });
    }

    let authUserId;
    let role;

    if (existingUser) {
      // User exists, use their existing role
      authUserId = existingUser.auth_user_id;
      role = normalizeRole(existingUser.role);

      // Student tab should map viewer users to student role.
      if (loginAsStudent && (role === "viewer" || role === "student")) {
        role = "student";
        if (existingUser.role !== "student") {
          await supabaseAdmin
            .from("users")
            .update({ role: "student" })
            .eq("auth_user_id", authUserId);
        }
      }
    } else {
      // New user — determine role
      authUserId = randomUUID();
      role = normalizeRole(loginAsStudent ? "student" : "viewer");
      
      const roleSyncError = await syncUserRoleRow({
        authUserId,
        email: normalizedEmail,
        role,
      });

      if (roleSyncError) {
        return res.status(500).json({ message: `Failed to sync user role: ${roleSyncError.message}` });
      }

      if (!loginAsStudent) {
        // Create faculty profile for new non-student Google users
        const { error: facultyError } = await supabaseAdmin.from("faculty").insert({
          user_id: authUserId,
          name: displayName,
          designation: "Faculty",
          department: "Computer Engineering and IT",
          email: normalizedEmail,
          phone: "",
          bio: "Faculty profile created via Google Sign-In.",
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
          "New Faculty Registration via Google",
          `${displayName} registered via Google Sign-In and profile approval is pending.`,
        );
      }
    }

    if (!loginAsStudent) {
      await linkFacultyProfileToAuthUser(authUserId, normalizedEmail);

      const facultyProfile = await getFacultyApprovalStatusByIdentity({ authUserId, email: normalizedEmail });

      if (facultyProfile?.is_approved && role !== "admin" && role !== "student") {
        role = "faculty";
        if (existingUser?.role !== "faculty") {
          await supabaseAdmin
            .from("users")
            .update({ role: "faculty" })
            .eq("auth_user_id", authUserId);
        }
      }

      if (role === "faculty") {
        if (!facultyProfile?.is_approved) {
          return res.status(403).json({ message: "Your faculty account is pending admin approval." });
        }
      }
    }

    const backendToken = jwt.sign(
      {
        sub: authUserId,
        email: normalizedEmail,
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
        id: authUserId,
        email: normalizedEmail,
        displayName,
        photoURL,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(401).json({ message: "Invalid Google authentication token" });
  }
}
