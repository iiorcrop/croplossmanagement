import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { entriesAPI } from '../../utils/api';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/entry/new': 'New Survey Entry',
  '/my-submissions': 'My Submissions',
  '/review-queue': 'Review Queue',
  '/all-entries': 'All Survey Entries',
  '/users': 'Users & Roles',
  '/reports': 'Reports & Analytics',
  '/profile': 'My Profile',
};

export default function AppLayout({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  const title = Object.entries(PAGE_TITLES).find(([k]) => loc.pathname.startsWith(k))?.[1] || 'CropLoss Portal';

  useEffect(() => {
    if (!user) return;
    // Poll pending count every 60 seconds
    const fetchCount = async () => {
      try {
        const res = await entriesAPI.list({
          status: user.role === 'center_user' ? 'needs_correction' : 'submitted',
          limit: 1,
        });
        setPendingCount(res.data.total || 0);
      } catch { /* ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="layout">
      <Sidebar pendingCount={pendingCount} />
      <div className="main-area">
        {/* Topbar */}
        <div className="topbar">
          <div className="tb-title">{title}</div>
          <div className="tb-right">
            <div className="wa-chip">
              <span className="wa-dot" />
              WhatsApp
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--gray)' }}>{user?.email}</div>
          </div>
        </div>

        {/* Page content */}
        <div className="page-content">
          {children}
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: 13, fontFamily: 'Inter, sans-serif' },
          success: { style: { background: '#1b5e20', color: '#fff' } },
          error: { style: { background: '#dc2626', color: '#fff' } },
        }}
      />
    </div>
  );
}
