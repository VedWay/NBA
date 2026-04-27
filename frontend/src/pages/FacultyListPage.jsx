import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import FacultyList from "../components/FacultyList";
import { useFacultyList } from "../hooks/useFaculty";
import { useAuth } from "../context/AuthContext";
import { achievementApi } from "../api/facultyApi";
import { Search, Filter, Users, Building2, X, Award, ExternalLink } from "lucide-react";

export default function FacultyListPage() {
  const { token } = useAuth();
  const { data, isLoading, error } = useFacultyList(token);
  const { data: achievements = [], isLoading: isAchievementsLoading } = useQuery({
    queryKey: ["achievements", "public", "faculty-page"],
    queryFn: () => achievementApi.listPublic(),
  });
  const faculty = data || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDesignation, setSelectedDesignation] = useState("all");
  const prefersReducedMotion = useReducedMotion();

  const departments = useMemo(() => {
    const set = new Set(faculty.map((f) => f.department).filter(Boolean));
    return Array.from(set).sort();
  }, [faculty]);

  const designations = useMemo(() => {
    const set = new Set(faculty.map((f) => f.designation).filter(Boolean));
    return Array.from(set).sort();
  }, [faculty]);

  const filteredFaculty = useMemo(() => {
    const selectedDept = selectedDepartment.trim().toLowerCase();
    const selectedDesig = selectedDesignation.trim().toLowerCase();

    return faculty.filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (f.name || "").toLowerCase().includes(q) ||
        (f.email || "").toLowerCase().includes(q) ||
        (f.research_area || "").toLowerCase().includes(q) ||
        (f.department || "").toLowerCase().includes(q);
      const matchesDept =
        selectedDepartment === "all" ||
        (f.department || "").trim().toLowerCase() === selectedDept;
      const matchesDesig =
        selectedDesignation === "all" ||
        (f.designation || "").trim().toLowerCase() === selectedDesig;
      return matchesSearch && matchesDept && matchesDesig;
    });
  }, [faculty, searchQuery, selectedDepartment, selectedDesignation]);

  const facultyAchievements = useMemo(() => {
    const selectedDept = selectedDepartment.trim().toLowerCase();

    return (achievements || [])
      .filter((item) => {
        const hasFaculty = Boolean(item?.faculty?.name);
        if (!hasFaculty) return false;
        if (selectedDepartment === "all") return true;
        return (item.faculty?.department || "").trim().toLowerCase() === selectedDept;
      })
      .slice(0, 6);
  }, [achievements, selectedDepartment]);

  const hasActiveFilters = searchQuery || selectedDepartment !== "all" || selectedDesignation !== "all";

  const rollingAchievements = useMemo(() => {
    return (achievements || [])
      .filter((item) => Boolean(item?.title) && Boolean(item?.faculty?.name))
      .slice(0, 10);
  }, [achievements]);

  const rollingTrack = useMemo(() => {
    if (!rollingAchievements.length) return [];
    return [...rollingAchievements, ...rollingAchievements];
  }, [rollingAchievements]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("all");
    setSelectedDesignation("all");
  };

  return (
    <section className="pb-10">
      <motion.div
        className="campus-hero relative overflow-hidden px-4 py-14 md:px-8 md:py-20"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
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
      </motion.div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-rose-50/40 to-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 md:px-5">
            <div>
              <p className="campus-kicker">Rolling Highlights</p>
              <h2 className="text-lg font-bold text-slate-800">Live Faculty Achievements</h2>
            </div>
            <span className="rounded-full bg-[#9d2235]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#9d2235]">
              Auto Feed
            </span>
          </div>

          {!isAchievementsLoading && !rollingAchievements.length && (
            <div className="px-5 py-6 text-sm text-slate-500">No achievements to roll yet.</div>
          )}

          {isAchievementsLoading && (
            <div className="px-5 py-5">
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            </div>
          )}

          {!isAchievementsLoading && !!rollingAchievements.length && (
            <div className="overflow-hidden px-3 py-4 md:px-4">
              <motion.div
                className="flex w-max gap-3"
                animate={
                  prefersReducedMotion
                    ? {}
                    : {
                        x: ["0%", "-50%"],
                      }
                }
                transition={
                  prefersReducedMotion
                    ? {}
                    : {
                        duration: 28,
                        ease: "linear",
                        repeat: Infinity,
                      }
                }
              >
                {rollingTrack.map((item, index) => (
                  <article
                    key={`${item.id || item.title}-${index}`}
                    className="min-w-[280px] max-w-[320px] rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm"
                  >
                    <p className="line-clamp-1 text-sm font-bold text-slate-800">{item.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.faculty?.name}</p>
                    <div className="mt-2 inline-flex items-center rounded-full bg-[#9d2235]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9d2235]">
                      {item.media_type || "achievement"}
                    </div>
                  </article>
                ))}
              </motion.div>
            </div>
          )}
        </motion.section>

        {/* Search and Filters */}
        <motion.div
          className="mb-8 space-y-4"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
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
        </motion.div>

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
        {!isLoading && !error && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <FacultyList faculty={filteredFaculty} />
          </motion.div>
        )}

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="campus-kicker">Showcase</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-800">Latest Faculty Achievements</h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedDepartment === "all"
                  ? "Recent published faculty achievements"
                  : `Recent published achievements from ${selectedDepartment}`}
              </p>
            </div>
          </div>

          {isAchievementsLoading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />
              ))}
            </div>
          )}

          {!isAchievementsLoading && !facultyAchievements.length && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
              <Award className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-500">
                No faculty achievements found for the selected department.
              </p>
            </div>
          )}

          {!isAchievementsLoading && !!facultyAchievements.length && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {facultyAchievements.map((item, index) => (
                <motion.article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
                >
                  <div className="mb-3 inline-flex items-center rounded-full bg-[#9d2235]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#9d2235]">
                    {item.media_type || "achievement"}
                  </div>
                  <h3 className="line-clamp-2 text-base font-bold text-slate-800">{item.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-500">{item.summary || "No summary provided."}</p>
                  <p className="mt-3 text-xs font-semibold text-slate-700">
                    {item.faculty?.name}
                    {item.faculty?.department ? ` • ${item.faculty.department}` : ""}
                  </p>
                  {item.media_url && (
                    <a
                      href={item.media_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#9d2235] hover:underline"
                    >
                      View Proof <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
