import React from 'react';
import { Code, Trophy, Music, BookOpen, FlaskConical, Award, Star, Medal } from 'lucide-react';
import './AchievementCard.css';

const categoryConfig = {
  Hackathon: { bg: '#eef4ff', text: '#1a56db', icon: Code },
  Sports: { bg: '#f0fdf4', text: '#16a34a', icon: Trophy },
  Cultural: { bg: '#fdf4ff', text: '#9333ea', icon: Music },
  Academic: { bg: '#fff7ed', text: '#ea580c', icon: BookOpen },
  Research: { bg: '#f0f9ff', text: '#0284c7', icon: FlaskConical },
};

const levelColors = {
  National: { bg: '#fff7ed', text: '#c2410c' },
  International: { bg: '#fdf0f2', text: '#8B1A2B' },
  State: { bg: '#f0fdf4', text: '#15803d' },
  College: { bg: '#f1f5f9', text: '#475569' },
};

const positionIcons = { '1st': '🥇', '2nd': '🥈', '3rd': '🥉', 'Winner': '🏆' };

const AchievementCard = ({ achievement: a }) => {
  const cat = categoryConfig[a.category_name] || { bg: '#f1f5f9', text: '#475569', icon: Award };
  const lvl = levelColors[a.level] || levelColors.National;
  const posIcon = positionIcons[a.position] || '🏅';
  const Icon = cat.icon;

  return (
    <div className="ach-card">
      <div className="ach-card__header">
        <div className="ach-card__icon-wrap" style={{ background: cat.bg }}>
          <Icon size={20} color={cat.text} />
        </div>
        <div className="ach-card__badges">
          <span className="badge" style={{ background: cat.bg, color: cat.text }}>{a.category_name}</span>
          <span className="badge" style={{ background: lvl.bg, color: lvl.text }}>{a.level}</span>
        </div>
      </div>

      <div className="ach-card__body">
        <div className="ach-card__position">{posIcon} {a.position}</div>
        <h3 className="ach-card__title">{a.title}</h3>
      </div>

      <div className="ach-card__footer">
        <div className="ach-card__student">
          <div className="ach-card__avatar">
            {a.name ? a.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div className="ach-card__student-name">{a.name}</div>
            <div className="ach-card__student-info">Roll No: {a.roll_no}</div>
          </div>
        </div>
        <span className="ach-card__roll">{a.dept_name || a.level}</span>
      </div>
    </div>
  );
};

export default AchievementCard;
