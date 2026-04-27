import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AdminPanel from "../components/AdminPanel";
import StudentAdminSection from "../components/StudentAdminSection";
import AdminQueryPage from "./AdminQueryPage";
import { useAuth } from "../context/AuthContext";
import { adminApi } from "../api/facultyApi";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Clock,
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

const ADMIN_SUBS = [
  { key: "admin:pending",     label: "Pending Requests",   icon: Clock,           panelTab: "pending",   desc: "New faculty data awaiting review" },
  { key: "admin:history",     label: "Approval History",   icon: History,         panelTab: "history",   link: "/admin/history", desc: "Past approved / rejected items" },
  { key: "admin:directory",   label: "Faculty Directory",  icon: BookUser,        panelTab: "faculty",   link: "/admin/faculty", desc: "Browse all faculty records" },
  { key: "admin:achievements", label: "Achievements",       icon: Layers,          panelTab: "achievements", desc: "Create and manage featured achievements" },
  { key: "admin:query",       label: "Query Search",       icon: FileSearch,      panelTab: null,         desc: "Advanced data query tool" },
];

const STUDENT_SUBS = [
  { key: "student:all",       label: "All Submissions",    icon: Layers,        studentFilter: "all",      desc: "Every student submission" },
  { key: "student:pending",   label: "Pending Review",     icon: Clock,         studentFilter: "pending",  desc: "Submissions awaiting action" },
  { key: "student:approved",  label: "Approved",           icon: CheckCircle2,  studentFilter: "approved", desc: "Successfully approved work" },
  { key: "student:rejected",  label: "Rejected",           icon: XCircle,       studentFilter: "rejected", desc: "Declined submissions" },
];

