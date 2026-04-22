import { z } from "zod";
import { dbQuery, supabaseAdmin } from "../db/supabase.js";

const mediaTypes = ["image", "pdf", "youtube", "link"];

const achievementSchema = z.object({
  faculty_id: z.string().uuid().optional().nullable(),
  title: z.string().min(2),
  summary: z.string().optional().default(""),
  media_type: z.enum(mediaTypes),
  media_url: z.string().url(),
  thumbnail_url: z.string().url().optional().or(z.literal("")),
  display_order: z.number().int().optional().default(0),
  is_published: z.boolean().optional().default(true),
  published_from: z.string().datetime().optional().nullable(),
  published_to: z.string().datetime().optional().nullable(),
});

function toNullable(value) {
  if (value === undefined || value === null || value === "") return null;
  return value;
}

async function attachFaculty(rows) {
  const uniqueFacultyIds = Array.from(new Set((rows || []).map((row) => row.faculty_id).filter(Boolean)));

  if (!uniqueFacultyIds.length) {
    return (rows || []).map((row) => ({ ...row, faculty: null }));
  }

  const placeholders = uniqueFacultyIds.map(() => "?").join(",");
  const facultyRows = await dbQuery(
    `SELECT id, name, designation, department, photo_url FROM faculty WHERE id IN (${placeholders})`,
    uniqueFacultyIds,
  );

  const facultyMap = new Map((facultyRows || []).map((faculty) => [faculty.id, faculty]));
  return (rows || []).map((row) => ({
    ...row,
    faculty: row.faculty_id ? facultyMap.get(row.faculty_id) || null : null,
  }));
}

export async function listPublicAchievements(_req, res) {
  const nowTs = Date.now();

  const { data, error } = await supabaseAdmin
    .from("latest_achievements")
    .select("id,faculty_id,title,summary,media_type,media_url,thumbnail_url,display_order,published_from,published_to,created_at")
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const visibleRows = (data ?? []).filter((row) => {
    const fromOk = !row.published_from || new Date(row.published_from).getTime() <= nowTs;
    const toOk = !row.published_to || new Date(row.published_to).getTime() >= nowTs;
    return fromOk && toOk;
  });

  const rows = await attachFaculty(visibleRows.slice(0, 12));
  return res.json(rows);
}

export async function listAchievementsAdmin(_req, res) {
  const { data, error } = await supabaseAdmin
    .from("latest_achievements")
    .select("id,faculty_id,title,summary,media_type,media_url,thumbnail_url,display_order,is_published,published_from,published_to,created_at,updated_at")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const rows = await attachFaculty(data ?? []);
  return res.json(rows);
}

export async function createAchievement(req, res) {
  const parsed = achievementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const payload = {
    ...parsed.data,
    faculty_id: toNullable(parsed.data.faculty_id),
    thumbnail_url: toNullable(parsed.data.thumbnail_url),
    published_from: toNullable(parsed.data.published_from),
    published_to: toNullable(parsed.data.published_to),
    created_by: req.user.id,
    updated_by: req.user.id,
  };

  const { data, error } = await supabaseAdmin
    .from("latest_achievements")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const [row] = await attachFaculty([data]);
  return res.status(201).json(row);
}

export async function updateAchievement(req, res) {
  const parsed = achievementSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const updatePayload = {
    ...parsed.data,
    updated_by: req.user.id,
  };

  if ("faculty_id" in updatePayload) updatePayload.faculty_id = toNullable(updatePayload.faculty_id);
  if ("thumbnail_url" in updatePayload) updatePayload.thumbnail_url = toNullable(updatePayload.thumbnail_url);
  if ("published_from" in updatePayload) updatePayload.published_from = toNullable(updatePayload.published_from);
  if ("published_to" in updatePayload) updatePayload.published_to = toNullable(updatePayload.published_to);

  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from("latest_achievements")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const [row] = await attachFaculty([data]);
  return res.json(row);
}

export async function deleteAchievement(req, res) {
  const { id } = req.params;

  const { error } = await supabaseAdmin.from("latest_achievements").delete().eq("id", id);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.status(204).send();
}
