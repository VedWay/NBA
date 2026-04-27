import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import FacultyList from "../components/FacultyList";
import { useFacultyList } from "../hooks/useFaculty";
import { useAuth } from "../context/AuthContext";
import { facultyApi } from "../api/facultyApi";
import { Search, Filter, Users, Building2, X, BookOpen, Star, Calendar } from "lucide-react";

function normalizePublicationType(type) {
  const raw = String(type || "journal").trim();
  if (!raw) return "Journal Paper";
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase()) + " Paper";
}

function sortByNewest(items = []) {
  return [...items].sort((a, b) => {
    const yearA = Number(a?.year) || 0;
    const yearB = Number(b?.year) || 0;
    if (yearA !== yearB) return yearB - yearA;
    const timeA = new Date(a?.created_at || 0).getTime();
    const timeB = new Date(b?.created_at || 0).getTime();
    return timeB - timeA;
  });
}

export default function FacultyListPage() {
  const { token } = useAuth();
  const { data, isLoading, error } = useFacultyList(token);
  const { data: facultyHighlights, isLoading: isHighlightsLoading } = useQuery({
    queryKey: ["faculty-page", "research-highlights"],
    queryFn: async () => {
      const facultyRows = await facultyApi.list();
      const visibleFaculty = Array.isArray(facultyRows) ? facultyRows.filter((item) => item?.id) : [];
      const pickedFaculty = visibleFaculty.slice(0, 14);

      const profileRows = await Promise.all(
        pickedFaculty.map(async (item) => {
          try {
            const profile = await facultyApi.byId(item.id);
            return { faculty: item, profile };
          } catch {
            return null;
          }
        }),
      );

      const publications = [];
      const awards = [];

      for (const row of profileRows) {
        if (!row?.profile) continue;

        const facultyName = row.faculty?.name || "Faculty";

        for (const item of row.profile.publications || []) {
          publications.push({
            id: item.id || `${facultyName}-${item.title}`,
            title: item.title || "Untitled publication",
            authors: item.authors || "Authors not listed",
            year: item.year,
            type: normalizePublicationType(item.type),
            created_at: item.created_at,
          });
        }

        for (const item of row.profile.awards || []) {
          awards.push({
            id: item.id || `${facultyName}-${item.title}-${item.year}`,
            title: item.honors || item.title || item.membership || "Recognition",
            description: item.description || "Recognized for notable contribution.",
            year: item.year,
            facultyName,
            created_at: item.created_at,
          });
        }
      }

      return {
        publications: sortByNewest(publications).slice(0, 32),
        awards: sortByNewest(awards).slice(0, 32),
      };
    },
  });
  const faculty = data || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDesignation, setSelectedDesignation] = useState("all");
  const [activePublication, setActivePublication] = useState(0);
  const [activeAward, setActiveAward] = useState(0);
  const publicationScrollRef = useRef(null);
  const awardScrollRef = useRef(null);
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

  const hasActiveFilters = searchQuery || selectedDepartment !== "all" || selectedDesignation !== "all";

  const publications = facultyHighlights?.publications || [];
  const awards = facultyHighlights?.awards || [];

  useEffect(() => {
    if (publications.length <= 1) return undefined;
    const intervalId = window.setInterval(() => {
      setActivePublication((current) => (current + 1) % publications.length);
    }, 3500);
    return () => window.clearInterval(intervalId);
  }, [publications.length]);

  useEffect(() => {
    if (awards.length <= 1) return undefined;
    const intervalId = window.setInterval(() => {
      setActiveAward((current) => (current + 1) % awards.length);
    }, 4000);
    return () => window.clearInterval(intervalId);
  }, [awards.length]);

  useEffect(() => {
    const refs = [publicationScrollRef.current, awardScrollRef.current].filter(Boolean);
    if (!refs.length) return undefined;

    const intervalId = window.setInterval(() => {
      refs.forEach((node) => {
        if (!node) return;
        const limit = node.scrollHeight - node.clientHeight;
        if (limit <= 0) return;
        const next = node.scrollTop + 1;
        node.scrollTop = next >= limit ? 0 : next;
      });
    }, 45);

    return () => window.clearInterval(intervalId);
  }, [publications.length, awards.length]);

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
          className="mb-8"
        >
          <div className="mb-6">
            <p className="campus-kicker">Research Highlights</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-800 md:text-3xl">Publications & Recognition</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Latest faculty research publications and awards curated from approved institutional records.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-[#9d2235] to-[#b51a34] px-6 py-4">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-white/80" />
                  <h3 className="text-lg font-bold text-white">Latest Research Publications</h3>
                </div>
                <p className="mt-1 text-xs text-white/60">{publications.length} publications indexed</p>
              </div>

              <div className="p-5">
                {isHighlightsLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                  </div>
                )}

                {!isHighlightsLoading && !publications.length && (
                  <p className="py-8 text-center text-sm text-slate-500">No publication highlights available yet.</p>
                )}

                {!isHighlightsLoading && !!publications.length && (
                  <div ref={publicationScrollRef} className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
                    {publications.map((item, index) => (
                      <article
                        key={item.id}
                        className={`rounded-xl border p-4 transition-all duration-300 ${
                          index === activePublication
                            ? "border-[#9d2235]/30 bg-[#9d2235]/5 shadow-sm"
                            : "border-transparent bg-slate-50/50 hover:bg-slate-50"
                        }`}
                      >
                        <p className="text-sm font-bold leading-snug text-slate-800">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.authors}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#9d2235]/10 px-2 py-0.5 text-[10px] font-semibold text-[#9d2235]">
                            {item.type}
                          </span>
                          {item.year && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Calendar className="h-3 w-3" /> {item.year}
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </article>

            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-white/80" />
                  <h3 className="text-lg font-bold text-white">Awards & Recognition</h3>
                </div>
                <p className="mt-1 text-xs text-white/60">{awards.length} awards documented</p>
              </div>

              <div className="p-5">
                {isHighlightsLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                  </div>
                )}

                {!isHighlightsLoading && !awards.length && (
                  <p className="py-8 text-center text-sm text-slate-500">No awards highlights available yet.</p>
                )}

                {!isHighlightsLoading && !!awards.length && (
                  <div ref={awardScrollRef} className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
                    {awards.map((item, index) => (
                      <article
                        key={item.id}
                        className={`rounded-xl border p-4 transition-all duration-300 ${
                          index === activeAward
                            ? "border-amber-300/50 bg-amber-50 shadow-sm"
                            : "border-transparent bg-slate-50/50 hover:bg-slate-50"
                        }`}
                      >
                        <p className="text-sm font-bold leading-snug text-slate-800">{item.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-semibold text-amber-700">{item.facultyName}</span>
                          {item.year && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Calendar className="h-3 w-3" /> {item.year}
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </article>
          </div>
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

      </div>
    </section>
  );
}
