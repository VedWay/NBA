import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { achievementApi, facultyApi } from "../api/facultyApi";

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
          Open PDF
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
      <a href={item.media_url} target="_blank" rel="noreferrer" className="liquid-control rounded-lg px-4 py-2 text-sm font-semibold text-slate-900">
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
      };
    },
  });

  const [filter, setFilter] = useState("all");
  const [activePublication, setActivePublication] = useState(0);
  const [activeAward, setActiveAward] = useState(0);
  const publicationScrollRef = useRef(null);
  const awardScrollRef = useRef(null);

  const filteredAchievements = useMemo(() => {
    if (filter === "all") return achievements;
    return achievements.filter((item) => item.media_type === filter);
  }, [achievements, filter]);

  const featured = filteredAchievements[0];
  const remaining = filteredAchievements.slice(1);
  const publishedCount = achievements.length;
  const imageCount = achievements.filter((item) => item.media_type === "image").length;
  const videoCount = achievements.filter((item) => item.media_type === "youtube").length;
  const publications = facultyHighlights?.publications || [];
  const awards = facultyHighlights?.awards || [];

  useEffect(() => {
    if (publications.length <= 1) return undefined;
    const intervalId = window.setInterval(() => {
      setActivePublication((current) => (current + 1) % publications.length);
    }, 2200);
    return () => window.clearInterval(intervalId);
  }, [publications.length]);

  useEffect(() => {
    if (awards.length <= 1) return undefined;
    const intervalId = window.setInterval(() => {
      setActiveAward((current) => (current + 1) % awards.length);
    }, 2300);
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

  return (
    <div className="smooth-fade pb-14">
      <section className="relative min-h-[62vh] overflow-hidden md:min-h-[68vh]">
        <img
          src="/hero.png"
          alt="NBA Faculty Information System"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="vjti-hero-overlay absolute inset-0" />
        
      </section>

      <section className="px-4 py-10 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <article className="glass-card rounded-2xl p-5">
              <p className="campus-kicker">Directory</p>
              <h3 className="mt-2 text-xl font-bold">Faculty Profiles</h3>
              <p className="mt-2 text-sm campus-muted">Explore approved records by department, designation, and research focus.</p>
            </article>
            <article className="glass-card rounded-2xl p-5">
              <p className="campus-kicker">Review</p>
              <h3 className="mt-2 text-xl font-bold">Admin Workflow</h3>
              <p className="mt-2 text-sm campus-muted">Transparent approvals and history tracking for all submitted records.</p>
            </article>
            <article className="glass-card rounded-2xl p-5">
              <p className="campus-kicker">Reporting</p>
              <h3 className="mt-2 text-xl font-bold">NBA Reports</h3>
              <p className="mt-2 text-sm campus-muted">Generate formatted outputs aligned with accreditation evidence needs.</p>
            </article>
          </div>

          <div className="mb-10 grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-[#edcab3] bg-[#f9f6f3] p-5">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Latest Research Publications</h3>
              <div className="mt-4 h-1 w-28 rounded bg-[#b51a34]" />

              {isHighlightsLoading && <p className="mt-6 text-sm text-slate-600">Loading publication highlights...</p>}

              {!isHighlightsLoading && !publications.length && (
                <p className="mt-6 text-sm text-slate-600">No publication highlights available yet.</p>
              )}

              {!isHighlightsLoading && !!publications.length && (
                <>
                  <div className="mt-6 rounded-lg bg-white/70 p-4 shadow-sm transition duration-300">
                    <p className="text-sm text-slate-600">Journal: {publications[activePublication]?.journal}</p>
                    <p className="mt-2 text-sm text-slate-600">DOI: {publications[activePublication]?.doi || "-"}</p>
                    <p className="mt-2 text-sm text-slate-600">Type: {publications[activePublication]?.type}</p>
                  </div>

                  <div ref={publicationScrollRef} className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
                    {publications.map((item, index) => (
                      <article
                        key={item.id}
                        className={`rounded-lg p-3 transition duration-300 ${
                          index === activePublication ? "bg-[#b51a34]/10" : "bg-transparent"
                        }`}
                      >
                        <p className="text-lg font-semibold leading-snug text-slate-700 md:text-xl">• {item.title}</p>
                        <p className="mt-1 text-sm text-slate-600 md:text-base">Authors: {item.authors}</p>
                        <p className="mt-1 text-sm text-slate-600 md:text-base">Journal: {item.journal}</p>
                        <p className="mt-1 text-sm text-slate-600 md:text-base">DOI: {item.doi || "-"}</p>
                        <p className="mt-1 text-sm text-slate-600 md:text-base">Type: {item.type}</p>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </article>

            <article className="rounded-xl border border-[#edcab3] bg-[#f9f6f3] p-5">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Awards and Recognition</h3>
              <div className="mt-4 h-1 w-28 rounded bg-[#b51a34]" />

              {isHighlightsLoading && <p className="mt-6 text-sm text-slate-600">Loading awards highlights...</p>}

              {!isHighlightsLoading && !awards.length && (
                <p className="mt-6 text-sm text-slate-600">No awards highlights available yet.</p>
              )}

              {!isHighlightsLoading && !!awards.length && (
                <>
                  <div className="mt-6 rounded-lg bg-white/70 p-4 shadow-sm transition duration-300">
                    <p className="text-2xl font-medium text-slate-900 md:text-3xl">{awards[activeAward]?.facultyName}</p>
                    <p className="mt-1 text-base text-slate-600 md:text-lg">{awards[activeAward]?.department}</p>
                  </div>

                  <div ref={awardScrollRef} className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
                    {awards.map((item, index) => (
                      <article
                        key={item.id}
                        className={`rounded-lg p-3 transition duration-300 ${
                          index === activeAward ? "bg-[#b51a34]/10" : "bg-transparent"
                        }`}
                      >
                        <p className="text-lg font-semibold leading-snug text-slate-700 md:text-xl">• {item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600 md:text-base">{item.description}</p>
                        <p className="mt-1 text-sm italic text-slate-500 md:text-base">Awarded in {item.year || "-"}</p>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </article>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="campus-kicker">Public Showcase</p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">Faculty Achievements</h2>
              <p className="mt-1 text-sm campus-muted">Verified and published by the administration.</p>
            </div>
            <Link to="/faculty" className="liquid-control rounded-lg px-4 py-2 text-sm font-semibold text-slate-800">
              Explore Faculty
            </Link>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["image", "Images"],
              ["youtube", "YouTube"],
              ["pdf", "PDF"],
              ["link", "Links"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                  filter === value
                    ? "bg-[#9d2235] text-white"
                    : "liquid-control text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {!filteredAchievements.length && (
            <div className="glass-card rounded-2xl px-6 py-8 text-center text-slate-600">
              No achievements published yet.
            </div>
          )}

          {!!filteredAchievements.length && (
            <div className="space-y-6">
              {featured && (
                <article className="glass-card rounded-2xl p-5 md:p-7">
                  <div className="grid items-center gap-6 md:grid-cols-[1.1fr_1fr]">
                    <div className="overflow-hidden rounded-xl border border-slate-200/80">
                      <AchievementMedia item={featured} />
                    </div>
                    <div>
                      <p className="campus-kicker">Featured Update</p>
                      <h3 className="mt-2 text-2xl font-bold">{featured.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{featured.summary || "No summary provided."}</p>
                      {featured.faculty?.name && (
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#9d2235]">
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
                    <article key={item.id} className="glass-card rounded-2xl p-4 transition hover:-translate-y-1 hover:shadow-[0_20px_32px_rgba(127,16,34,0.18)]">
                      <div className="overflow-hidden rounded-lg border border-slate-200/80">
                        <AchievementMedia item={item} />
                      </div>
                      <h3 className="mt-3 text-lg font-bold">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{item.summary || "No summary provided."}</p>
                      {item.faculty?.name && (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#9d2235]">
                          {item.faculty.name}
                        </p>
                      )}
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
