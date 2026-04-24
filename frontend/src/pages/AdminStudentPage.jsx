import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "../api/studentApi";
import { useAuth } from "../context/AuthContext";

const statusChoices = ["pending", "approved", "rejected"];

export default function AdminStudentPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const [studentForm, setStudentForm] = useState({
    name: "",
    roll_no: "",
    department_id: "",
    year_id: "",
  });

  const [statusDrafts, setStatusDrafts] = useState({});

  const { data: refData } = useQuery({
    queryKey: ["students", "reference"],
    queryFn: () => studentApi.listReferenceData(),
  });

  const { data: achievements = [], isLoading, error } = useQuery({
    queryKey: ["students", "achievements", "admin"],
    queryFn: () => studentApi.listAdminAchievements(token),
    enabled: Boolean(token),
  });

  const createStudent = useMutation({
    mutationFn: (body) => studentApi.createStudent(body, token),
    onSuccess: () => {
      setMessage("Student created successfully.");
      setStudentForm({ name: "", roll_no: "", department_id: "", year_id: "" });
      queryClient.invalidateQueries({ queryKey: ["students", "achievements", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["students", "reference"] });
    },
    onError: (err) => setMessage(err.message || "Failed to create student."),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => studentApi.updateAchievementStatus(id, status, token),
    onSuccess: () => {
      setMessage("Achievement status updated.");
      queryClient.invalidateQueries({ queryKey: ["students", "achievements", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["students", "achievements", "public"] });
    },
    onError: (err) => setMessage(err.message || "Failed to update status."),
  });

  const grouped = useMemo(() => {
    const pending = [];
    const approved = [];
    const rejected = [];

    for (const item of achievements) {
      const normalized = String(item.status || "pending").toLowerCase();
      if (normalized === "approved") approved.push(item);
      else if (normalized === "rejected") rejected.push(item);
      else pending.push(item);
    }

    return { pending, approved, rejected };
  }, [achievements]);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
      <header className="rounded-xl border border-slate-300 bg-white p-5">
        <h1 className="text-3xl font-black text-slate-900">Admin Student Section</h1>
        <p className="mt-1 text-sm text-slate-600">Create students and approve/reject student achievements.</p>
      </header>

      {message && <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-slate-700">{message}</p>}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          createStudent.mutate({
            name: studentForm.name,
            roll_no: studentForm.roll_no,
            department_id: studentForm.department_id ? Number(studentForm.department_id) : null,
            year_id: studentForm.year_id ? Number(studentForm.year_id) : null,
          });
        }}
        className="grid gap-3 rounded-xl border border-slate-300 bg-white p-5 md:grid-cols-2"
      >
        <h2 className="text-xl font-bold md:col-span-2">Create Student</h2>

        <label className="text-sm font-semibold text-slate-700">
          Name
          <input
            value={studentForm.name}
            onChange={(event) => setStudentForm((current) => ({ ...current, name: event.target.value }))}
            className="liquid-control mt-1 w-full rounded-lg px-3 py-2"
            required
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Roll Number
          <input
            value={studentForm.roll_no}
            onChange={(event) => setStudentForm((current) => ({ ...current, roll_no: event.target.value }))}
            className="liquid-control mt-1 w-full rounded-lg px-3 py-2"
            required
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Department
          <select
            value={studentForm.department_id}
            onChange={(event) => setStudentForm((current) => ({ ...current, department_id: event.target.value }))}
            className="liquid-control mt-1 w-full rounded-lg px-3 py-2"
          >
            <option value="">Select Department</option>
            {(refData?.departments || []).map((department) => (
              <option key={department.department_id} value={department.department_id}>{department.dept_name}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Year
          <select
            value={studentForm.year_id}
            onChange={(event) => setStudentForm((current) => ({ ...current, year_id: event.target.value }))}
            className="liquid-control mt-1 w-full rounded-lg px-3 py-2"
          >
            <option value="">Select Year</option>
            {(refData?.years || []).map((year) => (
              <option key={year.year_id} value={year.year_id}>{year.year_name}</option>
            ))}
          </select>
        </label>

        <button disabled={createStudent.isPending} className="liquid-button rounded-lg px-4 py-2 text-sm font-semibold text-white md:col-span-2">
          {createStudent.isPending ? "Creating..." : "Create Student"}
        </button>
      </form>

      {isLoading && <p className="rounded-lg bg-white px-4 py-3 text-sm text-slate-600">Loading achievements...</p>}
      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error.message}</p>}

      {!isLoading && !error && (
        <div className="grid gap-5 xl:grid-cols-3">
          {[
            { key: "pending", title: "Pending", items: grouped.pending },
            { key: "approved", title: "Approved", items: grouped.approved },
            { key: "rejected", title: "Rejected", items: grouped.rejected },
          ].map((group) => (
            <section key={group.key} className="rounded-xl border border-slate-300 bg-white p-4">
              <h2 className="mb-3 text-lg font-bold">{group.title} ({group.items.length})</h2>
              <div className="space-y-3">
                {!group.items.length && <p className="text-sm text-slate-500">No items.</p>}
                {group.items.map((item) => {
                  const currentDraft = statusDrafts[item.achievement_id] || item.status || "pending";
                  return (
                    <article key={item.achievement_id} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-600">{item.student_name || "-"} | {item.roll_no || "-"}</p>
                      <p className="text-xs text-slate-600">Category: {item.category_name || "-"}</p>

                      <div className="mt-2 flex gap-2">
                        <select
                          value={currentDraft}
                          onChange={(event) => setStatusDrafts((current) => ({ ...current, [item.achievement_id]: event.target.value }))}
                          className="liquid-control flex-1 rounded px-2 py-1 text-xs"
                        >
                          {statusChoices.map((choice) => (
                            <option key={choice} value={choice}>{choice}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => updateStatus.mutate({ id: item.achievement_id, status: currentDraft })}
                          disabled={updateStatus.isPending}
                          className="rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white"
                        >
                          Save
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
