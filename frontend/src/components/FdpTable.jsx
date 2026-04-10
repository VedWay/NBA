export default function FdpTable({ items = [], showApproval = false }) {
  return (
    <div className="overflow-x-auto rounded border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-amber-100 text-slate-800">
          <tr>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Duration</th>
            <th className="px-3 py-2">Organized By</th>
            {showApproval && <th className="px-3 py-2">Approval</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-t border-slate-200">
              <td className="px-3 py-2">{row.title}</td>
              <td className="px-3 py-2">{row.role}</td>
              <td className="px-3 py-2">{row.duration}</td>
              <td className="px-3 py-2">{row.organized_by}</td>
              {showApproval && (
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${row.is_approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                    {row.is_approved ? "Approved" : "Pending"}
                  </span>
                </td>
              )}
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={showApproval ? 5 : 4} className="px-3 py-4 text-center text-slate-500">
                No FDP records available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