export default function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const sectionFromPath = (pathname) => {
    if (pathname === "/admin/history") return "admin:history";
    if (pathname === "/admin/faculty") return "admin:directory";
    if (pathname === "/admin/query") return "admin:query";
    if (pathname === "/admin/students") return "student:all";
    return "admin:pending";
  };

  const [activeSection, setActiveSection] = useState(() => sectionFromPath(location.pathname));
  const [adminOpen, setAdminOpen] = useState(true);
  const [studentOpen, setStudentOpen] = useState(false);

  useEffect(() => {
    const nextSection = sectionFromPath(location.pathname);
    setActiveSection(nextSection);
    setAdminOpen(nextSection.startsWith("admin:"));
    setStudentOpen(nextSection.startsWith("student:"));
  }, [location.pathname]);

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
    ADMIN_SUBS.find((s) => s.key === activeSection) ||
    STUDENT_SUBS.find((s) => s.key === activeSection);

  const isAdminSection = activeSection.startsWith("admin:");
  const isStudentSection = activeSection.startsWith("student:");
  const adminPanelTab = isAdminSection
    ? (ADMIN_SUBS.find((s) => s.key === activeSection)?.panelTab ?? "pending")
    : "pending";

  const studentFilter = isStudentSection
    ? (STUDENT_SUBS.find((s) => s.key === activeSection)?.studentFilter ?? "all")
    : "all";

  const dashboardStats = [
    { label: "Total Pending", value: pendingCounts.total, icon: LayoutDashboard, badge: "bg-[#fdf0f2] text-[#9d2235]" },
    { label: "Faculty", value: pendingCounts.faculty, icon: Users, badge: "bg-[#e7efff] text-[#3357d1]" },
    { label: "Publications", value: pendingCounts.publications, icon: FileSearch, badge: "bg-[#f2e9ff] text-[#7f5dd6]" },
    { label: "Projects", value: pendingCounts.projects, icon: Layers, badge: "bg-[#e6f6eb] text-[#1f8a4c]" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f4f1]">

      {/* ── Top bar ── */}
      <div className="border-b border-[#ead8dc] bg-white px-4 py-4 md:px-6">
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

          <div className="flex items-center gap-2 rounded-full border border-[#9d2235]/20 bg-[#9d2235]/5 px-4 py-1.5 text-[11px] font-bold tracking-wider text-[#9d2235]">
            <ShieldCheck className="h-3.5 w-3.5" />
            ADMIN ACCESS
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + content ── */}
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-0 px-3 py-3 md:px-4 md:py-4">

        {/* ════ LEFT SIDEBAR ════ */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-[#ead8dc] bg-white">

          {/* Sidebar brand strip */}
          <div className="border-b border-[#f1e5e7] px-4 py-4 md:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#a8727b]">Admin Center</p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">

            {/* ── ADMIN GROUP ── */}
            <div>
              <button
                onClick={() => {
                  const nextOpen = !adminOpen;
                  setAdminOpen(nextOpen);
                  setStudentOpen(false);
                  if (!activeSection.startsWith("admin:")) {
                    setActiveSection("admin:pending");
                  }
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all ${
                  activeSection.startsWith("admin:")
                    ? "bg-[#9d2235]/8 text-[#9d2235]"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {/* Icon block */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  activeSection.startsWith("admin:") ? "bg-[#9d2235] shadow-sm" : "bg-slate-100 group-hover:bg-slate-200"
                }`}>
                  <LayoutDashboard className={`h-5 w-5 ${activeSection.startsWith("admin:") ? "text-white" : "text-slate-500"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${activeSection.startsWith("admin:") ? "text-[#9d2235]" : "text-slate-700 group-hover:text-slate-900"}`}>
                    Admin
                  </p>
                  <p className="text-[10px] text-[#a8727b]">Dashboard, approvals, and directory tools</p>
                </div>

                <div className="flex items-center gap-2">
                  {pendingCounts.faculty > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#9d2235] px-1.5 text-[10px] font-extrabold text-white">
                      {pendingCounts.faculty}
                    </span>
                  )}
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${adminOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Admin sub-items */}
              {adminOpen && (
                <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-[#f1e5e7] pl-3">
                  {ADMIN_SUBS.map((sub) => {
                    const isActive = activeSection === sub.key;
                    return (
                      <button
                        key={sub.key}
                        onClick={() => {
                          setActiveSection(sub.key);
                          if (sub.link) navigate(sub.link);
                          setAdminOpen(true);
                          setStudentOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                          isActive
                            ? "bg-[#9d2235]/10 text-[#9d2235]"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                        }`}
                      >
                        <sub.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#9d2235]" : "text-slate-400"}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold ${isActive ? "text-[#9d2235]" : ""}`}>{sub.label}</p>
                          <p className="text-[10px] text-[#a8727b]">{sub.desc}</p>
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
                  setAdminOpen(false);
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
                  <p className="text-[10px] text-[#a8727b]">Achievement submissions</p>
                </div>

                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${studentOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Student sub-items */}
              {studentOpen && (
                <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-[#f1e5e7] pl-3">
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

        </aside>

        {/* ════ RIGHT CONTENT PANEL ════ */}
        <main className="min-w-0 flex-1 bg-[#f8f4f1]">
          {/* Content header breadcrumb */}
          <div className="border-b border-[#ead8dc] bg-white px-4 py-4 md:px-6">
            <div className="flex items-center gap-2 text-xs text-[#a8727b]">
              <span className="font-semibold text-[#7f1022]">Admin</span>
              <span>/</span>
              <span className="font-semibold text-[#7f1022]">{activeSection.startsWith("admin:") ? "Admin" : "Students"}</span>
              <span>/</span>
              <span className="font-bold text-[#9d2235]">{activeSub?.label ?? "Dashboard"}</span>
            </div>
            <h2 className="mt-1 text-lg font-extrabold text-[#1e1a1b]">{activeSub?.label ?? "Dashboard"}</h2>
            {activeSub?.desc && <p className="text-xs text-[#a8727b]">{activeSub.desc}</p>}
          </div>

          <div className="p-4 md:p-6 xl:p-8">
            {isAdminSection && (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {dashboardStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-2xl border border-[#ead8dc] bg-white px-5 py-5 text-center shadow-sm">
                      <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${stat.badge}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-3xl font-extrabold leading-none text-[#1e1a1b]">{stat.value}</p>
                      <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-[#a8727b]">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            )}
            {isAdminSection && activeSection !== "admin:query" && (
              <AdminPanel initialTab={adminPanelTab} />
            )}
            {activeSection === "admin:query" && (
              <AdminQueryPage embedded />
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
