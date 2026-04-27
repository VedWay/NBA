import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold text-white">VJTI Mumbai</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Veermata Jijabai Technological Institute — an autonomous institute affiliated to the University of Mumbai, established in 1887.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#c3475b]">
              NBA Accreditation Portal
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Quick Links</h4>
            <nav className="mt-4 space-y-2.5">
              {[
                { label: "Home", to: "/" },
                { label: "Faculty Directory", to: "/viewer" },
                { label: "Student Achievements", to: "/students" },
                { label: "Submit Achievement", to: "/student-desk" },
                { label: "Login / Register", to: "/login" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-sm text-slate-400 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Portal Features */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Portal Features</h4>
            <nav className="mt-4 space-y-2.5">
              {[
                "Faculty Profile Management",
                "Research Publications",
                "Project & Patent Tracking",
                "Student Achievement Hall",
                "Admin Approval Workflow",
                "NBA Report Generation",
              ].map((item) => (
                <p key={item} className="text-sm text-slate-400">{item}</p>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Contact</h4>
            <div className="mt-4 space-y-3">
              <a
                href="https://vjti.ac.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 text-sm text-slate-400 transition hover:text-white"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                vjti.ac.in
              </a>
              <div className="flex items-start gap-2.5 text-sm text-slate-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>H.R. Mahajani Marg, Matunga, Mumbai - 400019</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-400">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+91-22-2419 8101</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-400">
                <Mail className="h-4 w-4 shrink-0" />
                <span>registrar@vjti.ac.in</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 md:flex-row">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} VJTI Mumbai. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            NBA Faculty Information System &mdash; Department of Computer Engineering and IT
          </p>
        </div>
      </div>
    </footer>
  );
}
