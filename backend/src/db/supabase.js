import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables");
}

const hasServiceRoleKey = Boolean(
  supabaseServiceKey && supabaseServiceKey !== supabaseAnonKey && !supabaseServiceKey.startsWith("sb_publishable_"),
);

if (!hasServiceRoleKey) {
  console.warn("Running in publishable-key mode: admin operations rely on backend JWT role checks and RLS policies.");
}

export const supabaseAdmin = createClient(supabaseUrl, hasServiceRoleKey ? supabaseServiceKey : supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
