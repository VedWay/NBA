import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/facultyApi";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, FolderSearch, Search, RotateCcw, Loader2, ExternalLink, Calendar } from "lucide-react";

export default function AdminQueryPage() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({
    q: "",
    designation: "",
    department: "",
    year: "",
    table: "all",
    status: "all",
    from: "",
    to: "",
  });

  const queryParams = useMemo(() => ({ ...filters, limit: 300 }), [filters]);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-query", queryParams],
    queryFn: () => adminApi.query(token, queryParams),
    enabled: Boolean(token),
  });

  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-[#9d2235]/40 focus:outline-none focus:ring-2 focus:ring-[#9d2235]/10";

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <FolderSearch className="h-5 w-5 text-[#9d2235]" />
            <h1 className="text-2xl font-bold text-slate-800">Query Search</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/history" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:text-[#9d2235]">Approval History</Link>
          <Link to="/admin/faculty" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:text-[#9d2235]">Faculty Directory</Link>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Search Filters</h2>
            <p className="text-xs text-slate-500">Search across all faculty records, publications, projects, awards, and more.</p>
          </div>
          <button
            onClick={() => setFilters({ q: "", designation: "", department: "", year: "", table: "all", status: "all", from: "", to: "" })}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset All
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.q}
              onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
              className={`${inputClass} pl-9`}
              placeholder="Search keyword..."
            />
          </div>
          <input
            value={filters.designation}
            onChange={(e) => setFilters((s) => ({ ...s, designation: e.target.value }))}
            className={inputClass}
            placeholder="Designation"
          />
          <input
            value={filters.department}
            onChange={(e) => setFilters((s) => ({ ...s, department: e.target.value }))}
            className={inputClass}
            placeholder="Department"
          />
          <input
            type="number"
            min="1900"
            max="2100"
            value={filters.year}
            onChange={(e) => setFilters((s) => ({ ...s, year: e.target.value }))}
            className={inputClass}
            placeholder="Year (e.g. 2025)"
          />
          <select value={filters.table} onChange={(e) => setFilters((s) => ({ ...s, table: e.target.value }))} className={inputClass}>
            <option value="all">All Categories</option>
            <option value="faculty">Faculty Profiles</option>
            <option value="publications">Publications</option>
            <option value="projects">Projects</option>
            <option value="patents">Patents</option>
            <option value="books">Books</option>
            <option value="awards">Awards</option>
            <option value="fdp">FDP/Workshops</option>
            <option value="consultancy">Consultancy</option>
            <option value="moocs">MOOCs</option>
            <option value="collaborations">Collaborations</option>
            <option value="miscellaneous_items">Miscellaneous</option>
          </select>
          <select value={filters.status} onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))} className={inputClass}>
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:col-span-2 xl:col-span-2">
            <input type="date" value={filters.from} onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))} className={inputClass} />
            <span className="flex items-center justify-center text-xs text-slate-400">to</span>
            <input type="date" value={filters.to} onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Searching...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error.message}</div>
      )}

      {!isLoading && !error && (
        <div>
          <p className="mb-4 text-xs font-semibold text-slate-400">
            {data.length} result{data.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {data.map((row) => (
              <article key={`${row.table}-${row.id}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">{row.table}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${row.is_approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {row.is_approved ? "Approved" : "Pending"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800">{row.label}</h3>
                <p className="mt-1 text-sm text-slate-600">{row.faculty?.name || "Unknown Faculty"}</p>
                <p className="text-xs text-slate-400">{row.faculty?.designation || "—"} &middot; {row.faculty?.department || "—"}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
                  </span>
                  {row.faculty_id && (
                    <Link to={`/faculty/${row.faculty_id}?preview=viewer`} className="flex items-center gap-1 text-xs font-semibold text-[#9d2235] transition hover:underline">
                      View Profile <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </article>
            ))}
            {!data.length && <p className="col-span-full py-12 text-center text-sm text-slate-400">No results found for your query filters.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
