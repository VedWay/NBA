export default function FdpTable({ items = [], showApproval = false }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Title</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Role</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Duration</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Organized By</th>
            {showApproval && <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((row) => (
            <tr key={row.id} className="transition hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-800">{row.title}</td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">{row.role || "\u2014"}</span>
              </td>
              <td className="px-4 py-3 text-slate-600">{row.duration || "\u2014"}</td>
              <td className="px-4 py-3 text-slate-600">{row.organized_by || "\u2014"}</td>
              {showApproval && (
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${row.is_approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${row.is_approved ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {row.is_approved ? "Approved" : "Pending"}
                  </span>
                </td>
              )}
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan={showApproval ? 5 : 4} className="px-4 py-8 text-center text-sm text-slate-400">
                No teaching engagement records available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
