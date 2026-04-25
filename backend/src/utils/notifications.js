import { supabaseAdmin } from "../db/supabase.js";
import { emitToUser } from "../realtime/wsHub.js";

export async function notifyAdmins(title, message) {
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
