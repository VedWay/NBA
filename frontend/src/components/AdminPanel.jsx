import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/facultyApi";
import { useAuth } from "../context/AuthContext";

function labelForRow(row) {
  return row.title || row.name || row.course || row.degree || "Untitled";
}

function getFacultyBucketKey(table, row) {
  if (table === "faculty") return row.id;
  return row.faculty_id || "unknown";
}

function humanizeKey(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function AdminPanel({ initialTab = "pending" }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { data: pendingData, isLoading, error } = useQuery({
    queryKey: ["pending"],
    queryFn: () => adminApi.pending(token),
  });

  const { data: auditData = [] } = useQuery({
    queryKey: ["audit"],
    queryFn: () => adminApi.audit(token, 80),
  });

  const { data: historyData = [] } = useQuery({
    queryKey: ["approval-history"],
    queryFn: () => adminApi.history(token, 300),
  });

  const { data: facultyDirectory = [] } = useQuery({
    queryKey: ["admin-faculty"],
    queryFn: () => adminApi.faculty(token),
  });

  const facultyMap = useMemo(() => new Map((facultyDirectory || []).map((f) => [f.id, f])), [facultyDirectory]);

  const groupedPending = useMemo(() => {
    const groups = new Map();
    for (const [table, rows] of Object.entries(pendingData || {})) {
      for (const row of rows || []) {
        const facultyKey = getFacultyBucketKey(table, row);
        if (!groups.has(facultyKey)) {
          const faculty = facultyMap.get(facultyKey);
          groups.set(facultyKey, {
            facultyKey,
            faculty,
            entries: [],
          });
        }
        groups.get(facultyKey).entries.push({ table, row });
      }
    }
    return Array.from(groups.values()).sort((a, b) => (b.entries.length || 0) - (a.entries.length || 0));
  }, [pendingData, facultyMap]);

  const approveMutation = useMutation({
    mutationFn: ({ table, id }) => adminApi.approve(table, id, token),
    onSuccess: () => {
      setMessage("Approved successfully.");
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      queryClient.invalidateQueries({ queryKey: ["approval-history"] });
    },
    onError: (err) => setMessage(err.message || "Approve failed."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ table, id }) => adminApi.reject(table, id, token),
    onSuccess: () => {
      setMessage("Rejected successfully.");
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      queryClient.invalidateQueries({ queryKey: ["approval-history"] });
    },
    onError: (err) => setMessage(err.message || "Reject failed."),
  });

  const removeDetailMutation = useMutation({
    mutationFn: ({ table, id }) => adminApi.removeDetail(table, id, token),
    onSuccess: () => {
      setMessage("Detail removed successfully.");
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      queryClient.invalidateQueries({ queryKey: ["approval-history"] });
    },
    onError: (err) => setMessage(err.message || "Unable to remove detail."),
  });

  const removeFacultyMutation = useMutation({
    mutationFn: (id) => adminApi.removeFaculty(id, token),
    onSuccess: () => {
      setMessage("Faculty removed successfully.");
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      queryClient.invalidateQueries({ queryKey: ["admin-faculty"] });
      queryClient.invalidateQueries({ queryKey: ["approval-history"] });
    },
    onError: (err) => setMessage(err.message || "Unable to remove faculty."),
  });

  const closeDetails = () => setSelectedRequest(null);

  const selectedProfileId = selectedRequest
    ? selectedRequest.table === "faculty"
      ? selectedRequest.row.id
      : selectedRequest.row.faculty_id || selectedRequest.faculty?.id
    : null;

  if (isLoading) return <p>Loading pending approvals...</p>;
  if (error) return <p className="text-rose-700">{error.message}</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Approval Panel</h1>
      {message && <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-slate-700">{message}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("pending")}
          className={`rounded px-4 py-2 text-sm font-semibold ${activeTab === "pending" ? "bg-amber-400 text-slate-900" : "bg-white text-slate-700"}`}
        >
          Pending by Faculty
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`rounded px-4 py-2 text-sm font-semibold ${activeTab === "history" ? "bg-amber-400 text-slate-900" : "bg-white text-slate-700"}`}
        >
          Past Approvals
        </button>
        <button
          onClick={() => setActiveTab("faculty")}
          className={`rounded px-4 py-2 text-sm font-semibold ${activeTab === "faculty" ? "bg-amber-400 text-slate-900" : "bg-white text-slate-700"}`}
        >
          Faculty Directory
        </button>
      </div>

      {activeTab === "pending" && (
        <section className="space-y-4">
          {!groupedPending.length && <p className="text-sm text-slate-500">No pending records.</p>}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {groupedPending.map((group) => {
              const f = group.faculty;
              return (
                <article key={group.facultyKey} className="glass-card rounded-xl border border-amber-300/60 bg-white/80 p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <img
                      src={f?.photo_url || "https://via.placeholder.com/80x80?text=F"}
                      alt={f?.name || "Faculty"}
                      className="h-14 w-14 rounded object-cover ring-2 ring-amber-300"
                    />
                    <div>
                      <p className="text-lg font-bold text-slate-800">{f?.name || "Unknown Faculty"}</p>
                      <p className="text-sm text-slate-600">{f?.designation || "No designation"}</p>
                      <p className="text-xs text-slate-500">Pending: {group.entries.length}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {group.entries.map(({ table, row }) => (
                      <div
                        key={`${table}-${row.id}`}
                        className="cursor-pointer rounded border border-slate-200 bg-slate-50 p-3 transition hover:border-amber-300 hover:bg-amber-50"
                        onClick={() => setSelectedRequest({ table, row, faculty: f || null })}
                      >
                        <p className="text-xs font-semibold uppercase text-slate-500">{table}</p>
                        <p className="text-sm text-slate-800">{labelForRow(row)}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                            disabled={approveMutation.isPending || rejectMutation.isPending || removeDetailMutation.isPending}
                            onClick={(event) => {
                              event.stopPropagation();
                              approveMutation.mutate({ table, id: row.id });
                            }}
                          >
                            Approve
                          </button>
                          <button
                            className="rounded bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                            disabled={approveMutation.isPending || rejectMutation.isPending || removeDetailMutation.isPending}
                            onClick={(event) => {
                              event.stopPropagation();
                              rejectMutation.mutate({ table, id: row.id });
                            }}
                          >
                            Reject
                          </button>
                          <button
                            className="rounded border border-slate-400 px-3 py-1 text-xs font-semibold text-slate-700"
                            disabled={approveMutation.isPending || rejectMutation.isPending || removeDetailMutation.isPending}
                            onClick={(event) => {
                              event.stopPropagation();
                              removeDetailMutation.mutate({ table, id: row.id });
                            }}
                          >
                            Remove Detail
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "history" && (
        <section className="rounded border border-slate-300 bg-white p-4">
          <h2 className="mb-3 text-xl font-semibold text-slate-700">Past Approvals</h2>
          <div className="space-y-2">
            {historyData.map((item) => (
              <div key={`${item.table}-${item.id}-${item.approved_at}`} className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs uppercase text-slate-500">{item.table}</p>
                <p className="text-xs text-slate-600">Faculty: {item.faculty?.name || "Unknown"}</p>
                <p className="text-xs text-slate-500">Approved at: {new Date(item.approved_at).toLocaleString()}</p>
              </div>
            ))}
            {!historyData.length && <p className="text-sm text-slate-500">No approval history found.</p>}
          </div>
        </section>
      )}

      {activeTab === "faculty" && (
        <section className="rounded border border-slate-300 bg-white p-4">
          <h2 className="mb-3 text-xl font-semibold text-slate-700">Faculty Directory</h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {facultyDirectory.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <img src={f.photo_url || "https://via.placeholder.com/60x60?text=F"} alt={f.name} className="h-12 w-12 rounded object-cover" />
                  <div>
                    <p className="font-semibold text-slate-800">{f.name}</p>
                    <p className="text-xs text-slate-600">{f.department}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFacultyMutation.mutate(f.id)}
                  disabled={removeFacultyMutation.isPending}
                  className="rounded bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  Remove Faculty
                </button>
              </div>
            ))}
            {!facultyDirectory.length && <p className="text-sm text-slate-500">No faculty entries found.</p>}
          </div>
        </section>
      )}

      <section className="rounded border border-slate-300 bg-white p-4">
        <h2 className="mb-3 text-xl font-semibold text-slate-700">Audit Timeline</h2>
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

      {selectedRequest && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4" onClick={closeDetails}>
          <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-xl border border-slate-300 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">{selectedRequest.table} request</p>
                <h3 className="text-2xl font-bold text-slate-800">{labelForRow(selectedRequest.row)}</h3>
                <p className="text-sm text-slate-600">Faculty: {selectedRequest.faculty?.name || "Unknown"}</p>
              </div>
              <button onClick={closeDetails} className="rounded border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {Object.entries(selectedRequest.row).map(([key, value]) => (
                <div key={key} className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{humanizeKey(key)}</p>
                  <p className="break-all text-sm text-slate-800">{displayValue(value)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selectedProfileId && (
                <a
                  href={`/faculty/${selectedProfileId}?preview=review&table=${encodeURIComponent(selectedRequest.table)}&request=${encodeURIComponent(selectedRequest.row.id)}&label=${encodeURIComponent(labelForRow(selectedRequest.row))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border border-blue-700 px-3 py-2 text-sm font-semibold text-blue-700"
                >
                  Open Review Page
                </a>
              )}
              <button
                className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                disabled={approveMutation.isPending || rejectMutation.isPending || removeDetailMutation.isPending}
                onClick={() => {
                  approveMutation.mutate({ table: selectedRequest.table, id: selectedRequest.row.id });
                  closeDetails();
                }}
              >
                Approve
              </button>
              <button
                className="rounded bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
                disabled={approveMutation.isPending || rejectMutation.isPending || removeDetailMutation.isPending}
                onClick={() => {
                  rejectMutation.mutate({ table: selectedRequest.table, id: selectedRequest.row.id });
                  closeDetails();
                }}
              >
                Reject
              </button>
              <button
                className="rounded border border-slate-400 px-3 py-2 text-sm font-semibold text-slate-700"
                disabled={approveMutation.isPending || rejectMutation.isPending || removeDetailMutation.isPending}
                onClick={() => {
                  removeDetailMutation.mutate({ table: selectedRequest.table, id: selectedRequest.row.id });
                  closeDetails();
                }}
              >
                Remove Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
