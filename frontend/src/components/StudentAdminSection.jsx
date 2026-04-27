import React, { useState, useEffect, useCallback } from 'react';
import { studentApi } from '../api/studentApi';
import { CheckCircle, Clock, XCircle, ShieldHalf, List, Check, X, Undo, FileText, Search, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateStudentAchievementsPDF } from '../utils/pdfGenerator';
import '../pages/AdminStudentPage.css'; // Reuse existing CSS

const StatusBadge = ({ status }) => {
  const config = {
    approved: { cls: 'badge--approved', icon: CheckCircle, label: 'Approved' },
    pending: { cls: 'badge--pending', icon: Clock, label: 'Pending' },
    rejected: { cls: 'badge--rejected', icon: XCircle, label: 'Rejected' },
  };
  const key = status?.toLowerCase();
  const c = config[key] || config.pending;
  const Icon = c.icon;
  return (
    <span className={`status-badge ${c.cls}`}>
      <Icon size={14} className="mr-1" /> {c.label}
    </span>
  );
};

const StudentAdminSection = ({ initialFilter = 'all' }) => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);

  const resolveFilter = (f) => {
    if (!f || f === 'all') return 'All';
    return f.charAt(0).toUpperCase() + f.slice(1).toLowerCase();
  };

  const [filterStatus, setFilterStatus] = useState(() => resolveFilter(initialFilter));

  useEffect(() => {
    setFilterStatus(resolveFilter(initialFilter));
  }, [initialFilter]);

  const [filterDeptId, setFilterDeptId] = useState('All');
  const [filterCategoryId, setFilterCategoryId] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        department_id: filterDeptId,
        category_id: filterCategoryId
      };

      const results = await Promise.allSettled([
        studentApi.getApproved(params),
        studentApi.getPending(params),
        studentApi.getRejected(params),
        studentApi.getFilters(),
      ]);

      const approved = results[0].status === 'fulfilled' ? results[0].value : [];
      const pending = results[1].status === 'fulfilled' ? results[1].value : [];
      const rejected = results[2].status === 'fulfilled' ? results[2].value : [];
      const filterData = results[3].status === 'fulfilled' ? results[3].value : { departments: [], categories: [] };

      setDepartments(filterData.departments || []);
      setCategories(filterData.categories || []);

      const all = [
        ...(Array.isArray(approved) ? approved : []),
        ...(Array.isArray(pending) ? pending : []),
        ...(Array.isArray(rejected) ? rejected : []),
      ];

      const seen = new Set();
      const deduped = all.filter(a => {
        if (seen.has(a.achievement_id)) return false;
        seen.add(a.achievement_id);
        return true;
      });

      setAchievements(deduped);
    } catch (err) {
      setError('Could not connect to server...');
    } finally {
      setLoading(false);
    }
  }, [filterDeptId, filterCategoryId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateStatus = async (id, status) => {
    setActionLoading(prev => ({ ...prev, [id]: status }));
    try {
      await studentApi.updateStatus(id, status, user?.id);
      await fetchAll();
      const type = status === 'approved' ? 'success' : (status === 'pending' ? 'info' : 'error');
      const msg = status === 'pending' ? 'Achievement moved back to pending.' : `Achievement ${status} successfully.`;
      showToast(msg, type);
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setActionLoading(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const filtered = achievements.filter(a => {
    const currentStatus = a.status?.trim().toLowerCase();
    const targetFilter = filterStatus.toLowerCase();
    const matchStatus = filterStatus === 'All' || currentStatus === targetFilter;

    const matchSearch = !searchQuery ||
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.roll_no?.toString().includes(searchQuery) ||
      a.title?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchStatus && matchSearch;
  });

  const selectedDepartment = departments.find((d) => String(d.department_id) === String(filterDeptId));
  const selectedCategory = categories.find((c) => String(c.category_id) === String(filterCategoryId));

  const handleExportPDF = () => {
    try {
      const pdf = generateStudentAchievementsPDF(filtered, {
        department: filterDeptId === 'All' ? 'All' : (selectedDepartment?.dept_name || filterDeptId),
        category: filterCategoryId === 'All' ? 'All' : (selectedCategory?.category_name || filterCategoryId),
        status: filterStatus,
        search: searchQuery,
      });

      const fileName = `VJTI_Student_Submissions_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      showToast(`PDF exported successfully as ${fileName}`, 'success');
    } catch (err) {
      console.error('PDF generation failed:', err);
      showToast('Failed to generate PDF. Please try again.', 'error');
    }
  };

  const counts = {
    All: achievements.length,
    Pending: achievements.filter(a => a.status?.toLowerCase() === 'pending').length,
    Approved: achievements.filter(a => a.status?.toLowerCase() === 'approved').length,
    Rejected: achievements.filter(a => a.status?.toLowerCase() === 'rejected').length,
  };

  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  return (
    <div className="smooth-fade">
      {toast && (
        <div className={`toast toast--${toast.type}`}>
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error' && <AlertTriangle size={18} />}
          {toast.type === 'info' && <RefreshCw size={18} className="animate-spin-slow" />}
          {toast.msg}
        </div>
      )}

      <div className="admin-stats mt-6">
        {[
          { label: 'Total', value: counts.All, icon: List, color: 'default' },
          { label: 'Pending', value: counts.Pending, icon: Clock, color: 'pending' },
          { label: 'Approved', value: counts.Approved, icon: Check, color: 'approved' },
          { label: 'Rejected', value: counts.Rejected, icon: X, color: 'rejected' },
        ].map(s => (
          <div key={s.label} className={`admin-stat admin-stat--${s.color}`}>
            <div className="admin-stat__icon"><s.icon size={18} /></div>
            <div className="admin-stat__value">{s.value}</div>
            <div className="admin-stat__label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search student or title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select value={filterDeptId} onChange={e => setFilterDeptId(e.target.value)}>
          <option value="All">All Departments</option>
          {departments.map(d => (
            <option key={d.department_id} value={d.department_id}>{d.dept_name}</option>
          ))}
        </select>

        <select value={filterCategoryId} onChange={e => setFilterCategoryId(e.target.value)}>
          <option value="All">All Categories</option>
          {categories.map(c => (
            <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
          ))}
        </select>

        <div className="toolbar-filters">
          {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
            <button
              key={s}
              className={`toolbar-filter ${filterStatus === s ? 'toolbar-filter--active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s} <span className="toolbar-filter__count">{counts[s]}</span>
            </button>
          ))}
        </div>
        <button className="btn-refresh" onClick={fetchAll}>
          <RefreshCw size={16} />
        </button>
        <button className="btn-export-pdf" onClick={handleExportPDF}>
          <FileText size={16} /> Print PDF
        </button>
      </div>

      {loading ? (
        <div className="admin-loading py-20">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : error ? (
        <div className="admin-error py-10">
          <p>{error}</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Achievement</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">No results found</td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.achievement_id} className="table-row">
                    <td>
                      <div className="student-cell">
                        <div className="student-cell__avatar">{a.name?.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="student-cell__name">{a.name}</div>
                          <div className="student-cell__meta">{a.roll_no}</div>
                        </div>
                      </div>
                    </td>
                    <td><div className="title-cell__title">{a.title}</div></td>
                    <td><span className="cat-tag">{a.category_name}</span></td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      <div className="action-btns">
                        {a.status?.toLowerCase() !== 'approved' && (
                          <button className="action-btn action-btn--approve" onClick={() => updateStatus(a.achievement_id, 'approved')}>
                            <Check size={14} />
                          </button>
                        )}
                        {a.status?.toLowerCase() !== 'rejected' && (
                          <button className="action-btn action-btn--reject" onClick={() => updateStatus(a.achievement_id, 'rejected')}>
                            <X size={14} />
                          </button>
                        )}
                        {a.status?.toLowerCase() !== 'pending' && (
                          <button
                            className="action-btn action-btn--reset"
                            onClick={() => updateStatus(a.achievement_id, 'pending')}
                            disabled={!!actionLoading[a.achievement_id]}
                            title="Reset to Pending"
                          >
                            <Undo size={14} />
                          </button>
                        )}
                        {a.file_path && (
                          <a href={`${backendUrl}/${a.file_path.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="action-btn">
                            <FileText size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="table-footer mt-4">
        Showing {filtered.length} submissions
      </div>
    </div>
  );
};

export default StudentAdminSection;
