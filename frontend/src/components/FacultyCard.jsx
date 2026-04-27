import { Link } from "react-router-dom";
import { Mail, ArrowRight, Briefcase } from "lucide-react";

export default function FacultyCard({ faculty }) {
  const designation = faculty.designation || faculty.position || faculty.title || "Faculty";
  const initials = (faculty.name || "F")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      to={`/faculty/${faculty.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#9d2235] via-[#b51a34] to-[#c3475b]" />

      <div className="flex flex-1 flex-col p-5">
        {/* Header: Photo + Name */}
        <div className="flex items-start gap-4">
          {faculty.photo_url ? (
            <img
              src={faculty.photo_url}
              alt={faculty.name}
              className="h-16 w-16 shrink-0 rounded-xl object-cover ring-2 ring-slate-100"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#9d2235] to-[#c3475b] text-lg font-bold text-white ring-2 ring-slate-100">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-slate-800 group-hover:text-[#9d2235]">
              {faculty.name}
            </h3>
            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
              <Briefcase className="h-3.5 w-3.5" />
              {designation}
            </p>
          </div>
        </div>

        {/* Department Badge */}
        <div className="mt-3">
          <span className="inline-flex rounded-full bg-[#9d2235]/8 px-3 py-1 text-[11px] font-semibold text-[#9d2235]">
            {faculty.department || "Department"}
          </span>
        </div>

        {/* Research Area */}
        <p className="mt-3 flex-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
          {faculty.research_area || "Research interests will be updated soon."}
        </p>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1.5 truncate text-xs text-slate-400">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{faculty.email || "—"}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#9d2235] opacity-0 transition-opacity group-hover:opacity-100">
            View <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
