import { useState, useMemo } from "react";
import FacultyList from "../components/FacultyList";
import { useFacultyList } from "../hooks/useFaculty";
import { useAuth } from "../context/AuthContext";
import { Search, Filter, Users, Building2, X } from "lucide-react";

export default function FacultyListPage() {
  const { token } = useAuth();
  const { data, isLoading, error } = useFacultyList(token);
  const faculty = data || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDesignation, setSelectedDesignation] = useState("all");

  const departments = useMemo(() => {
    const set = new Set(faculty.map((f) => f.department).filter(Boolean));
    return Array.from(set).sort();
  }, [faculty]);

  const designations = useMemo(() => {
    const set = new Set(faculty.map((f) => f.designation).filter(Boolean));
    return Array.from(set).sort();
  }, [faculty]);

  const filteredFaculty = useMemo(() => {
    return faculty.filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (f.name || "").toLowerCase().includes(q) ||
        (f.email || "").toLowerCase().includes(q) ||
        (f.research_area || "").toLowerCase().includes(q) ||
        (f.department || "").toLowerCase().includes(q);
      const matchesDept = selectedDepartment === "all" || f.department === selectedDepartment;
      const matchesDesig = selectedDesignation === "all" || f.designation === selectedDesignation;
      return matchesSearch && matchesDept && matchesDesig;
    });
  }, [faculty, searchQuery, selectedDepartment, selectedDesignation]);

  const hasActiveFilters = searchQuery || selectedDepartment !== "all" || selectedDesignation !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("all");
    setSelectedDesignation("all");
  };

  return (
    <section className="pb-10">
      <div className="campus-hero relative overflow-hidden px-4 py-14 md:px-8 md:py-20">
        <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-[#c3475b]/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="campus-kicker">People</p>
          <h1 className="mt-3 text-4xl font-extrabold text-white md:text-5xl">Faculty Directory</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-200 md:text-lg">
            Browse approved faculty profiles curated for institutional visibility and NBA accreditation documentation.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 font-semibold text-white backdrop-blur-sm">
              <Users className="h-4 w-4" />
              {isLoading ? "Loading..." : `${faculty.length} Profiles`}
            </span>
            <span className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 font-semibold text-slate-100 backdrop-blur-sm">
              <Building2 className="h-4 w-4" />
              {isLoading ? "..." : `${departments.length} Departments`}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, department, or research area..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 shadow-sm transition focus:border-[#9d2235]/40 focus:outline-none focus:ring-2 focus:ring-[#9d2235]/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Filter className="h-4 w-4" /> Filters:
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-[#9d2235]/40 focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-[#9d2235]/40 focus:outline-none"
            >
              <option value="all">All Designations</option>
              {designations.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                <X className="h-3 w-3" /> Clear Filters
              </button>
            )}
            {!isLoading && (
              <span className="ml-auto text-xs font-semibold text-slate-400">
                {filteredFaculty.length} of {faculty.length} profiles
              </span>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50"
              />
            ))}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-5 py-4 text-rose-700 shadow-sm">
            {error.message}
          </div>
        )}
        {!isLoading && !error && <FacultyList faculty={filteredFaculty} />}
      </div>
    </section>
  );
}
