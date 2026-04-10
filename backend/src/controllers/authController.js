import { supabaseAdmin } from "../db/supabase.js";
import { z } from "zod";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "dev-nba-jwt-secret";
const adminSignupCode = process.env.ADMIN_SIGNUP_CODE || "";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

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

function mapSupabaseNetworkError(error) {
  const message = String(error?.message || "");
  const causeMessage = String(error?.cause?.message || "");
  const code = error?.cause?.code;

  if (message.includes("fetch failed") || code === "ENOTFOUND" || causeMessage.includes("ENOTFOUND")) {
    return "Supabase is unreachable. Check SUPABASE_URL in backend/.env (host not found) and your internet connection.";
  }

  return null;
}

function mapSupabaseAuthError(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("rate limit") || message.includes("email rate limit exceeded")) {
    return {
      status: 429,
      message:
        "Email rate limit exceeded. Wait a minute and retry, or reduce email confirmation traffic in Supabase Auth settings.",
    };
  }
  return null;
}

async function callSupabaseAuth(path, payload) {
  const response = await fetch(`${supabaseUrl}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text || "Unknown auth response" };
  }

  if (!response.ok) {
    const error = new Error(body?.msg || body?.message || "Supabase Auth request failed");
    error.status = response.status;
    throw error;
  }

  return body;
}

async function syncUserRoleRow({ authUserId, email, role }) {
  const { error } = await supabaseAdmin.from("users").upsert(
    {
      auth_user_id: authUserId,
      email,
      role,
    },
    { onConflict: "auth_user_id" },
  );

  return error;
}

async function resolveEffectiveRole({ authUserId, fallbackRole }) {
  const { data } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  return data?.role || fallbackRole || "viewer";
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid credentials payload" });
  }

  const { email, password } = parsed.data;

  let authResult;
  try {
    authResult = await callSupabaseAuth("token?grant_type=password", { email, password });
  } catch (err) {
    const friendly = mapSupabaseNetworkError(err);
    if (friendly) {
      return res.status(502).json({ message: friendly });
    }
    const authError = mapSupabaseAuthError(err);
    if (authError) {
      return res.status(authError.status).json({ message: authError.message });
    }
    return res.status(err.status || 401).json({ message: err.message || "Login failed" });
  }

  const metadataRole = authResult.user?.user_metadata?.role || "viewer";

  const syncError = await syncUserRoleRow({
    authUserId: authResult.user.id,
    email: authResult.user.email,
    role: metadataRole,
  });
  const role = await resolveEffectiveRole({
    authUserId: authResult.user.id,
    fallbackRole: metadataRole,
  });


  if (syncError) {
    return res.status(500).json({ message: `Login succeeded but user role sync failed: ${syncError.message}` });
  }
  const backendToken = jwt.sign(
    {
      sub: authResult.user.id,
      email: authResult.user.email,
      role,
    },
    jwtSecret,
    { expiresIn: "7d" },
  );

  return res.json({
    access_token: backendToken,
    refresh_token: authResult.refresh_token,
    role,
    user: {
      id: authResult.user.id,
      email: authResult.user.email,
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

  let signupResult;
  try {
    signupResult = await callSupabaseAuth("signup", {
      email,
      password,
      data: {
        name,
        role,
      },
    });
  } catch (err) {
    const friendly = mapSupabaseNetworkError(err);
    if (friendly) {
      return res.status(502).json({ message: friendly });
    }
    const authError = mapSupabaseAuthError(err);
    if (authError) {
      return res.status(authError.status).json({ message: authError.message });
    }
    return res.status(err.status || 400).json({ message: err.message || "Account creation failed" });
  }

  const authUserId = signupResult.id || signupResult.user?.id;
  if (!authUserId) {
    return res.status(400).json({ message: "Account creation failed" });
  }

  const roleSyncError = await syncUserRoleRow({
    authUserId,
    email,
    role,
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
      email,
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
  }

  const backendToken = jwt.sign(
    {
      sub: authUserId,
      email,
      role,
    },
    jwtSecret,
    { expiresIn: "7d" },
  );

  return res.status(201).json({
    message: "Account created successfully",
    access_token: backendToken,
    refresh_token: signupResult.refresh_token ?? null,
    role,
    user: {
      id: authUserId,
      email,
    },
  });
}
