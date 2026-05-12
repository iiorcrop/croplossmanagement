import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EntryForm from './pages/EntryForm';
import EntryDetail from './pages/EntryDetail';
import EntriesList from './pages/EntriesList';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import MasterData from './pages/MasterData';
import SystemSettings from './pages/SystemSettings';
import NotFound from './pages/NotFound';
import './index.css';

// ── Protected Route wrapper ────────────────────────────────────────────────
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f3f4f6' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:36,marginBottom:12 }}>🌾</div>
          <div style={{ fontSize:13,color:'#6b7280' }}>Loading CropLoss Portal…</div>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <AppLayout>{children}</AppLayout>;
}

// ── Public route (redirect if logged in) ──────────────────────────────────
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── App Routes ─────────────────────────────────────────────────────────────
function AppRoutes() {
  const location = useLocation();
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Dashboard — all roles */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      {/* Entry Form — center users and admin */}
      <Route path="/entry/new" element={
        <ProtectedRoute roles={['center_user','super_admin']}><EntryForm /></ProtectedRoute>
      } />
      <Route path="/entry/edit/:id" element={
        <ProtectedRoute roles={['center_user','super_admin']}><EntryForm /></ProtectedRoute>
      } />

      {/* Entry Detail — all roles (access controlled inside) */}
      <Route path="/entry/:id" element={
        <ProtectedRoute><EntryDetail /></ProtectedRoute>
      } />

      {/* My Submissions — center user and admin */}
      <Route path="/my-submissions" element={
        <ProtectedRoute roles={['center_user','super_admin']}>
          <EntriesList mode="mine" />
        </ProtectedRoute>
      } />

      {/* Review Queue — crop head and admin */}
      <Route path="/review-queue" element={
        <ProtectedRoute roles={['crop_head','super_admin']}>
          <EntriesList mode="review" />
        </ProtectedRoute>
      } />

      {/* All Entries — crop head and admin */}
      <Route path="/all-entries" element={
        <ProtectedRoute roles={['crop_head','super_admin']}>
          <EntriesList mode="all" />
        </ProtectedRoute>
      } />

      {/* Users — admin only */}
      <Route path="/users" element={
        <ProtectedRoute roles={['super_admin']}><Users /></ProtectedRoute>
      } />

      {/* Master Data — admin only */}
      <Route path="/master/:type" element={
        <ProtectedRoute roles={['super_admin']}>
          <MasterData key={location.pathname} />
        </ProtectedRoute>
      } />

      {/* System Settings — admin only */}
      <Route path="/settings" element={
        <ProtectedRoute roles={['super_admin']}><SystemSettings /></ProtectedRoute>
      } />

      {/* Reports — crop head and admin */}
      <Route path="/reports" element={
        <ProtectedRoute roles={['crop_head','super_admin']}><Reports /></ProtectedRoute>
      } />

      {/* Profile — all roles */}
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
