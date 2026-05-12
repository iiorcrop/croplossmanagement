import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CROP_EMOJI, CROP_LABEL } from '../../utils/constants';

export default function Sidebar({ pendingCount = 0 }) {
  const { user, logout, isAdmin, isCropHead, isCenter } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const go = (path) => navigate(path);
  const active = (path) => loc.pathname === path || loc.pathname.startsWith(path + '/');

  const crops = [...new Set([...(user?.assignedCrops || []), ...(user?.reviewCrops || [])])];

  return (
    <nav className="sidebar">
      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-logo-title">🌾 CropLoss</div>
        <div className="sb-logo-sub">ICAR – IIOR Portal</div>
        <div className="sb-crops">
          {crops.map(c => (
            <span key={c} className="sb-crop-chip">{CROP_EMOJI[c]} {CROP_LABEL(c)}</span>
          ))}
        </div>
      </div>

      {/* Center User nav */}
      {(isCenter || isAdmin) && (
        <>
          <div className="sb-section">My Work</div>
          <div className={`nav-item ${active('/dashboard') ? 'active' : ''}`} onClick={() => go('/dashboard')}>
            <span className="nav-icon">📊</span> Dashboard
          </div>
          <div className={`nav-item ${active('/entry/new') || active('/entry/edit') ? 'active' : ''}`} onClick={() => go('/entry/new')}>
            <span className="nav-icon">✏️</span> New Survey
          </div>
          <div className={`nav-item ${active('/my-submissions') ? 'active' : ''}`} onClick={() => go('/my-submissions')}>
            <span className="nav-icon">📂</span> My Submissions
            {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
          </div>
        </>
      )}

      {/* Crop Head nav */}
      {isCropHead && !isAdmin && (
        <>
          <div className="sb-section">Review</div>
          <div className={`nav-item ${active('/dashboard') ? 'active' : ''}`} onClick={() => go('/dashboard')}>
            <span className="nav-icon">📊</span> Dashboard
          </div>
          <div className={`nav-item ${active('/review-queue') ? 'active' : ''}`} onClick={() => go('/review-queue')}>
            <span className="nav-icon">🔍</span> Review Queue
            {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
          </div>
          <div className={`nav-item ${active('/all-entries') ? 'active' : ''}`} onClick={() => go('/all-entries')}>
            <span className="nav-icon">📋</span> All Surveys
          </div>
          <div className={`nav-item ${active('/reports') ? 'active' : ''}`} onClick={() => go('/reports')}>
            <span className="nav-icon">📈</span> Reports
          </div>
        </>
      )}

      {/* Super Admin extra nav */}
      {isAdmin && (
        <>
          <div className="sb-section">Management</div>
          <div className={`nav-item ${active('/review-queue') ? 'active' : ''}`} onClick={() => go('/review-queue')}>
            <span className="nav-icon">🔍</span> Review Queue
            {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
          </div>
          <div className={`nav-item ${active('/all-entries') ? 'active' : ''}`} onClick={() => go('/all-entries')}>
            <span className="nav-icon">📋</span> All Surveys
          </div>
          <div className={`nav-item ${active('/users') ? 'active' : ''}`} onClick={() => go('/users')}>
            <span className="nav-icon">👥</span> Users &amp; Roles
          </div>
          <div className={`nav-item ${active('/reports') ? 'active' : ''}`} onClick={() => go('/reports')}>
            <span className="nav-icon">📈</span> Reports
          </div>
          <div className={`nav-item ${active('/settings') ? 'active' : ''}`} onClick={() => go('/settings')}>
            <span className="nav-icon">⚙️</span> System Settings
          </div>

          <div className="sb-section">Master Data</div>
          <div className={`nav-item ${active('/master/crops') ? 'active' : ''}`} onClick={() => go('/master/crops')}>
            <span className="nav-icon">🌱</span> Crops
          </div>
          <div className={`nav-item ${active('/master/disciplines') ? 'active' : ''}`} onClick={() => go('/master/disciplines')}>
            <span className="nav-icon">🔬</span> Disciplines
          </div>
          <div className={`nav-item ${active('/master/seasons') ? 'active' : ''}`} onClick={() => go('/master/seasons')}>
            <span className="nav-icon">🌦️</span> Seasons
          </div>
          <div className={`nav-item ${active('/master/soil-types') ? 'active' : ''}`} onClick={() => go('/master/soil-types')}>
            <span className="nav-icon">🟤</span> Soil Types
          </div>
          <div className={`nav-item ${active('/master/previous-crops') ? 'active' : ''}`} onClick={() => go('/master/previous-crops')}>
            <span className="nav-icon">🔄</span> Previous Crops
          </div>
          <div className={`nav-item ${active('/master/varieties') ? 'active' : ''}`} onClick={() => go('/master/varieties')}>
            <span className="nav-icon">🏷️</span> Varieties
          </div>
          <div className={`nav-item ${active('/master/irrigation') ? 'active' : ''}`} onClick={() => go('/master/irrigation')}>
            <span className="nav-icon">💧</span> Irrigation
          </div>
          <div className={`nav-item ${active('/master/crop-stages') ? 'active' : ''}`} onClick={() => go('/master/crop-stages')}>
            <span className="nav-icon">📉</span> Crop Stages
          </div>
        </>
      )}

      {/* Footer */}
      <div className="sb-footer">
        <div className="sb-user-name">{user?.name}</div>
        <div className="sb-user-role">{user?.designation || user?.role?.replace('_', ' ')}</div>
        {user?.centerName && <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 1 }}>{user.centerName}</div>}
        <div
          style={{ marginTop: 8, fontSize: 11.5, color: 'rgba(255,255,255,.55)', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => go('/profile')}
        >
          ⚙️ My Profile
        </div>
        <button className="sb-logout" onClick={logout}>Sign Out</button>
      </div>
    </nav>
  );
}
