import { supabaseAdmin } from "../db/supabase.js";

export async function listMyNotifications(req, res) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("recipient_user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json(data ?? []);
}

export async function markNotificationRead(req, res) {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_user_id", req.user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  if (!data) {
    return res.status(404).json({ message: "Notification not found" });
  }

  return res.json(data);
}
