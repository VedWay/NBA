import { supabaseAdmin } from "../db/supabase.js";

async function resolveActorAuthUserId(user) {
  if (!user) return null;

  if (user.id) {
    const { data: byAuthId } = await supabaseAdmin
      .from("users")
      .select("auth_user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (byAuthId?.auth_user_id) return byAuthId.auth_user_id;
  }

  if (user.id) {
    const { data: byPrimaryId } = await supabaseAdmin
      .from("users")
      .select("auth_user_id")
      .eq("id", user.id)
      .maybeSingle();
    if (byPrimaryId?.auth_user_id) return byPrimaryId.auth_user_id;
  }

  if (user.email) {
    const normalizedEmail = String(user.email).trim().toLowerCase();
    const { data: byEmail } = await supabaseAdmin
      .from("users")
      .select("auth_user_id")
      .ilike("email", normalizedEmail)
      .maybeSingle();
    if (byEmail?.auth_user_id) return byEmail.auth_user_id;
  }

  return null;
}

export async function listMyNotifications(req, res) {
  const unreadOnly = String(req.query.unread || "false").toLowerCase() === "true";
  const limit = Math.min(Number(req.query.limit || 100), 300);
  const actorAuthUserId = await resolveActorAuthUserId(req.user);

  if (!actorAuthUserId) {
    return res.json([]);
  }

  let query = supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("recipient_user_id", actorAuthUserId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json(data ?? []);
}

export async function markAllNotificationsRead(req, res) {
  const actorAuthUserId = await resolveActorAuthUserId(req.user);

  if (!actorAuthUserId) {
    return res.json({ success: true });
  }

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_user_id", actorAuthUserId)
    .eq("is_read", false);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json({ success: true });
}

export async function markNotificationRead(req, res) {
  const { id } = req.params;
  const actorAuthUserId = await resolveActorAuthUserId(req.user);

  if (!actorAuthUserId) {
    return res.status(404).json({ message: "Notification not found" });
  }

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_user_id", actorAuthUserId)
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
