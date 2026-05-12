import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { entriesAPI } from '../utils/api';
import { KpiCard, BarChart, StatusBadge, WiltValue, fmtDate, EmptyState, Spinner } from '../components/common';
import { CROP_EMOJI, CROP_LABEL } from '../utils/constants';

const STATUS_COLORS = {
  draft:'#9ca3af', submitted:'#1d4ed8', under_review:'#d97706',
  needs_correction:'#ea580c', approved:'#1b5e20', rejected:'#dc2626',
};

export default function Dashboard() {
  const { user, isAdmin, isCropHead, isCenter } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await entriesAPI.summary();
      setSummary(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner text="Loading dashboard…" />;
  if (!summary) return <div style={{ color: 'var(--gray)', padding: 40, textAlign: 'center' }}>Could not load dashboard data.</div>;

  const { statusBreakdown = [], cropSummary = [], recentActivity = [] } = summary;

  // Compute counts from statusBreakdown
  const count = (s) => statusBreakdown.find(x => x._id === s)?.count || 0;
  const total = statusBreakdown.reduce((a, b) => a + b.count, 0);
  const approved = count('approved');
  const pending = count('submitted') + count('under_review');
  const correction = count('needs_correction');

  // KPI config by role
  let kpis;
  if (isCenter) {
    kpis = [
      { number: total, label: 'Total Surveys', icon: '📋', color: 'green' },
      { number: approved, label: 'Approved', icon: '✅', color: 'teal' },
      { number: pending, label: 'Under Review', icon: '🔍', color: 'amber' },
      { number: correction, label: 'Need Correction', icon: '🔄', color: 'red' },
    ];
  } else if (isCropHead) {
    kpis = [
      { number: count('submitted'), label: 'Awaiting Review', icon: '⏳', color: 'red' },
      { number: count('under_review'), label: 'Under Review', icon: '🔍', color: 'amber' },
      { number: approved, label: 'Approved', icon: '✅', color: 'teal' },
      { number: total, label: 'Total in Queue', icon: '📋', color: 'green' },
    ];
  } else {
    // admin
    kpis = [
      { number: total, label: 'Total Entries', icon: '📋', color: 'green' },
      { number: approved, label: 'Approved', icon: '✅', color: 'teal' },
      { number: pending, label: 'Pending Review', icon: '🔍', color: 'amber' },
      { number: correction, label: 'Corrections', icon: '🔄', color: 'red' },
    ];
  }

  // Status chart rows
  const statusRows = [
    { label: 'Draft', value: count('draft'), color: STATUS_COLORS.draft },
    { label: 'Submitted', value: count('submitted'), color: STATUS_COLORS.submitted },
    { label: 'Under Review', value: count('under_review'), color: STATUS_COLORS.under_review },
    { label: 'Correction', value: count('needs_correction'), color: STATUS_COLORS.needs_correction },
    { label: 'Approved', value: count('approved'), color: STATUS_COLORS.approved },
    { label: 'Rejected', value: count('rejected'), color: STATUS_COLORS.rejected },
  ];

  // Crop summary rows (avg wilt)
  const cropRows = cropSummary.map(cs => ({
    label: `${CROP_EMOJI[cs._id.crop] || ''} ${CROP_LABEL(cs._id.crop)}`,
    value: parseFloat((cs.avgWilt || 0).toFixed(1)),
    display: `${parseFloat((cs.avgWilt || 0).toFixed(1))}%`,
    color: (cs.avgWilt || 0) >= 20 ? '#dc2626' : (cs.avgWilt || 0) >= 10 ? '#d97706' : '#1b5e20',
  }));

  // Pending action items
  const actionItems = recentActivity.filter(e =>
    isCenter ? e.status === 'needs_correction' : e.status === 'submitted'
  );

  return (
    <div>
      {/* KPI row */}
      <div className="kpi-grid">
        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* Charts row */}
      <div className="two-col" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Survey Status Overview</span></div>
          <BarChart rows={statusRows} />
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Avg Wilt % by Crop (Approved)</span>
          </div>
          {cropRows.length ? <BarChart rows={cropRows} /> : (
            <p style={{ color: 'var(--gray)', fontSize: 13 }}>No approved entries yet.</p>
          )}
        </div>
      </div>

      {/* Pending actions */}
      {actionItems.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header">
            <span className="card-title">
              {isCenter ? '🔄 Corrections Needed' : '⏳ Awaiting Your Review'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--gray)' }}>({actionItems.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actionItems.slice(0, 5).map(e => (
              <div key={e._id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 8, background: isCenter ? '#fed7aa' : '#fef3c7',
                border: `1px solid ${isCenter ? '#fdba74' : '#fcd34d'}`,
              }}>
                <span style={{ fontSize: 22 }}>{CROP_EMOJI[e.crop]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {e.district} – {CROP_LABEL(e.crop)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray)' }}>
                    {e.centerName} · {e.season} · {e.totalLocations} locations
                  </div>
                </div>
                <WiltValue value={e.avgWilt} />
                <button
                  className={`btn btn-sm ${isCenter ? 'btn-amber' : 'btn-primary'}`}
                  onClick={() => navigate(`/entry/${e._id}`)}
                >
                  {isCenter ? 'Fix & Resubmit' : 'Review Now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Activity</span>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(isCenter ? '/my-submissions' : '/all-entries')}>View All</button>
        </div>
        {recentActivity.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>District</th>
                  <th>Center</th>
                  <th>Season</th>
                  <th>Locs</th>
                  <th>Avg Wilt%</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map(e => (
                  <tr key={e._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/entry/${e._id}`)}>
                    <td><span style={{ fontSize: 16 }}>{CROP_EMOJI[e.crop]}</span> <b>{CROP_LABEL(e.crop)}</b></td>
                    <td>{e.district || '–'}</td>
                    <td style={{ fontSize: 11.5 }}>{e.centerName || '–'}</td>
                    <td>{e.season}</td>
                    <td style={{ textAlign: 'center' }}>{e.totalLocations || 0}</td>
                    <td style={{ textAlign: 'center' }}><WiltValue value={e.avgWilt} /></td>
                    <td><StatusBadge status={e.status} /></td>
                    <td style={{ fontSize: 11.5 }}>{fmtDate(e.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState emoji="📭" title="No recent activity" subtitle="Submit your first survey to get started." />
        )}
      </div>
    </div>
  );
}
