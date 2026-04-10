import FacultyCard from "./FacultyCard";

export default function FacultyList({ faculty = [] }) {
  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {faculty.map((f) => (
        <FacultyCard key={f.id} faculty={f} />
      ))}
    </section>
  );
}
