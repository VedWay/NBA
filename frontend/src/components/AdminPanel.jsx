import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { achievementApi, adminApi } from "../api/facultyApi";
import { useAuth } from "../context/AuthContext";
import { generateAdminReportPDF } from "../utils/pdfGenerator";
import adminBasePhoto from "../assets/admin-base-photo.svg";

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

function AchievementPreview({ item }) {
  if (item.media_type === "image") {
    return <img src={item.media_url} alt={item.title} className="h-40 w-full rounded-xl object-cover" />;
  }

  if (item.media_type === "youtube") {
    return (
      <div className="liquid-control flex h-40 items-center justify-center rounded-xl px-3 text-xs font-semibold text-slate-700">
        YouTube video configured
      </div>
    );
  }

  if (item.media_type === "pdf") {
    return (
      <div className="liquid-control flex h-40 items-center justify-center rounded-xl px-3 text-xs font-semibold text-slate-700">
        PDF attached
      </div>
    );
  }

  return (
    <div className="liquid-control flex h-40 items-center justify-center rounded-xl px-3 text-xs font-semibold text-slate-700">
      External link attached
    </div>
  );
}

export default function AdminPanel({ initialTab = "pending" }) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    table: "",
    id: "",
    remark: "",
    closeDetailsAfter: false,
  });
  const [editingAchievementId, setEditingAchievementId] = useState("");
  const [achievementForm, setAchievementForm] = useState({
    faculty_id: "",
    title: "",
    summary: "",
    media_type: "image",
    media_url: "",
    thumbnail_url: "",
    display_order: 0,
    is_published: true,
  });
  const [filters, setFilters] = useState({
    designation: "all",
    department: "all",
    table: "all",
    status: "all",
    from: "",
    to: "",
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const { data: pendingData, isLoading, error } = useQuery({
    queryKey: ["pending"],
    queryFn: () => adminApi.pending(token),
  });

  const { data: historyData = [] } = useQuery({
    queryKey: ["approval-history"],
    queryFn: () => adminApi.history(token, 300),
  });

  const { data: facultyDirectory = [] } = useQuery({
    queryKey: ["admin-faculty"],
    queryFn: () => adminApi.faculty(token),
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["admin-achievements"],
    queryFn: () => achievementApi.listAdmin(token),
  });

  const facultyMap = useMemo(() => new Map((facultyDirectory || []).map((f) => [f.id, f])), [facultyDirectory]);

  const designationOptions = useMemo(
    () => ["all", ...Array.from(new Set((facultyDirectory || []).map((f) => f.designation).filter(Boolean)))],
    [facultyDirectory],
  );

  const departmentOptions = useMemo(
    () => ["all", ...Array.from(new Set((facultyDirectory || []).map((f) => f.department).filter(Boolean)))],
    [facultyDirectory],
  );

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

  const filteredPendingGroups = useMemo(() => {
    const fromDate = filters.from ? new Date(filters.from) : null;
    const toDate = filters.to ? new Date(filters.to) : null;

    return groupedPending
      .map((group) => {
        const f = group.faculty;
        if (filters.designation !== "all" && f?.designation !== filters.designation) return null;
        if (filters.department !== "all" && f?.department !== filters.department) return null;

        const entries = group.entries.filter(({ table, row }) => {
          if (filters.table !== "all" && table !== filters.table) return false;
          if (filters.status === "approved") return false;
          const rowDate = row?.created_at ? new Date(row.created_at) : null;
          if (fromDate && rowDate && rowDate < fromDate) return false;
          if (toDate && rowDate && rowDate > toDate) return false;
          return true;
        });

        if (!entries.length) return null;
        return { ...group, entries };
      })
      .filter(Boolean);
  }, [groupedPending, filters]);

  const filteredHistory = useMemo(() => {
    const fromDate = filters.from ? new Date(filters.from) : null;
    const toDate = filters.to ? new Date(filters.to) : null;
    return (historyData || []).filter((item) => {
      if (filters.designation !== "all" && item.faculty?.designation !== filters.designation) return false;
      if (filters.department !== "all" && item.faculty?.department !== filters.department) return false;
      if (filters.table !== "all" && item.table !== filters.table) return false;
      if (filters.status === "pending") return false;
      const date = item.approved_at ? new Date(item.approved_at) : null;
      if (fromDate && date && date < fromDate) return false;
      if (toDate && date && date > toDate) return false;
      return true;
    });
  }, [historyData, filters]);

  const filteredFaculty = useMemo(() => {
    const fromDate = filters.from ? new Date(filters.from) : null;
    const toDate = filters.to ? new Date(filters.to) : null;
    return (facultyDirectory || []).filter((f) => {
      if (filters.designation !== "all" && f.designation !== filters.designation) return false;
      if (filters.department !== "all" && f.department !== filters.department) return false;
      if (filters.status === "approved" && !f.is_approved) return false;
      if (filters.status === "pending" && f.is_approved) return false;
      const date = f.created_at ? new Date(f.created_at) : null;
      if (fromDate && date && date < fromDate) return false;
      if (toDate && date && date > toDate) return false;
      return true;
    });
  }, [facultyDirectory, filters]);

  const sortedFaculty = useMemo(
    () => [...filteredFaculty].sort((a, b) => Number(a.is_approved) - Number(b.is_approved)),
    [filteredFaculty],
  );

  const filteredPendingEntries = useMemo(
    () => filteredPendingGroups.flatMap((group) => group.entries.map(({ table, row }) => ({ table, id: row.id }))),
    [filteredPendingGroups],
  );

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
    mutationFn: ({ table, id, remark }) => adminApi.reject(table, id, token, { remark }),
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

  const saveAchievementMutation = useMutation({
    mutationFn: (payload) => {
      if (editingAchievementId) {
        return achievementApi.update(editingAchievementId, payload, token);
      }
      return achievementApi.create(payload, token);
    },
    onSuccess: () => {
      setMessage(editingAchievementId ? "Achievement updated." : "Achievement created.");
      setEditingAchievementId("");
      setAchievementForm({
        faculty_id: "",
        title: "",
        summary: "",
        media_type: "image",
        media_url: "",
        thumbnail_url: "",
        display_order: 0,
        is_published: true,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-achievements"] });
      queryClient.invalidateQueries({ queryKey: ["achievements", "public"] });
    },
    onError: (err) => setMessage(err.message || "Unable to save achievement."),
  });

  const removeAchievementMutation = useMutation({
    mutationFn: (id) => achievementApi.remove(id, token),
    onSuccess: () => {
      setMessage("Achievement removed.");
      queryClient.invalidateQueries({ queryKey: ["admin-achievements"] });
      queryClient.invalidateQueries({ queryKey: ["achievements", "public"] });
    },
    onError: (err) => setMessage(err.message || "Unable to remove achievement."),
  });

  const startEditAchievement = (item) => {
    setEditingAchievementId(item.id);
    setAchievementForm({
      faculty_id: item.faculty_id || "",
      title: item.title || "",
      summary: item.summary || "",
      media_type: item.media_type || "image",
      media_url: item.media_url || "",
      thumbnail_url: item.thumbnail_url || "",
      display_order: Number(item.display_order || 0),
      is_published: Boolean(item.is_published),
    });
    setActiveTab("achievements");
  };

  const resetAchievementForm = () => {
    setEditingAchievementId("");
    setAchievementForm({
      faculty_id: "",
      title: "",
      summary: "",
      media_type: "image",
      media_url: "",
      thumbnail_url: "",
      display_order: 0,
      is_published: true,
    });
  };

  const closeDetails = () => setSelectedRequest(null);

  const openRejectDialog = ({ table, id, closeDetailsAfter = false }) => {
    setRejectDialog({
      open: true,
      table,
      id,
      remark: "",
      closeDetailsAfter,
    });
  };

  const closeRejectDialog = () => {
    setRejectDialog({
      open: false,
      table: "",
      id: "",
      remark: "",
      closeDetailsAfter: false,
    });
  };

  const submitReject = (remark) => {
    rejectMutation.mutate({ table: rejectDialog.table, id: rejectDialog.id, remark: remark.trim() });
    if (rejectDialog.closeDetailsAfter) {
      closeDetails();
    }
    closeRejectDialog();
  };

  const actionBusy = bulkBusy || approveMutation.isPending || rejectMutation.isPending || removeDetailMutation.isPending;

  const runBulkAction = async (entries, action) => {
    const deduped = Array.from(new Map(entries.map((entry) => [`${entry.table}:${entry.id}`, entry])).values());
    if (!deduped.length) {
      setMessage("No pending requests found for bulk action.");
      return;
    }

    setBulkBusy(true);
    let success = 0;
    let failed = 0;

    for (const entry of deduped) {
      try {
        if (action === "approve") {
          await adminApi.approve(entry.table, entry.id, token);
        } else {
          await adminApi.reject(entry.table, entry.id, token, { remark: "" });
        }
        success += 1;
      } catch {
        failed += 1;
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["pending"] });
    await queryClient.invalidateQueries({ queryKey: ["faculty"] });
    await queryClient.invalidateQueries({ queryKey: ["approval-history"] });
    setBulkBusy(false);
    setMessage(`${action === "approve" ? "Approved" : "Rejected"} ${success} request(s)${failed ? `, ${failed} failed.` : "."}`);
  };

  const selectedProfileId = selectedRequest
    ? selectedRequest.table === "faculty"
      ? selectedRequest.row.id
      : selectedRequest.row.faculty_id || selectedRequest.faculty?.id
    : null;

  const generatePDF = () => {
    try {
      let pdfData = {
        title: "Pending Approvals Report",
        filters: filters,
        sections: [],
      };

      if (activeTab === "pending") {
        pdfData.title = "Pending Approvals Report";
        pdfData.sections = [
          {
            title: "Summary",
            stats: {
              "Total Pending Items": filteredPendingEntries.length,
              "Faculty Groups": filteredPendingGroups.length,
            },
          },
        ];

        filteredPendingGroups.forEach((group) => {
          const f = group.faculty;
          pdfData.sections.push({
            title: `${f?.name || "Unknown Faculty"}`,
            stats: {
              Designation: f?.designation || "—",
              Department: f?.department || "—",
              "Pending Items": group.entries.length,
            },
            items: group.entries.map(({ table, row }) => ({
              title: `${table.toUpperCase()}: ${labelForRow(row)}`,
              details: [`ID: ${row.id}`, `Created: ${row.created_at ? new Date(row.created_at).toLocaleDateString() : "N/A"}`],
            })),
          });
        });
      } else if (activeTab === "history") {
        pdfData.title = "Approval History Report";
        pdfData.sections = [
          {
            title: "Summary",
            stats: {
              "Total Approved Records": filteredHistory.length,
            },
          },
        ];

        const groupedByFaculty = {};
        filteredHistory.forEach((item) => {
          const facultyName = item.faculty?.name || "Unknown";
          if (!groupedByFaculty[facultyName]) {
            groupedByFaculty[facultyName] = [];
          }
          groupedByFaculty[facultyName].push(item);
        });

        Object.entries(groupedByFaculty).forEach(([facultyName, items]) => {
          pdfData.sections.push({
            title: facultyName,
            stats: {
              "Approved Records": items.length,
            },
            items: items.slice(0, 10).map((item) => ({
              title: `${item.table.toUpperCase()}: ${item.label}`,
              details: [`Approved: ${new Date(item.approved_at).toLocaleDateString()}`],
            })),
          });
        });
      } else if (activeTab === "faculty") {
        pdfData.title = "Faculty Directory Report";
        pdfData.sections = [
          {
            title: "Summary",
            stats: {
              "Total Faculty": sortedFaculty.length,
              Approved: sortedFaculty.filter((f) => f.is_approved).length,
              Pending: sortedFaculty.filter((f) => !f.is_approved).length,
            },
          },
        ];

        sortedFaculty.slice(0, 50).forEach((f) => {
          pdfData.sections.push({
            title: f.name,
            stats: {
              Designation: f.designation,
              Department: f.department,
              Status: f.is_approved ? "Approved" : "Pending",
            },
          });
        });

        if (sortedFaculty.length > 50) {
          pdfData.sections.push({
            title: "Note",
            stats: {
              "Additional Records": `${sortedFaculty.length - 50} more faculty members (see full list in admin panel)`,
            },
          });
        }
      }

      const pdf = generateAdminReportPDF(pdfData);
      const fileName = `NBA_Report_${activeTab}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
      setMessage(`PDF exported successfully as ${fileName}`);
    } catch (err) {
      setMessage(`Failed to generate PDF: ${err.message}`);
      console.error("PDF generation error:", err);
    }
  };

  if (isLoading) return <p>Loading pending approvals...</p>;
  if (error) return <p className="text-rose-700">{error.message}</p>;

  return (
    <div className="space-y-8">
      {message && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
          <p className="text-sm text-slate-700">{message}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {[
          { key: "pending", label: "Pending" },
          { key: "history", label: "Past Approvals" },
          { key: "faculty", label: "Faculty Directory" },
          { key: "achievements", label: "Achievements" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${activeTab === tab.key ? "bg-[#9d2235] text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Filters</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-[#9d2235]/40 focus:outline-none" value={filters.designation} onChange={(e) => setFilters((s) => ({ ...s, designation: e.target.value }))}>
            {designationOptions.map((d) => <option key={d} value={d}>{d === "all" ? "All Designations" : d}</option>)}
          </select>
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-[#9d2235]/40 focus:outline-none" value={filters.department} onChange={(e) => setFilters((s) => ({ ...s, department: e.target.value }))}>
            {departmentOptions.map((d) => <option key={d} value={d}>{d === "all" ? "All Departments" : d}</option>)}
          </select>
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-[#9d2235]/40 focus:outline-none" value={filters.table} onChange={(e) => setFilters((s) => ({ ...s, table: e.target.value }))}>
            <option value="all">All Types</option>
            <option value="faculty">Faculty</option>
            <option value="publications">Publications</option>
            <option value="projects">Projects</option>
            <option value="patents">Patents</option>
            <option value="books">Books</option>
            <option value="awards">Awards</option>
            <option value="miscellaneous_items">Miscellaneous</option>
          </select>
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-[#9d2235]/40 focus:outline-none" value={filters.status} onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
          <input type="date" className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-[#9d2235]/40 focus:outline-none" value={filters.from} onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))} />
          <input type="date" className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-[#9d2235]/40 focus:outline-none" value={filters.to} onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={generatePDF}
            className="rounded-lg bg-[#9d2235] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#7a1829] active:scale-95"
          >
            📄 Print PDF
          </button>
        </div>
      </section>

      {activeTab === "pending" && (
        <section className="space-y-4">
          {!!filteredPendingEntries.length && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">{filteredPendingEntries.length} items</span>
              <button
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                disabled={actionBusy}
                onClick={() => runBulkAction(filteredPendingEntries, "approve")}
              >
                {bulkBusy ? "Processing..." : "Accept All Filtered"}
              </button>
              <button
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
                disabled={actionBusy}
                onClick={() => runBulkAction(filteredPendingEntries, "reject")}
              >
                {bulkBusy ? "Processing..." : "Reject All Filtered"}
              </button>
            </div>
          )}
          {!filteredPendingGroups.length && <p className="py-8 text-center text-sm text-slate-400">No pending records for selected filters.</p>}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredPendingGroups.map((group) => {
              const f = group.faculty;
              return (
                <article key={group.facultyKey} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={f?.photo_url || adminBasePhoto}
                        alt={f?.name || "Faculty"}
                        className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-100"
                      />
                      <div>
                        <p className="font-bold text-slate-800">{f?.name || "Unknown Faculty"}</p>
                        <p className="text-xs text-slate-500">{f?.designation || "—"} &middot; {group.entries.length} pending</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        disabled={actionBusy}
                        onClick={() => runBulkAction(group.entries.map(({ table, row }) => ({ table, id: row.id })), "approve")}
                      >
                        Accept All
                      </button>
                      <button
                        className="rounded-md bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                        disabled={actionBusy}
                        onClick={() => runBulkAction(group.entries.map(({ table, row }) => ({ table, id: row.id })), "reject")}
                      >
                        Reject All
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 px-5">
                    {group.entries.map(({ table, row }) => (
                      <div
                        key={`${table}-${row.id}`}
                        className="cursor-pointer py-3 transition hover:bg-slate-50"
                        onClick={() => setSelectedRequest({ table, row, faculty: f || null })}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{table}</span>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{labelForRow(row)}</p>
                          </div>
                          <div className="flex shrink-0 gap-1.5">
                            <button
                              className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                              disabled={actionBusy}
                              onClick={(event) => {
                                event.stopPropagation();
                                approveMutation.mutate({ table, id: row.id });
                              }}
                            >
                              Approve
                            </button>
                            <button
                              className="rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                              disabled={actionBusy}
                              onClick={(event) => {
                                event.stopPropagation();
                                openRejectDialog({ table, id: row.id });
                              }}
                            >
                              Reject
                            </button>
                            <button
                              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                              disabled={actionBusy}
                              onClick={(event) => {
                                event.stopPropagation();
                                removeDetailMutation.mutate({ table, id: row.id });
                              }}
                            >
                              Remove
                            </button>
                          </div>
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
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-800">Past Approvals</h2>
            <p className="text-xs text-slate-400">{filteredHistory.length} records</p>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredHistory.map((item) => (
              <div key={`${item.table}-${item.id}-${item.approved_at}`} className="px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.faculty?.name || "Unknown"} &middot; <span className="uppercase">{item.table}</span></p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-400">{new Date(item.approved_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {!filteredHistory.length && <p className="py-8 text-center text-sm text-slate-400">No approval history found for selected filters.</p>}
          </div>
        </section>
      )}

      {activeTab === "faculty" && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-800">Faculty Directory</h2>
            <p className="text-xs text-slate-400">{sortedFaculty.length} records</p>
          </div>
          <div className="grid grid-cols-1 gap-px bg-slate-100 lg:grid-cols-2">
            {sortedFaculty.map((f) => (
              <div key={f.id} className="flex items-center justify-between bg-white px-5 py-3">
                <div className="flex items-center gap-3">
                  <img src={f.photo_url || adminBasePhoto} alt={f.name} className="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-100" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{f.name}</p>
                    <p className="text-[11px] text-slate-500">{f.designation} &middot; {f.department}</p>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {f.is_approved ? "Approved" : "Pending approval"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!f.is_approved && (
                    <button
                      onClick={() => approveMutation.mutate({ table: "faculty", id: f.id })}
                      disabled={actionBusy}
                      className="rounded-md bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => removeFacultyMutation.mutate(f.id)}
                    disabled={removeFacultyMutation.isPending}
                    className="rounded-md border border-rose-200 bg-white px-3 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {!sortedFaculty.length && <p className="col-span-full bg-white py-8 text-center text-sm text-slate-400">No faculty entries found for selected filters.</p>}
          </div>
        </section>
      )}

      {activeTab === "achievements" && (
        <section className="liquid-glass space-y-4 rounded-2xl p-4">
          <h2 className="text-xl font-semibold text-slate-700">Manage Latest Achievements</h2>

          <div className="liquid-panel grid grid-cols-1 gap-3 rounded-2xl p-3 md:grid-cols-2">
            <input
              className="liquid-control rounded-xl px-3 py-2"
              placeholder="Title"
              value={achievementForm.title}
              onChange={(e) => setAchievementForm((s) => ({ ...s, title: e.target.value }))}
            />
            <select
              className="liquid-control rounded-xl px-3 py-2"
              value={achievementForm.faculty_id}
              onChange={(e) => setAchievementForm((s) => ({ ...s, faculty_id: e.target.value }))}
            >
              <option value="">No linked faculty</option>
              {facultyDirectory.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <textarea
              className="liquid-control rounded-xl px-3 py-2 md:col-span-2"
              rows={2}
              placeholder="Summary"
              value={achievementForm.summary}
              onChange={(e) => setAchievementForm((s) => ({ ...s, summary: e.target.value }))}
            />
            <select
              className="liquid-control rounded-xl px-3 py-2"
              value={achievementForm.media_type}
              onChange={(e) => setAchievementForm((s) => ({ ...s, media_type: e.target.value }))}
            >
              <option value="image">Image</option>
              <option value="pdf">PDF</option>
              <option value="youtube">YouTube</option>
              <option value="link">External Link</option>
            </select>
            <input
              className="liquid-control rounded-xl px-3 py-2"
              placeholder="Display Order"
              type="number"
              value={achievementForm.display_order}
              onChange={(e) => setAchievementForm((s) => ({ ...s, display_order: Number(e.target.value || 0) }))}
            />
            <input
              className="liquid-control rounded-xl px-3 py-2 md:col-span-2"
              placeholder="Media URL"
              value={achievementForm.media_url}
              onChange={(e) => setAchievementForm((s) => ({ ...s, media_url: e.target.value }))}
            />
            <input
              className="liquid-control rounded-xl px-3 py-2 md:col-span-2"
              placeholder="Thumbnail URL (optional)"
              value={achievementForm.thumbnail_url}
              onChange={(e) => setAchievementForm((s) => ({ ...s, thumbnail_url: e.target.value }))}
            />
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={achievementForm.is_published}
                onChange={(e) => setAchievementForm((s) => ({ ...s, is_published: e.target.checked }))}
              />
              Publish to home page
            </label>
            <div className="flex gap-2 md:justify-end">
              <button
                className="liquid-control rounded-xl px-3 py-2 text-sm font-semibold text-slate-700"
                onClick={resetAchievementForm}
                type="button"
              >
                Reset
              </button>
              <button
                className="liquid-button rounded-xl px-3 py-2 text-sm font-semibold"
                onClick={() => saveAchievementMutation.mutate(achievementForm)}
                disabled={saveAchievementMutation.isPending}
                type="button"
              >
                {editingAchievementId ? "Update Achievement" : "Create Achievement"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {achievements.map((item) => (
              <div key={item.id} className="liquid-panel rounded-2xl p-3">
                <AchievementPreview item={item} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="mt-2">
                    <p className="font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs uppercase text-slate-500">{item.media_type} {item.is_published ? "| published" : "| hidden"}</p>
                    {item.faculty?.name && <p className="text-xs text-slate-600">Faculty: {item.faculty.name}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button className="liquid-control rounded-xl px-3 py-1 text-xs font-semibold text-slate-700" onClick={() => startEditAchievement(item)}>
                      Edit
                    </button>
                    <button
                      className="rounded-xl bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                      onClick={() => removeAchievementMutation.mutate(item.id)}
                      disabled={removeAchievementMutation.isPending}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {item.summary && <p className="mt-2 text-sm text-slate-600">{item.summary}</p>}
                <a href={item.media_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-blue-700 underline">
                  Open Media
                </a>
              </div>
            ))}
            {!achievements.length && <p className="text-sm text-slate-500">No achievements created yet.</p>}
          </div>
        </section>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={closeDetails}>
          <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{selectedRequest.table}</span>
                <h3 className="mt-2 text-xl font-bold text-slate-800">{labelForRow(selectedRequest.row)}</h3>
                <p className="mt-1 text-sm text-slate-500">Faculty: {selectedRequest.faculty?.name || "Unknown"}</p>
              </div>
              <button onClick={closeDetails} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {Object.entries(selectedRequest.row).map(([key, value]) => (
                <div key={key} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{humanizeKey(key)}</p>
                  <p className="mt-0.5 break-all text-sm text-slate-800">{displayValue(value)}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {selectedProfileId && (
                <a
                  href={`/faculty/${selectedProfileId}?preview=review&table=${encodeURIComponent(selectedRequest.table)}&request=${encodeURIComponent(selectedRequest.row.id)}&label=${encodeURIComponent(labelForRow(selectedRequest.row))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-[#9d2235]/30 px-4 py-2 text-xs font-bold text-[#9d2235] transition hover:bg-[#9d2235]/5"
                >
                  Open Review Page
                </a>
              )}
              <button
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                disabled={actionBusy}
                onClick={() => {
                  approveMutation.mutate({ table: selectedRequest.table, id: selectedRequest.row.id });
                  closeDetails();
                }}
              >
                Approve
              </button>
              <button
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
                disabled={actionBusy}
                onClick={() => {
                  openRejectDialog({ table: selectedRequest.table, id: selectedRequest.row.id, closeDetailsAfter: true });
                }}
              >
                Reject
              </button>
              <button
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                disabled={actionBusy}
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

      {rejectDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={closeRejectDialog}>
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800">Reject Request</h3>
            <p className="mt-1 text-sm text-slate-500">Add an optional remark for the faculty member.</p>
            <textarea
              rows={4}
              maxLength={500}
              value={rejectDialog.remark}
              onChange={(event) => setRejectDialog((prev) => ({ ...prev, remark: event.target.value }))}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
              placeholder="Optional remark (max 500 characters)"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400">{rejectDialog.remark.length}/500</p>
            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                onClick={closeRejectDialog}
                disabled={rejectMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                onClick={() => submitReject("")}
                disabled={rejectMutation.isPending}
              >
                Reject Without Remark
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
                onClick={() => submitReject(rejectDialog.remark)}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject and Send Remark"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
