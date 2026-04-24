import { apiFetch } from "./client";

export const studentApi = {
  listPublicAchievements: () => apiFetch("/student/achievements/public"),
  listReferenceData: () => apiFetch("/student/reference"),
  listAdminAchievements: (token) => apiFetch("/student/achievements/admin", { token }),
  createStudent: (body, token) => apiFetch("/student/students", { method: "POST", body, token }),
  createAchievement: (body, token) => apiFetch("/student/achievements", { method: "POST", body, token }),
  updateAchievementStatus: (id, status, token) =>
    apiFetch(`/student/achievements/${id}/status`, { method: "PUT", body: { status }, token }),
  uploadFile: (body, token) => apiFetch("/student/files", { method: "POST", body, token }),
};
