import FacultyList from "../components/FacultyList";
import { useFacultyList } from "../hooks/useFaculty";
import { useAuth } from "../context/AuthContext";

export default function FacultyListPage() {
  const { token } = useAuth();
  const { data, isLoading, error } = useFacultyList(token);

  return (
    <section>
      <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-14 text-slate-900 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-700">People</p>
          <h1 className="mt-2 text-4xl font-black">Faculty Members</h1>
          <p className="mt-2 text-lg text-slate-800">NBA-ready profiles with approved and structured academic records.</p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {isLoading && <p>Loading faculty list...</p>}
        {error && <p className="text-rose-600">{error.message}</p>}
        {!isLoading && !error && <FacultyList faculty={data || []} />}
      </div>
    </section>
  );
}
