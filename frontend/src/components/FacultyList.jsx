import FacultyCard from "./FacultyCard";
import { Users } from "lucide-react";

export default function FacultyList({ faculty = [] }) {
  if (!faculty.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <Users className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-4 text-lg font-bold text-slate-700">No Faculty Profiles Found</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          No profiles match your current filters. Try adjusting your search or filter criteria.
        </p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {faculty.map((f) => (
        <FacultyCard key={f.id} faculty={f} />
      ))}
    </section>
  );
}
