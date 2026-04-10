import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div>
      <section className="bg-[linear-gradient(135deg,#f6b800_0%,#ffd64a_52%,#ffeaa3_100%)] px-4 py-16 md:px-8">
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
    </div>
  );
}
