import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AdminPanel from "../components/AdminPanel";
import StudentAdminSection from "../components/StudentAdminSection";
import { useAuth } from "../context/AuthContext";
import { adminApi } from "../api/facultyApi";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Clock,
  FolderSearch,
  History,
  BookUser,
  LayoutDashboard,
  ChevronDown,
  CheckCircle2,
  XCircle,
  ListFilter,
  AlertCircle,
  FileSearch,
  Layers,
} from "lucide-react";

const FACULTY_SUBS = [
  { key: "faculty:pending",   label: "Pending Requests",   icon: Clock,         panelTab: "pending",   desc: "New faculty data awaiting review" },
  { key: "faculty:history",   label: "Approval History",   icon: History,       panelTab: "history",   desc: "Past approved / rejected items" },
  { key: "faculty:directory", label: "Faculty Directory",  icon: BookUser,      panelTab: "faculty",   desc: "Browse all faculty records" },
  { key: "faculty:query",     label: "Query Search",       icon: FileSearch,    panelTab: null,        link: "/admin/query", desc: "Advanced data query tool" },
];

const STUDENT_SUBS = [
  { key: "student:all",       label: "All Submissions",    icon: Layers,        studentFilter: "all",      desc: "Every student submission" },
  { key: "student:pending",   label: "Pending Review",     icon: Clock,         studentFilter: "pending",  desc: "Submissions awaiting action" },
  { key: "student:approved",  label: "Approved",           icon: CheckCircle2,  studentFilter: "approved", desc: "Successfully approved work" },
  { key: "student:rejected",  label: "Rejected",           icon: XCircle,       studentFilter: "rejected", desc: "Declined submissions" },
];

