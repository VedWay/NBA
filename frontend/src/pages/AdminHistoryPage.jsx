import { Link } from "react-router-dom";
import AdminPanel from "../components/AdminPanel";
import { ArrowLeft, History } from "lucide-react";

export default function AdminHistoryPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#9d2235]" />
            <h1 className="text-2xl font-bold text-slate-800">Approval History</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/faculty" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:text-[#9d2235]">Faculty Directory</Link>
          <Link to="/admin/query" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:text-[#9d2235]">Query Search</Link>
        </div>
      </div>
      <AdminPanel initialTab="history" />
    </section>
  );
}
