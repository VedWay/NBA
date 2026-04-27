import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ChevronDown, ChevronRight, FlaskConical, GraduationCap, BookOpen, Award, Presentation, MoreHorizontal } from "lucide-react";

const sideSections = [
  {
    key: "Research Interests",
    to: "#research",
    icon: FlaskConical,
  },
  {
    key: "Biosketch",
    to: "#biosketch",
    icon: GraduationCap,
    children: [
      { key: "Educational Details", to: "#qualifications" },
      { key: "Professional Background", to: "#projects" },
    ],
  },
  {
    key: "Research",
    to: "#publications",
    icon: BookOpen,
    children: [
      { key: "Projects", to: "#projects" },
      { key: "Publications", to: "#publications" },
      { key: "Patents", to: "#patents" },
      { key: "Proofs", to: "#research-proofs" },
      { key: "Books", to: "#books" },
      { key: "Collaborations", to: "#collaborations" },
    ],
  },
  {
    key: "Honours and Awards",
    to: "#awards",
    icon: Award,
    children: [
      { key: "Honors", to: "#honors" },
      { key: "Membership", to: "#memberships" },
      { key: "Contributions", to: "#contributions" },
    ],
  },
  {
    key: "Teaching Engagements",
    to: "#fdp",
    icon: Presentation,
  },
  {
    key: "Miscellaneous",
    to: "#misc",
    icon: MoreHorizontal,
  },
];

function SideMenuItem({ item, isExpanded, onToggle }) {
  const hasChildren = Boolean(item.children?.length);
  const Icon = item.icon;

  return (
    <div className="py-0.5">
      {hasChildren ? (
        <button
          type="button"
          onClick={() => onToggle(item.key)}
          aria-expanded={isExpanded}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-[#9d2235]/5 hover:text-[#9d2235]"
        >
          {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-400" />}
          <span className="flex-1">{item.key}</span>
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>
      ) : (
        <a
          href={item.to}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#9d2235]/5 hover:text-[#9d2235]"
        >
          {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-400" />}
          <span>{item.key}</span>
        </a>
      )}
      {hasChildren && isExpanded && (
        <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-slate-200 pl-3">
          {item.children.map((sub) => (
            <a
              key={sub.key}
              href={sub.to}
              className="block rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-[#9d2235]"
            >
              {sub.key}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const [expandedItems, setExpandedItems] = useState(() => new Set());

  const toggleItem = (key) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[280px_1fr] md:px-8">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:sticky md:top-24 md:h-[calc(100vh-7rem)] md:overflow-y-auto">
        <h2 className="mb-3 border-b border-slate-100 pb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
          Profile Sections
        </h2>
        <nav className="space-y-0.5">
          {sideSections.map((item) => (
            <SideMenuItem
              key={item.key}
              item={item}
              isExpanded={expandedItems.has(item.key)}
              onToggle={toggleItem}
            />
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children ?? <Outlet />}</div>
    </section>
  );
}
