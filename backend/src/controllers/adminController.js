import { supabaseAdmin } from "../db/supabase.js";

const TABLES = ["faculty", "publications", "fdp", "projects", "patents", "books", "collaborations", "consultancy", "awards", "moocs", "qualifications", "research_proofs"];

async function resolveRecipientUserId(table, record) {
  if (table === "faculty") {
    return record.user_id ?? null;
  }

  if (!record.faculty_id) return null;

  const { data } = await supabaseAdmin.from("faculty").select("user_id").eq("id", record.faculty_id).maybeSingle();
  return data?.user_id ?? null;
}

async function createNotification(recipientUserId, title, message) {
  if (!recipientUserId) return;
  await supabaseAdmin.from("notifications").insert({
    recipient_user_id: recipientUserId,
    title,
    message,
    is_read: false,
  });
}

export async function getPendingEntries(_req, res) {
  const result = {};

  for (const table of TABLES) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    result[table] = data;
  }

  return res.json(result);
}

export async function approveEntry(req, res) {
  const { table, id } = req.params;
  if (!TABLES.includes(table)) {
    return res.status(400).json({ message: "Unsupported table" });
  }

  const { data: beforeRecord } = await supabaseAdmin.from(table).select("*").eq("id", id).maybeSingle();

  const { data, error } = await supabaseAdmin
    .from(table)
    .update({
      is_approved: true,
      approved_by: req.user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const recipientUserId = await resolveRecipientUserId(table, beforeRecord || data);
  await createNotification(
    recipientUserId,
    "Entry Approved",
    `Your ${table} entry has been approved by admin and is now visible in viewer profile.`,
  );

  return res.json(data);
}

export async function rejectEntry(req, res) {
  const { table, id } = req.params;
  if (!TABLES.includes(table)) {
    return res.status(400).json({ message: "Unsupported table" });
  }

  const { data: beforeRecord } = await supabaseAdmin.from(table).select("*").eq("id", id).maybeSingle();

  const { error } = await supabaseAdmin.from(table).delete().eq("id", id);
  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const recipientUserId = await resolveRecipientUserId(table, beforeRecord);
  await createNotification(recipientUserId, "Entry Rejected", `Your ${table} entry was rejected by admin.`);

  return res.status(204).send();
}

export async function getAuditTimeline(req, res) {
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const { data, error } = await supabaseAdmin
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.json(data ?? []);
}
