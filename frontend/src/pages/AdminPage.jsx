import { useState } from "react";
import AdminPanel from "../components/AdminPanel";
import StudentAdminSection from "../components/StudentAdminSection";
import { Users, GraduationCap, ShieldAlert } from "lucide-react";

export default function AdminPage() {
  const [mainTab, setMainTab] = useState("faculty");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      {/* High-Level Tabs */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 shadow-inner">
          <button
            onClick={() => setMainTab("faculty")}
            className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold transition-all ${
              mainTab === "faculty"
                ? "bg-white text-[#9d2235] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Users size={18} />
            Faculty Requests
          </button>
          <button
            onClick={() => setMainTab("student")}
            className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold transition-all ${
              mainTab === "student"
                ? "bg-white text-[#9d2235] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <GraduationCap size={18} />
            Student Requests
          </button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {mainTab === "faculty" ? "Faculty Request Center" : "Student Request Center"}
          </h1>
          <p className="text-slate-500">
            {mainTab === "faculty" 
              ? "Review and approve faculty publications, projects, and achievements." 
              : "Manage student achievement submissions for the Hall of Excellence."}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#9d2235]/10 px-4 py-1.5 text-xs font-bold text-[#9d2235]">
          <ShieldAlert size={14} />
          ADMIN ACCESS
        </div>
      </div>

      {/* Content Swap */}
      {mainTab === "faculty" ? (
        <AdminPanel initialTab="pending" />
      ) : (
        <StudentAdminSection />
      )}
    </div>
  );
}
