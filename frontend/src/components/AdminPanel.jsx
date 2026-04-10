import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/facultyApi";
import { useAuth } from "../context/AuthContext";

export default function AdminPanel() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending"],
    queryFn: () => adminApi.pending(token),
  });

  const { data: auditData = [] } = useQuery({
    queryKey: ["audit"],
    queryFn: () => adminApi.audit(token, 80),
  });

  const approveMutation = useMutation({
    mutationFn: ({ table, id }) => adminApi.approve(table, id, token),
    onSuccess: () => {
      setMessage("Approved successfully.");
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
    },
    onError: (err) => setMessage(err.message || "Approve failed."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ table, id }) => adminApi.reject(table, id, token),
    onSuccess: () => {
      setMessage("Rejected successfully.");
      queryClient.invalidateQueries({ queryKey: ["pending"] });
    },
    onError: (err) => setMessage(err.message || "Reject failed."),
  });

  if (isLoading) return <p>Loading pending approvals...</p>;
  if (error) return <p className="text-rose-700">{error.message}</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Approval Panel</h1>
      {message && <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-slate-700">{message}</p>}
      {Object.entries(data || {}).map(([table, rows]) => (
        <section key={table} className="rounded border border-slate-300 bg-white p-4">
          <h2 className="mb-3 text-xl font-semibold uppercase text-slate-700">
            {table} ({rows.length})
          </h2>
          {!rows.length && <p className="text-sm text-slate-500">No pending records.</p>}
          {!!rows.length && (
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded bg-slate-50 p-3">
                  <div className="max-w-3xl text-sm text-slate-700">{row.title || row.name || row.course || row.degree}</div>
                  <div className="flex gap-2">
                    <button
                      className="rounded bg-emerald-600 px-3 py-1 text-white"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => approveMutation.mutate({ table, id: row.id })}
                    >
                      Approve
                    </button>
                    <button
                      className="rounded bg-rose-600 px-3 py-1 text-white"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate({ table, id: row.id })}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      <section className="rounded border border-slate-300 bg-white p-4">
        <h2 className="mb-3 text-xl font-semibold uppercase text-slate-700">Audit Timeline</h2>
        <div className="space-y-2">
          {auditData.map((item) => (
            <div key={item.id} className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold uppercase text-slate-600">{item.table_name} - {item.action}</p>
              <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
            </div>
          ))}
          {!auditData.length && <p className="text-sm text-slate-500">No audit logs yet.</p>}
        </div>
      </section>
    </div>
  );
}
