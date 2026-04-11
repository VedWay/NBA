import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { achievementApi } from "../api/facultyApi";

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
    return <img src={item.media_url} alt={item.title} className="h-44 w-full rounded object-cover" />;
  }

  if (item.media_type === "youtube") {
    const embedUrl = getYoutubeEmbedUrl(item.media_url);
    if (!embedUrl) return <p className="text-sm text-slate-600">Invalid YouTube URL</p>;
    return (
      <iframe
        title={item.title}
        src={embedUrl}
        className="h-44 w-full rounded"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  if (item.media_type === "pdf") {
    return (
      <div className="flex h-44 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50">
        <a href={item.media_url} target="_blank" rel="noreferrer" className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Open PDF
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-44 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50">
      <a href={item.media_url} target="_blank" rel="noreferrer" className="rounded border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900">
        Open Link
      </a>
    </div>
  );
}

export default function LandingPage() {
  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements", "public"],
    queryFn: () => achievementApi.listPublic(),
  });

  const [filter, setFilter] = useState("all");

  const filteredAchievements = useMemo(() => {
    if (filter === "all") return achievements;
    return achievements.filter((item) => item.media_type === filter);
  }, [achievements, filter]);

  const featured = filteredAchievements[0];
  const remaining = filteredAchievements.slice(1);

  return (
    <div>
      <section className="bg-[linear-gradient(135deg,#e6cf98_0%,#f1e2bc_52%,#fbf5e6_100%)] px-4 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_1fr]">
          <div className="smooth-fade glass-card rounded-2xl border border-white/40 p-6 backdrop-blur-xl">
            <p className="mb-3 inline-flex rounded-full border border-slate-700/20 bg-white/80 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-800">
              NBA Accreditation Portal
            </p>
            <h1 className="text-4xl font-black leading-tight text-slate-900 md:text-6xl">
              Faculty Information System for NBA Compliance
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-800">
              Centralized faculty profiles, publication tracking, project documentation, admin approval workflow, report generation,
              and accreditation-ready exports in one platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/faculty" className="rounded bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800">
                Browse Faculty
              </Link>
              <Link to="/viewer" className="rounded border border-slate-900 px-6 py-3 font-semibold text-slate-900 hover:bg-white/70">
                Viewer Mode
              </Link>
              <Link to="/login" className="rounded border border-slate-900 px-6 py-3 font-semibold text-slate-900 hover:bg-white/70">
                Login
              </Link>
            </div>
          </div>
          <div className="glass-card floaty rounded-lg border border-white/50 bg-white/70 p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-extrabold text-slate-900">System Highlights</h2>
            <ul className="mt-4 space-y-3 text-slate-700">
              <li>Role-based access for Faculty, Admin, and Viewer</li>
              <li>Admin approval gates for every faculty update</li>
              <li>Data history through audit logs</li>
              <li>NBA parameter dashboards and summary reports</li>
              <li>Excel export and CV-ready profile compilation</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Public Showcase</p>
              <h2 className="text-3xl font-black text-slate-900 md:text-4xl">Latest Faculty Achievements</h2>
              <p className="mt-2 text-sm text-slate-600">Curated by admin and visible to everyone on the portal.</p>
            </div>
            <Link to="/faculty" className="liquid-control rounded-xl px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100">
              Explore Faculty
            </Link>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["image", "Images"],
              ["youtube", "YouTube"],
              ["pdf", "PDF"],
              ["link", "Links"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? "liquid-button rounded-xl px-3 py-2 text-xs font-semibold" : "liquid-control rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"}
                onClick={() => setFilter(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {!filteredAchievements.length && (
            <div className="liquid-panel rounded-2xl p-6 text-sm text-slate-500">
              No achievements published yet.
            </div>
          )}

          {!!filteredAchievements.length && (
            <div className="space-y-5">
              {featured && (
                <article className="liquid-panel overflow-hidden rounded-2xl p-5">
                  <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
                    <AchievementMedia item={featured} />
                    <div className="space-y-3">
                      <p className="liquid-chip inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]">Featured</p>
                      <h3 className="text-2xl font-black text-slate-900">{featured.title}</h3>
                      <p className="text-sm text-slate-700">{featured.summary || "No summary provided."}</p>
                      {featured.faculty?.name && (
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                          {featured.faculty.name}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              )}

              {!!remaining.length && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {remaining.map((item) => (
                    <article key={item.id} className="liquid-panel overflow-hidden rounded-xl p-4">
                      <AchievementMedia item={item} />
                      <div className="mt-3 space-y-2">
                        <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                        <p className="text-sm text-slate-600">{item.summary || "No summary provided."}</p>
                        {item.faculty?.name && (
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
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
    </div>
  );
}
