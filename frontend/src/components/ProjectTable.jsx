export default function ProjectTable({ items = [], showApproval = false }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Title</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Agency</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Amount</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
            <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Links</th>
            {showApproval && <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Approval</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((row) => (
            <tr key={row.id} className="transition hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-800">{row.title}</td>
              <td className="px-4 py-3 text-slate-600">{row.funding_agency || "\u2014"}</td>
              <td className="px-4 py-3 text-slate-600">{Number(row.amount || 0).toLocaleString()}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  row.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                }`}>{row.status || "\u2014"}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {row.reference_url && <a href={row.reference_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#9d2235] hover:underline">URL</a>}
                  {row.pdf_url && <a href={row.pdf_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#9d2235] hover:underline">PDF</a>}
                  {!row.reference_url && !row.pdf_url && <span className="text-slate-400">\u2014</span>}
                </div>
              </td>
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
              <td colSpan={showApproval ? 6 : 5} className="px-4 py-8 text-center text-sm text-slate-400">
                No project records available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
