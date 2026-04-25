import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../api/studentApi';
import { User, Trophy, Send, ArrowLeft, Plus, Home, Info, Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import './StudentSubmitPage.css';

// Constants for levels and positions (not from DB)
const LEVELS = ['College', 'State', 'National', 'International'];
const POSITIONS = ['1st', '2nd', '3rd', 'Finalist', 'Participant', 'Winner', 'Runner-up', 'Special Mention'];

const initialForm = {
  name: '',
  roll_no: '',
  department_id: '',
  year_id: '',
  title: '',
  category_id: '',
  level: '',
  position: '',
};

const Field = ({ label, required, children, hint, error }) => (
  <div className={`form-field ${error ? 'form-field--error' : ''}`}>
    <label className="form-label">
      {label} {required && <span className="form-required">*</span>}
    </label>
    {children}
    {error && <span className="form-error"><AlertTriangle size={14} /> {error}</span>}
    {hint && !error && <span className="form-hint">{hint}</span>}
  </div>
);

const StudentSubmitPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({ departments: [], years: [], categories: [] });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingFilters, setFetchingFilters] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const data = await studentApi.getFilters();
        setFilters(data);
      } catch (err) {
        console.error('Failed to fetch filters:', err);
      } finally {
        setFetchingFilters(false);
      }
    };
    fetchFilters();
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.roll_no.trim()) e.roll_no = 'Roll number is required';
    if (!form.department_id) e.department_id = 'Department is required';
    if (!form.year_id) e.year_id = 'Year is required';
    if (!form.title.trim()) e.title = 'Achievement title is required';
    if (!form.category_id) e.category_id = 'Category is required';
    if (!form.level) e.level = 'Level is required';
    if (!form.position) e.position = 'Position is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("roll_no", form.roll_no);
      formData.append("department_id", form.department_id);
      formData.append("year_id", form.year_id);
      formData.append("title", form.title);
      formData.append("category_id", form.category_id);
      formData.append("level", form.level);
      formData.append("position", form.position);

      if (form.proof) {
        formData.append("proof", form.proof);
      }

      await studentApi.submit(formData);
      setSuccess(true);
      setForm(initialForm);
    } catch (err) {
      setErrors({
        submit: err.message || 'Failed to submit.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="submit-page">
        <div className="container">
          <div className="success-card">
            <div className="success-icon">
              <CheckCircle size={64} />
            </div>
            <h2>Achievement Submitted!</h2>
            <p>Your achievement has been submitted and is pending admin approval.</p>
            <div className="success-actions">
              <button className="btn-primary" onClick={() => setSuccess(false)}>
                <Plus size={18} /> Submit Another
              </button>
              <button className="btn-secondary" onClick={() => navigate('/students')}>
                <Home size={18} /> Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-page">
      <div className="container">
        <div className="submit-header">
          <button className="back-btn" onClick={() => navigate('/students')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="submit-title">Submit Achievement</h1>
            <p className="submit-subtitle">Celebrate your success — submit your achievement for recognition</p>
          </div>
        </div>

        <div className="submit-layout">
          <form className="submit-form" onSubmit={handleSubmit} noValidate>
            <div className="form-section">
              <div className="form-section__header">
                <div className="form-section__icon"><User size={18} /></div>
                <div>
                  <h3>Student Information</h3>
                  <p>Your personal details</p>
                </div>
              </div>
              <div className="form-grid form-grid--2">
                <Field label="Full Name" required error={errors.name}>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Arjun Mehta"
                    className="form-input"
                  />
                </Field>

                <Field label="Department" required error={errors.department_id}>
                  <select name="department_id" value={form.department_id} onChange={handleChange} className="form-input" disabled={fetchingFilters}>
                    <option value="">{fetchingFilters ? 'Loading...' : 'Select Department'}</option>
                    {filters.departments.map(d => <option key={d.department_id} value={d.department_id}>{d.dept_name}</option>)}
                  </select>
                </Field>

                <Field label="Year" required error={errors.year_id}>
                  <select name="year_id" value={form.year_id} onChange={handleChange} className="form-input" disabled={fetchingFilters}>
                    <option value="">{fetchingFilters ? 'Loading...' : 'Select Year'}</option>
                    {filters.years.map(y => <option key={y.year_id} value={y.year_id}>{y.year_name}</option>)}
                  </select>
                </Field>

                <Field label="Roll Number" required hint="Your enrollment number" error={errors.roll_no}>
                  <input
                    type="text"
                    name="roll_no"
                    value={form.roll_no}
                    onChange={handleChange}
                    placeholder="e.g. 211080001"
                    className="form-input"
                  />
                </Field>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section__header">
                <div className="form-section__icon"><Trophy size={18} /></div>
                <div>
                  <h3>Achievement Details</h3>
                  <p>Tell us about your accomplishment</p>
                </div>
              </div>

              <div className="form-grid form-grid--1">
                <Field label="Achievement Title" required error={errors.title}>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Winner – Smart India Hackathon 2024"
                    className="form-input"
                  />
                </Field>
              </div>

              <div className="form-grid form-grid--3">
                <Field label="Category" required error={errors.category_id}>
                  <select name="category_id" value={form.category_id} onChange={handleChange} className="form-input" disabled={fetchingFilters}>
                    <option value="">{fetchingFilters ? 'Loading...' : 'Select Category'}</option>
                    {filters.categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                  </select>
                </Field>

                <Field label="Level" required error={errors.level}>
                  <select name="level" value={form.level} onChange={handleChange} className="form-input">
                    <option value="">Select Level</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>

                <Field label="Position / Rank" required error={errors.position}>
                  <select name="position" value={form.position} onChange={handleChange} className="form-input">
                    <option value="">Select Position</option>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>

                <Field label="Upload Proof (PDF/Image)" required>
                  <input
                    type="file"
                    name="proof"
                    onChange={(e) => setForm(prev => ({ ...prev, proof: e.target.files[0] }))}
                    className="form-input"
                  />
                </Field>
              </div>
            </div>

            {errors.submit && (
              <div className="form-submit-error">
                <AlertTriangle size={18} /> {errors.submit}
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setForm(initialForm)}>
                Reset
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {loading ? 'Submitting...' : 'Submit Achievement'}
              </button>
            </div>
          </form>

          <aside className="submit-sidebar">
            <div className="sidebar-card">
              <h4><Info size={18} /> Guidelines</h4>
              <ul className="sidebar-list">
                <li>Ensure all information is accurate</li>
                <li>Include the official event name</li>
                <li>Entries are reviewed by administration</li>
                <li>One submission per achievement</li>
              </ul>
            </div>
            <div className="sidebar-card sidebar-card--accent">
              <h4><Clock size={18} /> Review Timeline</h4>
              <p>Typically reviewed within <strong>3–5 working days</strong>.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StudentSubmitPage;
