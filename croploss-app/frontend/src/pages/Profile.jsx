import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { CROP_EMOJI, CROP_LABEL, ROLE_LABELS } from '../utils/constants';
import { RoleBadge, CropTag, Alert } from '../components/common';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('info');

  const [info, setInfo] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    designation: user?.designation || '',
    notifyWhatsApp: user?.notifyWhatsApp ?? true,
    notifyEmail: user?.notifyEmail ?? true,
  });
  const [savingInfo, setSavingInfo] = useState(false);

  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  const handleInfoSave = async () => {
    if (!info.name.trim()) { toast.error('Name is required'); return; }
    setSavingInfo(true);
    try {
      await authAPI.updateProfile(info);
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingInfo(false);
    }
  };

  const handlePwdSave = async () => {
    if (!pwd.current) { toast.error('Enter current password'); return; }
    if (pwd.newPwd.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (pwd.newPwd !== pwd.confirm) { toast.error('Passwords do not match'); return; }
    setSavingPwd(true);
    try {
      await authAPI.changePassword({ currentPassword: pwd.current, newPassword: pwd.newPwd });
      toast.success('Password changed successfully');
      setPwd({ current: '', newPwd: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  const crops = [...new Set([...(user?.assignedCrops || []), ...(user?.reviewCrops || [])])];

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h2>My Profile</h2>
      </div>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: 'var(--g7)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, flexShrink: 0,
        }}>
          {user?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{user?.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <RoleBadge role={user?.role} />
            {user?.centerName && <span style={{ fontSize: 12, color: 'var(--gray)' }}>📍 {user.centerName}, {user?.centerState}</span>}
          </div>
          {crops.length > 0 && (
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {crops.map(c => <CropTag key={c} crop={c} />)}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--gray)' }}>
          <div>Last login</div>
          <div style={{ fontWeight: 500 }}>{user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN') : '—'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--gray-b)', marginBottom: 16 }}>
        {[['info', 'My Information'], ['password', 'Change Password'], ['notifications', 'Notifications']].map(([k, l]) => (
          <div
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: tab === k ? 600 : 400,
              color: tab === k ? 'var(--g7)' : 'var(--gray)',
              borderBottom: tab === k ? '2px solid var(--g7)' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {l}
          </div>
        ))}
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Personal Information</span></div>
          <div className="form-grid grid-2">
            <div className="form-group">
              <label className="form-label required">Full Name</label>
              <input className="form-control" value={info.name} onChange={e => setInfo(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" value={user?.email} readOnly />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp Number</label>
              <input className="form-control" value={info.phone} onChange={e => setInfo(f => ({ ...f, phone: e.target.value }))} placeholder="+91-98765-43210" />
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <input className="form-control" value={info.designation} onChange={e => setInfo(f => ({ ...f, designation: e.target.value }))} placeholder="e.g. Senior Scientist" />
            </div>
          </div>

          {user?.role === 'center_user' && (
            <div style={{ marginTop: 16, padding: 14, background: 'var(--g0)', borderRadius: 8, border: '1px solid var(--g1)' }}>
              <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 8 }}>Center Details (managed by Admin)</div>
              <div className="form-grid grid-2">
                <div><span style={{ fontSize: 11, color: 'var(--gray)' }}>Center Name</span><div style={{ fontWeight: 500, marginTop: 2 }}>{user?.centerName || '—'}</div></div>
                <div><span style={{ fontSize: 11, color: 'var(--gray)' }}>State</span><div style={{ fontWeight: 500, marginTop: 2 }}>{user?.centerState || '—'}</div></div>
                <div><span style={{ fontSize: 11, color: 'var(--gray)' }}>District</span><div style={{ fontWeight: 500, marginTop: 2 }}>{user?.centerDistrict || '—'}</div></div>
                <div><span style={{ fontSize: 11, color: 'var(--gray)' }}>Assigned Crops</span><div style={{ marginTop: 4 }}>{(user?.assignedCrops || []).map(c => <CropTag key={c} crop={c} />)}</div></div>
              </div>
            </div>
          )}

          {user?.role === 'crop_head' && (
            <div style={{ marginTop: 16, padding: 14, background: 'var(--g0)', borderRadius: 8, border: '1px solid var(--g1)' }}>
              <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 8 }}>Review Crops (managed by Admin)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(user?.reviewCrops || []).map(c => <CropTag key={c} crop={c} />)}
              </div>
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleInfoSave} disabled={savingInfo}>
              {savingInfo ? 'Saving…' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Password */}
      {tab === 'password' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Change Password</span></div>
          <Alert type="info" icon="🔒">
            Use a strong password with at least 6 characters. You will need to login again after changing.
          </Alert>
          <div className="form-grid" style={{ gap: 14, maxWidth: 400 }}>
            <div className="form-group">
              <label className="form-label required">Current Password</label>
              <input className="form-control" type="password" value={pwd.current} onChange={e => setPwd(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label required">New Password</label>
              <input className="form-control" type="password" value={pwd.newPwd} onChange={e => setPwd(f => ({ ...f, newPwd: e.target.value }))} placeholder="Min 6 characters" />
            </div>
            <div className="form-group">
              <label className="form-label required">Confirm New Password</label>
              <input
                className="form-control"
                type="password"
                value={pwd.confirm}
                onChange={e => setPwd(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Re-enter new password"
                style={{ borderColor: pwd.confirm && pwd.confirm !== pwd.newPwd ? 'var(--red)' : undefined }}
              />
              {pwd.confirm && pwd.confirm !== pwd.newPwd && (
                <span style={{ fontSize: 11, color: 'var(--red)' }}>Passwords do not match</span>
              )}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handlePwdSave} disabled={savingPwd}>
              {savingPwd ? 'Changing…' : '🔐 Change Password'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Notifications */}
      {tab === 'notifications' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Notification Preferences</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              {
                icon: '📱', key: 'notifyWhatsApp', title: 'WhatsApp Alerts',
                desc: `Receive alerts on ${user?.phone || 'your registered number'} for submissions, approvals, corrections, and high-loss events.`,
              },
              {
                icon: '📧', key: 'notifyEmail', title: 'Email Notifications',
                desc: `Receive emails at ${user?.email} for all workflow events.`,
              },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', gap: 14, padding: 14, background: 'var(--gray-l)', borderRadius: 8, border: '1px solid var(--gray-b)' }}>
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{item.desc}</div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={info[item.key]}
                    onChange={e => setInfo(f => ({ ...f, [item.key]: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: 'var(--g7)', cursor: 'pointer' }}
                  />
                </label>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleInfoSave} disabled={savingInfo}>
              {savingInfo ? 'Saving…' : '💾 Save Preferences'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
