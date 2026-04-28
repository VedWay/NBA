import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AchievementCard from '../components/AchievementCard';
import { studentApi } from '../api/studentApi';
import { Trophy, Medal, Building2, Globe, Search, X, Upload, ArrowDown, GraduationCap, RefreshCw, AlertCircle, Loader2, FileText } from 'lucide-react';
import { generateStudentAchievementsPDF } from '../utils/pdfGenerator';
import './StudentAchievementsPage.css';

const CATEGORIES = ['All', 'Hackathon', 'Sports', 'Cultural', 'Academic', 'Research'];
const LEVELS = ['All', 'College', 'State', 'National', 'International'];

const stats = [
  { label: 'Total Achievements', value: '128+', icon: Trophy },
  { label: 'Students Recognized', value: '94', icon: GraduationCap },
  { label: 'International Awards', value: '17', icon: Globe },
  { label: 'Departments', value: '8', icon: Building2 },
];

const StudentAchievementsPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeLevel, setActiveLevel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categoryCount = useMemo(() => {
    const derived = new Set(
      achievements
        .map((item) => item.category_name?.toLowerCase())
        .filter(Boolean)
    ).size;
    return derived || CATEGORIES.length - 1;
  }, [achievements]);

  const levelCount = useMemo(() => {
    const derived = new Set(
      achievements
        .map((item) => item.level?.toLowerCase())
        .filter(Boolean)
    ).size;
    return derived || LEVELS.length - 1;
  }, [achievements]);

  const studentsRecognized = stats.find((item) => item.label === 'Students Recognized')?.value || '0';

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await studentApi.getApproved();
        setAchievements(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Could not load achievements. Make sure the server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  const filtered = achievements.filter(a => {
    const matchSearch = !searchQuery ||
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat =
      activeCategory === 'All' ||
      a.category_name?.toLowerCase() === activeCategory.toLowerCase();

    const matchLvl =
      activeLevel === 'All' ||
      a.level?.toLowerCase() === activeLevel.toLowerCase();
    return matchCat && matchLvl && matchSearch;
  });

  const handleGeneratePDF = () => {
    try {
      const pdf = generateStudentAchievementsPDF(filtered, {
        category: activeCategory,
        level: activeLevel,
        search: searchQuery,
      });

      const fileName = `VJTI_Achievements_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="home">
      {/* Hero */}
      <section className="campus-hero relative overflow-hidden px-4 py-14 md:px-8 md:py-20">
        <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-[#c3475b]/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="campus-kicker">Students</p>
          <h1 className="mt-3 text-4xl font-extrabold text-white md:text-5xl">Student Achievements</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-200 md:text-lg">
            Celebrating the extraordinary accomplishments of VJTI students across academics,
            sports, technology, and culture.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 font-semibold text-white backdrop-blur-sm">
              <Trophy className="h-4 w-4" />
              {loading ? "Loading..." : `${achievements.length} Achievements`}
            </span>
            <span className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 font-semibold text-slate-100 backdrop-blur-sm">
              <GraduationCap className="h-4 w-4" />
              {studentsRecognized} Students Recognized
            </span>
            <span className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 font-semibold text-slate-100 backdrop-blur-sm">
              <Building2 className="h-4 w-4" />
              {categoryCount} Categories
            </span>
            <span className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 font-semibold text-slate-100 backdrop-blur-sm">
              <Globe className="h-4 w-4" />
              {levelCount} Levels
            </span>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <button className="btn btn--primary" onClick={() => navigate('/student-desk')}>
              <Upload size={18} /> Submit Achievement
            </button>
            <button
              className="btn btn--outline"
              onClick={() => document.getElementById('achievements').scrollIntoView({ behavior: 'smooth' })}
            >
              <ArrowDown size={18} /> Browse All
            </button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4 md:px-8 stats__grid">
          {stats.map((s, i) => (
            <div key={i} className="stat-item">
              <div className="stat-item__icon">
                <s.icon size={24} />
              </div>
              <div className="stat-item__value">{s.value}</div>
              <div className="stat-item__label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Achievements Section */}
      <section className="achievements-section" id="achievements">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
          <div className="section-header">
            <div>
              <h2 className="section-title">Hall of Excellence</h2>
              <p className="section-sub">Approved achievements by our distinguished students</p>
            </div>
          </div>

          {/* Filters */}
          <div className="filters">
            <div className="filters__search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name or title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="filters__clear" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="filters__groups">
              <div className="filter-group">
                <span className="filter-label">Category</span>
                <div className="filter-pills">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      className={`filter-pill ${activeCategory === c ? 'filter-pill--active' : ''}`}
                      onClick={() => setActiveCategory(c)}
                    >{c}</button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">Level</span>
                <div className="filter-pills">
                  {LEVELS.map(l => (
                    <button
                      key={l}
                      className={`filter-pill ${activeLevel === l ? 'filter-pill--active' : ''}`}
                      onClick={() => setActiveLevel(l)}
                    >{l}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="filters__actions">
              <button 
                className="btn-export-pdf"
                onClick={handleGeneratePDF}
                title="Export achievements to PDF"
              >
                <FileText size={16} /> Print PDF
              </button>
            </div>
          </div>

          {/* Loading / Error / Empty / Cards */}
          {loading ? (
            <div className="state-box">
              <Loader2 className="animate-spin" size={40} />
              <p>Loading achievements...</p>
            </div>
          ) : error ? (
            <div className="state-box state-box--error">
              <AlertCircle size={40} />
              <p>{error}</p>
              <button className="btn-retry" onClick={() => window.location.reload()}>
                <RefreshCw size={16} /> Retry
              </button>
            </div>
          ) : (
            <>
              <div className="results-count">
                Showing <strong>{filtered.length}</strong> achievement{filtered.length !== 1 ? 's' : ''}
                {activeCategory !== 'All' && ` in ${activeCategory}`}
                {activeLevel !== 'All' && ` at ${activeLevel} level`}
              </div>
              {filtered.length > 0 ? (
                <div className="cards-grid">
                  {filtered.map((a, i) => (
                    <AchievementCard key={a.id || i} achievement={a} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Search size={48} />
                  <h3>No achievements found</h3>
                  <p>Try adjusting your filters or search query</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer removed - using global Footer from AppLayout */}
    </div>
  );
};

export default StudentAchievementsPage;
