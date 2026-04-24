import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "../api/studentApi";

function getStatusColor(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") return "bg-emerald-100 text-emerald-800";
  if (normalized === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-800";
}

export default function StudentAchievementsPage() {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: achievements = [], isLoading, error } = useQuery({
    queryKey: ["students", "achievements", "public"],
    queryFn: () => studentApi.listPublicAchievements(),
  });

  const categories = useMemo(() => {
    const all = new Set(achievements.map((item) => item.category_name).filter(Boolean));
    return ["all", ...Array.from(all).sort((a, b) => a.localeCompare(b))];
  }, [achievements]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return achievements.filter((item) => {
      const categoryOk = categoryFilter === "all" || item.category_name === categoryFilter;
      if (!categoryOk) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        item.title,
        item.student_name,
        item.roll_no,
        item.dept_name,
        item.year_name,
        item.category_name,
        item.level,
        item.position,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [achievements, categoryFilter, query]);

  return (
    <section className="pb-10">
      <div className="campus-hero relative overflow-hidden px-4 py-14 md:px-8 md:py-16">
        <div className="relative mx-auto max-w-7xl">
          <p className="campus-kicker">Student Corner</p>
          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">Student Achievements</h1>
          <p className="mt-3 max-w-3xl text-lg text-slate-100">
            Discover approved student milestones across departments, categories, and years.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-8 md:px-8">
        <div className="grid gap-3 md:grid-cols-[1fr_260px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, student, roll number, category..."
            className="liquid-control rounded-lg px-4 py-2.5 text-sm"
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="liquid-control rounded-lg px-4 py-2.5 text-sm"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All categories" : category}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <p className="rounded-xl bg-white p-4 text-sm text-slate-600">Loading achievements...</p>}
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error.message}</p>}

        {!isLoading && !error && !filtered.length && (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
            No student achievements found for this filter.
          </p>
        )}

        {!!filtered.length && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <article key={item.achievement_id} className="glass-card rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(item.status)}`}>
                    {item.status || "pending"}
                  </span>
                  <span className="text-xs text-slate-500">#{item.achievement_id}</span>
                </div>

                <h2 className="text-lg font-bold leading-tight text-slate-900">{item.title}</h2>

                <div className="mt-3 space-y-1 text-sm text-slate-700">
                  <p><span className="font-semibold">Student:</span> {item.student_name || "-"}</p>
                  <p><span className="font-semibold">Roll:</span> {item.roll_no || "-"}</p>
                  <p><span className="font-semibold">Dept:</span> {item.dept_name || "-"}</p>
                  <p><span className="font-semibold">Year:</span> {item.year_name || "-"}</p>
                  <p><span className="font-semibold">Category:</span> {item.category_name || "-"}</p>
                  <p><span className="font-semibold">Level:</span> {item.level || "-"}</p>
                  <p><span className="font-semibold">Position:</span> {item.position || "-"}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
