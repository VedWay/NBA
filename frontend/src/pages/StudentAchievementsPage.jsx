import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AchievementCard from '../components/AchievementCard';
import { studentApi } from '../api/studentApi';
import { Trophy, Medal, Award, Building2, Globe, Search, X, Upload, ArrowDown, GraduationCap, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
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

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero__pattern"></div>
        <div className="container hero__inner">
          <div className="hero__badge">
            <Award size={14} className="mr-1" /> Est. 1887
          </div>
          <h1 className="hero__title">
            Student Achievements<br />
            <em>Portal</em>
          </h1>
          <p className="hero__sub">
            Celebrating the extraordinary accomplishments of VJTI students across academics,
            sports, technology, and culture.
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary" onClick={() => navigate('/student-desk')}>
              <Upload size={18} /> Submit Achievement
            </button>
            <button className="btn btn--outline" onClick={() => document.getElementById('achievements').scrollIntoView({ behavior: 'smooth' })}>
              <ArrowDown size={18} /> Browse All
            </button>
          </div>
        </div>
        <div className="hero__wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="var(--off-white)" />
          </svg>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats">
        <div className="container stats__grid">
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
        <div className="container">
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