export default function AdminPage() {
  const { token } = useAuth();

  const [activeSection, setActiveSection] = useState("faculty:pending");
  const [facultyOpen, setFacultyOpen] = useState(true);
  const [studentOpen, setStudentOpen] = useState(false);

  const { data: pendingData } = useQuery({
    queryKey: ["pending", "admin-stats"],
    queryFn: () => adminApi.pending(token),
    enabled: Boolean(token),
  });

  const pendingCounts = (() => {
    if (!pendingData) return { total: 0, faculty: 0, publications: 0, projects: 0 };
    let total = 0;
    for (const key of Object.keys(pendingData)) {
      total += (pendingData[key] || []).length;
    }
    return {
      total,
      faculty: (pendingData.faculty || []).length,
      publications: (pendingData.publications || []).length,
      projects: (pendingData.projects || []).length,
    };
  })();

  const activeSub =
    FACULTY_SUBS.find((s) => s.key === activeSection) ||
    STUDENT_SUBS.find((s) => s.key === activeSection);

  const isFacultySection = activeSection.startsWith("faculty:");
  const isStudentSection = activeSection.startsWith("student:");

  const adminPanelTab = isFacultySection
    ? (FACULTY_SUBS.find((s) => s.key === activeSection)?.panelTab ?? "pending")
    : "pending";

  const studentFilter = isStudentSection
    ? (STUDENT_SUBS.find((s) => s.key === activeSection)?.studentFilter ?? "all")
    : "all";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">

      {/* ── Top bar ── */}
      <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9d2235]">
              <LayoutDashboard className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold leading-none text-slate-800">Admin Dashboard</h1>
              <p className="mt-0.5 text-[11px] text-slate-400">VJTI NBA Accreditation Portal</p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="hidden items-center gap-2 sm:flex">
            {[
              { label: "Total Pending", value: pendingCounts.total, color: "bg-amber-100 text-amber-700" },
              { label: "Faculty",       value: pendingCounts.faculty, color: "bg-blue-100 text-blue-700" },
              { label: "Publications",  value: pendingCounts.publications, color: "bg-violet-100 text-violet-700" },
              { label: "Projects",      value: pendingCounts.projects, color: "bg-emerald-100 text-emerald-700" },
            ].map((s) => (
              <div key={s.label} className={`rounded-lg px-3 py-1.5 text-center ${s.color}`}>
                <p className="text-base font-extrabold leading-none">{s.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#9d2235]/20 bg-[#9d2235]/5 px-4 py-1.5 text-[11px] font-bold tracking-wider text-[#9d2235]">
            <ShieldCheck className="h-3.5 w-3.5" />
            ADMIN ACCESS
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + content ── */}
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-0 px-3 py-3 md:px-4 md:py-4">

        {/* ════ LEFT SIDEBAR ════ */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">

          {/* Sidebar brand strip */}
          <div className="border-b border-slate-100 px-4 py-4 md:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Request Center</p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">

            {/* ── FACULTY GROUP ── */}
            <div>
              <button
                onClick={() => {
                  setFacultyOpen((v) => !v);
                  setStudentOpen(false);
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all ${
                  activeSection.startsWith("faculty:")
                    ? "bg-[#9d2235]/8 text-[#9d2235]"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {/* Icon block */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  activeSection.startsWith("faculty:") ? "bg-[#9d2235] shadow-sm" : "bg-slate-100 group-hover:bg-slate-200"
                }`}>
                  <Users className={`h-5 w-5 ${activeSection.startsWith("faculty:") ? "text-white" : "text-slate-500"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${activeSection.startsWith("faculty:") ? "text-[#9d2235]" : "text-slate-700 group-hover:text-slate-900"}`}>
                    Faculty
                  </p>
                  <p className="text-[10px] text-slate-400">Profile & data approvals</p>
                </div>

                <div className="flex items-center gap-2">
                  {pendingCounts.faculty > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#9d2235] px-1.5 text-[10px] font-extrabold text-white">
                      {pendingCounts.faculty}
                    </span>
                  )}
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${facultyOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Faculty sub-items */}
              {facultyOpen && (
                <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-slate-100 pl-3">
                  {FACULTY_SUBS.map((sub) => {
                    const isActive = activeSection === sub.key;
                    return sub.link ? (
                      <Link
                        key={sub.key}
                        to={sub.link}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                      >
                        <sub.icon className="h-4 w-4 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-xs font-semibold">{sub.label}</p>
                          <p className="text-[10px] text-slate-400">{sub.desc}</p>
                        </div>
                      </Link>
                    ) : (
                      <button
                        key={sub.key}
                        onClick={() => setActiveSection(sub.key)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                          isActive
                            ? "bg-[#9d2235]/10 text-[#9d2235]"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                        }`}
                      >
                        <sub.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#9d2235]" : "text-slate-400"}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold ${isActive ? "text-[#9d2235]" : ""}`}>{sub.label}</p>
                          <p className="text-[10px] text-slate-400">{sub.desc}</p>
                        </div>
                        {isActive && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#9d2235]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── STUDENTS GROUP ── */}
            <div>
              <button
                onClick={() => {
                  setStudentOpen((v) => !v);
                  setFacultyOpen(false);
                  if (!activeSection.startsWith("student:")) setActiveSection("student:all");
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all ${
                  activeSection.startsWith("student:")
                    ? "bg-[#9d2235]/8 text-[#9d2235]"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  activeSection.startsWith("student:") ? "bg-[#9d2235] shadow-sm" : "bg-slate-100 group-hover:bg-slate-200"
                }`}>
                  <GraduationCap className={`h-5 w-5 ${activeSection.startsWith("student:") ? "text-white" : "text-slate-500"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${activeSection.startsWith("student:") ? "text-[#9d2235]" : "text-slate-700 group-hover:text-slate-900"}`}>
                    Students
                  </p>
                  <p className="text-[10px] text-slate-400">Achievement submissions</p>
                </div>

                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${studentOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Student sub-items */}
              {studentOpen && (
                <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-slate-100 pl-3">
                  {STUDENT_SUBS.map((sub) => {
                    const isActive = activeSection === sub.key;
                    return (
                      <button
                        key={sub.key}
                        onClick={() => setActiveSection(sub.key)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                          isActive
                            ? "bg-[#9d2235]/10 text-[#9d2235]"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                        }`}
                      >
                        <sub.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#9d2235]" : "text-slate-400"}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold ${isActive ? "text-[#9d2235]" : ""}`}>{sub.label}</p>
                          <p className="text-[10px] text-slate-400">{sub.desc}</p>
                        </div>
                        {isActive && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#9d2235]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </nav>

          {/* Sidebar footer */}
          <div className="border-t border-slate-100 px-4 py-4 md:px-5">
            <Link
              to="/admin/query"
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-[#9d2235]"
            >
              <FolderSearch className="h-4 w-4" />
              Advanced Query Search
            </Link>
          </div>
        </aside>

        {/* ════ RIGHT CONTENT PANEL ════ */}
        <main className="min-w-0 flex-1 bg-slate-50">
          {/* Content header breadcrumb */}
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-500">Admin</span>
              <span>/</span>
              <span className="font-semibold text-slate-500">{activeSection.startsWith("faculty:") ? "Faculty" : "Students"}</span>
              <span>/</span>
              <span className="font-bold text-[#9d2235]">{activeSub?.label ?? "Dashboard"}</span>
            </div>
            <h2 className="mt-1 text-lg font-extrabold text-slate-800">{activeSub?.label ?? "Dashboard"}</h2>
            {activeSub?.desc && <p className="text-xs text-slate-400">{activeSub.desc}</p>}
          </div>

          <div className="p-4 md:p-6 xl:p-8">
            {isFacultySection && (
              <AdminPanel initialTab={adminPanelTab} />
            )}
            {isStudentSection && (
              <StudentAdminSection initialFilter={studentFilter} />
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
