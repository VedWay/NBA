import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { achievementApi, facultyApi } from "../api/facultyApi";
import {
  BookOpen,
  Users,
  GraduationCap,
  Award,
  FlaskConical,
  TrendingUp,
  ChevronRight,
  ArrowRight,
  Play,
  FileText,
  ExternalLink,
  Star,
  Building2,
  Calendar,
} from "lucide-react";

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

function getYoutubeEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
  } catch {
    return "";
  }
  return "";
}

function AchievementMedia({ item }) {
  if (item.media_type === "image") {
    return <img src={item.media_url} alt={item.title} className="h-52 w-full rounded-lg object-cover" />;
  }

  if (item.media_type === "youtube") {
    const embedUrl = getYoutubeEmbedUrl(item.media_url);
    if (!embedUrl) return <p className="text-sm text-slate-600">Invalid YouTube URL</p>;
    return (
      <iframe
        title={item.title}
        src={embedUrl}
        className="aspect-video w-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  if (item.media_type === "pdf") {
    return (
      <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
        <a href={item.media_url} target="_blank" rel="noreferrer" className="liquid-button rounded-lg px-4 py-2 text-sm font-semibold text-white">
          <FileText className="mr-2 inline h-4 w-4" /> Open PDF
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
      <a href={item.media_url} target="_blank" rel="noreferrer" className="liquid-control rounded-lg px-4 py-2 text-sm font-semibold text-slate-900">
        <ExternalLink className="mr-2 inline h-4 w-4" /> Open Link
      </a>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-white">{value}</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{label}</p>
      </div>
    </div>
  );
}

function QuickLinkCard({ to, icon: Icon, title, description, color }) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(127,16,34,0.15)]"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#9d2235] to-[#c3475b] opacity-0 transition-opacity group-hover:opacity-100" />
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{description}</p>
      <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#9d2235] opacity-0 transition-opacity group-hover:opacity-100">
        Explore <ChevronRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

export default function LandingPage() {
  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements", "public"],
    queryFn: () => achievementApi.listPublic(),
  });

  const { data: facultyHighlights, isLoading: isHighlightsLoading } = useQuery({
    queryKey: ["landing", "faculty-highlights"],
    queryFn: async () => {
      const faculty = await facultyApi.list();
      const visibleFaculty = Array.isArray(faculty) ? faculty.filter((item) => item?.id) : [];
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
        const department = row.faculty?.department || "Department";

        for (const item of row.profile.publications || []) {
          publications.push({
            id: item.id || `${facultyName}-${item.title}`,
            title: item.title || "Untitled publication",
            authors: item.authors || "Authors not listed",
            journal: item.journal || "Journal not listed",
            doi: item.doi || "-",
            year: item.year,
            type: normalizePublicationType(item.type),
            facultyName,
            department,
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
            department,
            created_at: item.created_at,
          });
        }
      }

      return {
        publications: sortByNewest(publications).slice(0, 32),
        awards: sortByNewest(awards).slice(0, 32),
        facultyCount: visibleFaculty.length,
        departmentCount: new Set(visibleFaculty.map((f) => f.department).filter(Boolean)).size,
      };
    },
  });

  const [filter, setFilter] = useState("all");

  const filteredAchievements = useMemo(() => {
    if (filter === "all") return achievements;
    return achievements.filter((item) => item.media_type === filter);
  }, [achievements, filter]);

  const featured = filteredAchievements[0];
  const remaining = filteredAchievements.slice(1);
  const publications = facultyHighlights?.publications || [];
  const awards = facultyHighlights?.awards || [];
  const facultyCount = facultyHighlights?.facultyCount || 0;
  const departmentCount = facultyHighlights?.departmentCount || 0;

  return (
    <div className="smooth-fade">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] overflow-hidden md:min-h-[78vh]">
        <img
          src="/hero.png"
          alt="VJTI Campus"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a0e]/90 via-[#3d0f1a]/80 to-[#1a0a0e]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a0e]/60 to-transparent" />

        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-center px-6 py-20 md:min-h-[78vh] md:px-10">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/90">
                NBA Accreditation Portal
              </span>
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-white md:text-6xl lg:text-7xl">
              Veermata Jijabai<br />
              Technological<br />
              <em className="not-italic" style={{ color: "#d4a017" }}>Institute</em>
            </h1>
            <p className="mt-5 max-w-xl font-sans text-base leading-relaxed text-white/70 md:text-lg">
              Centralized platform for faculty data management, student achievements tracking, research publications, and NBA accreditation documentation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/viewer"
                className="group flex items-center gap-2 rounded-xl bg-[#9d2235] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(157,34,53,0.4)] transition hover:bg-[#b51a34] hover:shadow-[0_14px_36px_rgba(157,34,53,0.5)]"
              >
                Faculty Directory <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/students"
                className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Student Achievements
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
              >
                Login / Register
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 lg:max-w-3xl">
            <StatCard icon={Users} value={facultyCount || "—"} label="Faculty" color="bg-[#9d2235]" />
            <StatCard icon={Building2} value={departmentCount || "—"} label="Departments" color="bg-[#7f1022]" />
            <StatCard icon={BookOpen} value={publications.length || "—"} label="Publications" color="bg-[#b51a34]" />
            <StatCard icon={Award} value={awards.length || "—"} label="Awards" color="bg-[#c3475b]" />
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="relative -mt-8 z-10 px-4 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickLinkCard
              to="/viewer"
              icon={Users}
              title="Faculty Directory"
              description="Browse approved profiles by department, designation, and research focus."
              color="bg-[#9d2235]/10 text-[#9d2235]"
            />
            <QuickLinkCard
              to="/students"
              icon={GraduationCap}
              title="Student Achievements"
              description="Internships, placements, and co-curricular achievements by students."
              color="bg-emerald-100 text-emerald-700"
            />
            <QuickLinkCard
              to="/student-desk"
              icon={TrendingUp}
              title="Submit Achievement"
              description="Faculty and students can submit new records for admin review."
              color="bg-blue-100 text-blue-700"
            />
            <QuickLinkCard
              to="/login"
              icon={FlaskConical}
              title="Research & Reports"
              description="Login to access NBA-formatted reports and research data exports."
              color="bg-amber-100 text-amber-700"
            />
          </div>
        </div>
      </section>

      {/* Achievements Showcase */}
      <section className="bg-slate-50 px-4 py-16 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="campus-kicker">Public Showcase</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-slate-800 md:text-4xl">Faculty Achievements</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-500">
                Verified and published achievements by the administration.
              </p>
            </div>
            <Link
              to="/faculty"
              className="group flex items-center gap-2 rounded-lg border border-[#9d2235]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#9d2235] shadow-sm transition hover:bg-[#9d2235] hover:text-white"
            >
              Explore All Faculty <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["image", "Images"],
              ["youtube", "Videos"],
              ["pdf", "Documents"],
              ["link", "Links"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  filter === value
                    ? "bg-[#9d2235] text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#9d2235]/30 hover:text-[#9d2235]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {!filteredAchievements.length && (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <Award className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-500">No achievements published yet.</p>
            </div>
          )}

          {!!filteredAchievements.length && (
            <div className="space-y-6">
              {featured && (
                <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="grid items-center gap-0 md:grid-cols-[1.2fr_1fr]">
                    <div className="overflow-hidden">
                      <AchievementMedia item={featured} />
                    </div>
                    <div className="p-6 md:p-8">
                      <span className="inline-flex rounded-full bg-[#9d2235]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#9d2235]">
                        Featured
                      </span>
                      <h3 className="mt-3 font-display text-2xl font-bold text-slate-800">{featured.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-500">{featured.summary || "No summary provided."}</p>
                      {featured.faculty?.name && (
                        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#9d2235]">
                          {featured.faculty.name}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              )}

              {!!remaining.length && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {remaining.map((item) => (
                    <article
                      key={item.id}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="overflow-hidden">
                        <AchievementMedia item={item} />
                      </div>
                      <div className="p-5">
                        <h3 className="text-base font-bold text-slate-800">{item.title}</h3>
                        <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{item.summary || "No summary provided."}</p>
                        {item.faculty?.name && (
                          <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-[#9d2235]">
                            {item.faculty.name}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-[#9d2235] via-[#7f1022] to-[#5a0b18] px-4 py-20 md:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Ready to manage your academic profile?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70">
            Faculty members can submit publications, projects, patents, and more. Admin approval ensures data integrity for NBA accreditation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="rounded-xl bg-white px-8 py-3 text-sm font-bold text-[#9d2235] shadow-lg transition hover:bg-slate-100"
            >
              Get Started
            </Link>
            <Link
              to="/viewer"
              className="rounded-xl border border-white/30 px-8 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Browse Faculty
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
