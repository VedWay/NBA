import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "../api/studentApi";
import { useAuth } from "../context/AuthContext";

export default function StudentDeskPage() {
  const { token, role } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const [achievementForm, setAchievementForm] = useState({
    student_id: "",
    category_id: "",
    title: "",
    level: "",
    position: "",
  });

  const [fileForm, setFileForm] = useState({
    achievement_id: "",
    file_path: "",
    file_type: "proof",
  });

  const { data: refData } = useQuery({
    queryKey: ["students", "reference"],
    queryFn: () => studentApi.listReferenceData(),
  });

  const { data: adminAchievements = [] } = useQuery({
    queryKey: ["students", "achievements", "admin"],
    queryFn: () => studentApi.listAdminAchievements(token),
    enabled: Boolean(token),
  });

  const studentOptions = useMemo(() => {
    const byId = new Map();
    for (const row of adminAchievements) {
      if (!row.student_id) continue;
      if (!byId.has(row.student_id)) {
        byId.set(row.student_id, {
          student_id: row.student_id,
          student_name: row.student_name,
          roll_no: row.roll_no,
          dept_name: row.dept_name,
          year_name: row.year_name,
        });
      }
    }
    return Array.from(byId.values()).sort((a, b) => String(a.student_name || "").localeCompare(String(b.student_name || "")));
  }, [adminAchievements]);

  const createAchievement = useMutation({
    mutationFn: (body) => studentApi.createAchievement(body, token),
    onSuccess: () => {
      setMessage("Achievement submitted successfully.");
      setAchievementForm({ student_id: "", category_id: "", title: "", level: "", position: "" });
      queryClient.invalidateQueries({ queryKey: ["students", "achievements"] });
      queryClient.invalidateQueries({ queryKey: ["students", "achievements", "public"] });
    },
    onError: (error) => setMessage(error.message || "Failed to submit achievement."),
  });

  const uploadFile = useMutation({
    mutationFn: (body) => studentApi.uploadFile(body, token),
    onSuccess: () => {
      setMessage("File link attached successfully.");
      setFileForm({ achievement_id: "", file_path: "", file_type: "proof" });
    },
    onError: (error) => setMessage(error.message || "Failed to attach file."),
  });

  const recentAchievements = adminAchievements.slice(0, 12);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <header className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-400 to-amber-300 p-5 text-slate-900">
        <h1 className="text-3xl font-black">Student Desk</h1>
        <p className="mt-1 text-sm font-medium text-slate-700">
          Submit student achievements and attach proof links. Role: {role}
        </p>
      </header>

      {message && <p className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700">{message}</p>}

      <div className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createAchievement.mutate({
              student_id: Number(achievementForm.student_id),
              category_id: achievementForm.category_id ? Number(achievementForm.category_id) : null,
              title: achievementForm.title,
              level: achievementForm.level,
              position: achievementForm.position,
            });
          }}
          className="space-y-3 rounded-2xl border border-slate-300 bg-white p-5"
        >
          <h2 className="text-lg font-bold">Submit Achievement</h2>

          <label className="block text-sm font-semibold text-slate-700">
            Student
            <select
              value={achievementForm.student_id}
              onChange={(event) => setAchievementForm((current) => ({ ...current, student_id: event.target.value }))}
              className="liquid-control mt-1 w-full rounded-lg px-3 py-2"
              required
            >
              <option value="">Select Student</option>
              {studentOptions.map((student) => (
                <option key={student.student_id} value={student.student_id}>
                  {student.student_name} ({student.roll_no || "No Roll"}) - {student.dept_name || "Dept"}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Category
            <select
              value={achievementForm.category_id}
              onChange={(event) => setAchievementForm((current) => ({ ...current, category_id: event.target.value }))}
              className="liquid-control mt-1 w-full rounded-lg px-3 py-2"
            >
              <option value="">No Category</option>
              {(refData?.categories || []).map((category) => (
                <option key={category.category_id} value={category.category_id}>{category.category_name}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Title
            <input
              value={achievementForm.title}
              onChange={(event) => setAchievementForm((current) => ({ ...current, title: event.target.value }))}
              className="liquid-control mt-1 w-full rounded-lg px-3 py-2"
              placeholder="Achievement title"
              required
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Level
              <input
                value={achievementForm.level}
                onChange={(event) => setAchievementForm((current) => ({ ...current, level: event.target.value }))}
                className="liquid-control mt-1 w-full rounded-lg px-3 py-2"
                placeholder="Institute / State / National"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Position
              <input
                value={achievementForm.position}
                onChange={(event) => setAchievementForm((current) => ({ ...current, position: event.target.value }))}
                className="liquid-control mt-1 w-full rounded-lg px-3 py-2"
                placeholder="Winner / Rank"
              />
            </label>
          </div>

          <button disabled={createAchievement.isPending} className="liquid-button rounded-lg px-4 py-2 text-sm font-semibold text-white">
            {createAchievement.isPending ? "Submitting..." : "Submit Achievement"}
          </button>
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            uploadFile.mutate({
              achievement_id: Number(fileForm.achievement_id),
              file_path: fileForm.file_path,
              file_type: fileForm.file_type,
            });
          }}
          className="space-y-3 rounded-2xl border border-slate-300 bg-white p-5"
        >
          <h2 className="text-lg font-bold">Attach Proof Link</h2>

          <label className="block text-sm font-semibold text-slate-700">
            Achievement
            <select
              value={fileForm.achievement_id}
              onChange={(event) => setFileForm((current) => ({ ...current, achievement_id: event.target.value }))}
              className="liquid-control mt-1 w-full rounded-lg px-3 py-2"
              required
            >
              <option value="">Select Achievement</option>
              {recentAchievements.map((item) => (
                <option key={item.achievement_id} value={item.achievement_id}>
                  #{item.achievement_id} - {item.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            File URL / Drive Link
            <input
              type="url"
              value={fileForm.file_path}
              onChange={(event) => setFileForm((current) => ({ ...current, file_path: event.target.value }))}
              className="liquid-control mt-1 w-full rounded-lg px-3 py-2"
              placeholder="https://..."
              required
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            File Type
            <select
              value={fileForm.file_type}
              onChange={(event) => setFileForm((current) => ({ ...current, file_type: event.target.value }))}
              className="liquid-control mt-1 w-full rounded-lg px-3 py-2"
            >
              <option value="proof">Proof</option>
              <option value="certificate">Certificate</option>
              <option value="report">Report</option>
              <option value="other">Other</option>
            </select>
          </label>

          <button disabled={uploadFile.isPending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            {uploadFile.isPending ? "Uploading..." : "Attach File"}
          </button>
        </form>
      </div>

      <section className="rounded-2xl border border-slate-300 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">Recent Student Achievements</h2>
        {!recentAchievements.length && <p className="text-sm text-slate-600">No achievements yet.</p>}
        {!!recentAchievements.length && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700">
                  <th className="px-2 py-2">ID</th>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Student</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAchievements.map((item) => (
                  <tr key={item.achievement_id} className="border-b border-slate-100">
                    <td className="px-2 py-2">{item.achievement_id}</td>
                    <td className="px-2 py-2">{item.title}</td>
                    <td className="px-2 py-2">{item.student_name || "-"}</td>
                    <td className="px-2 py-2">{item.category_name || "-"}</td>
                    <td className="px-2 py-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{item.status || "pending"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
