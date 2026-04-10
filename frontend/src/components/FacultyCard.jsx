import { Link } from "react-router-dom";

export default function FacultyCard({ faculty }) {
  return (
    <article className="glass-card flex flex-col rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-50/80 to-white/70 p-4 shadow-sm backdrop-blur-lg transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex gap-4">
        <img
          src={faculty.photo_url || "https://via.placeholder.com/120x120?text=Faculty"}
          alt={faculty.name}
          className="h-24 w-24 rounded object-cover ring-2 ring-amber-300"
        />
        <div>
          <h3 className="text-xl font-bold text-slate-800">{faculty.name}</h3>
          <p className="font-medium text-slate-600">{faculty.designation}</p>
          <p className="text-sm text-slate-500">{faculty.department}</p>
          <p className="mt-1 text-sm text-slate-500">{faculty.email}</p>
        </div>
      </div>
      <p className="mt-4 line-clamp-3 text-sm text-slate-600">{faculty.research_area}</p>
      <Link
        to={`/faculty/${faculty.id}`}
        className="gold-button mt-4 inline-flex w-fit items-center rounded px-4 py-2 text-sm font-semibold text-slate-900 hover:-translate-y-0.5"
      >
        View Profile
      </Link>
    </article>
  );
}
