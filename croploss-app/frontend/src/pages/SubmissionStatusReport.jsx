import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { Spinner, KpiCard } from '../components/common';
import { CROP_EMOJI, CROP_LABEL } from '../utils/constants';

export default function SubmissionStatusReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');
  const [season, setSeason] = useState('');
  const navigate = useNavigate();

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (year) params.year = year;
      if (season) params.season = season;

      const res = await api.get('/reports/submission-status', { params });
      if (res.data?.success) {
        setData(res.data.data);
        // Only set default selectors if they weren't set already
        if (!year && res.data.data.year) setYear(res.data.data.year);
        if (!season && res.data.data.season) setSeason(res.data.data.season);
      } else {
        toast.error('Failed to load submission report');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching submission report');
    } finally {
      setLoading(false);
    }
  }, [year, season]);

  useEffect(() => {
    loadReport();
  }, [year, season]);

  // Compute KPI Counts
  const getKpis = () => {
    if (!data || !data.matrix) return { expected: 0, submitted: 0, drafts: 0, pending: 0 };
    let expected = 0;
    let submitted = 0;
    let drafts = 0;
    let pending = 0;

    data.matrix.forEach(row => {
      Object.values(row.crops).forEach(c => {
        if (c.status !== 'not_assigned') {
          expected++;
        }
        if (['submitted', 'under_review', 'needs_correction', 'approved', 'rejected'].includes(c.status)) {
          submitted++;
        }
        if (c.status === 'draft') {
          drafts++;
        }
        if (c.status === 'not_submitted') {
          pending++;
        }
      });
    });

    return { expected, submitted, drafts, pending };
  };

  const exportToCSV = () => {
    if (!data || !data.matrix) return;
    try {
      const headers = ['Center Name', ...data.crops.map(c => CROP_LABEL(c))];
      const rows = data.matrix.map(row => {
        return [
          row.centerName,
          ...data.crops.map(crop => {
            const statusInfo = row.crops[crop];
            if (!statusInfo) return 'N/A';
            if (statusInfo.status === 'not_assigned') return 'N/A';
            if (statusInfo.status === 'not_submitted') return 'Not Submitted';
            return statusInfo.status.toUpperCase();
          })
        ];
      });

      const csvContent = [headers, ...rows].map(e => e.map(val => `"${val}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Submission_Status_${data.season}_${data.year}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report exported to CSV successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV');
    }
  };

  if (loading && !data) return <Spinner text="Loading submission tracking report…" />;

  const { expected, submitted, drafts, pending } = getKpis();

  // Status Style Helper
  const getStatusBadge = (cropInfo) => {
    if (!cropInfo) return <span style={{ color: '#9ca3af' }}>-</span>;
    const { status, entryId } = cropInfo;

    const badgeStyles = {
      approved: { bg: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', text: '✅ Approved' },
      submitted: { bg: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe', text: '📩 Submitted' },
      under_review: { bg: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', text: '🔍 Under Review' },
      needs_correction: { bg: '#ffedd5', color: '#9a3412', border: '1px solid #fed7aa', text: '⚠️ Need Action' },
      rejected: { bg: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', text: '❌ Rejected' },
      draft: { bg: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', text: '📝 Draft' },
      not_submitted: { bg: '#fff1f2', color: '#be123c', border: '1px solid #ffe4e6', text: '🚨 Not Submitted', fontWeight: 'bold' },
      not_assigned: { bg: 'transparent', color: '#9ca3af', border: 'none', text: 'N/A' }
    };

    const style = badgeStyles[status] || { bg: '#f3f4f6', color: '#6b7280', text: status };

    if (entryId) {
      return (
        <button
          onClick={() => navigate(`/entry/${entryId}`)}
          style={{
            background: style.bg,
            color: style.color,
            border: style.border,
            padding: '5px 10px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: style.fontWeight || '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'inline-block',
            textAlign: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
          title="Click to view detailed survey details"
          className="hover-scale"
        >
          {style.text}
        </button>
      );
    }

    return (
      <span
        style={{
          background: style.bg,
          color: style.color,
          border: style.border,
          padding: '5px 10px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: style.fontWeight || '500',
          display: 'inline-block',
          textAlign: 'center'
        }}
      >
        {style.text}
      </span>
    );
  };

  return (
    <div style={{ padding: '4px' }}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>🏛️ Center-wise Submission Tracking</h2>
          <p style={{ color: 'var(--gray)', margin: '4px 0 0 0', fontSize: '14px' }}>
            Monitor and track survey submissions year-wise and crop-wise across all active centers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {data?.availableSeasons && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 500 }}>Season:</span>
              <select 
                className="filter-control" 
                value={season} 
                onChange={e => setSeason(e.target.value)}
                style={{ minWidth: 150 }}
              >
                {data.availableSeasons.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {data?.availableYears && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 500 }}>Year:</span>
              <select 
                className="filter-control" 
                value={year} 
                onChange={e => setYear(e.target.value)}
                style={{ minWidth: 100 }}
              >
                {data.availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          <button className="btn btn-outline btn-sm" onClick={exportToCSV} disabled={!data || !data.matrix?.length}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <KpiCard number={expected} label="Total Assigned Crops" icon="📋" color="blue" />
        <KpiCard number={submitted} label="Submitted / Approved" icon="✅" color="green" />
        <KpiCard number={drafts} label="Draft Entries" icon="📝" color="amber" />
        <KpiCard number={pending} label="Pending Submission" icon="🚨" color="red" />
      </div>

      {/* Matrix Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Submission Status Matrix</span>
          <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
            Click on any submitted status badge to inspect the crop loss survey details directly.
          </span>
        </div>

        {loading ? (
          <Spinner text="Updating tracking sheet..." />
        ) : !data || data.matrix.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gray)' }}>
            No active centers or assignments configured for this period.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', minWidth: '180px' }}>Center Name</th>
                  {data.crops.map(crop => (
                    <th key={crop} style={{ textAlign: 'center', minWidth: '120px' }}>
                      <span style={{ fontSize: '15px', marginRight: '4px' }}>{CROP_EMOJI[crop] || '🌱'}</span>
                      {CROP_LABEL(crop)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.matrix.map(row => (
                  <tr key={row.centerName}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--dark)' }}>{row.centerName}</div>
                    </td>
                    {data.crops.map(crop => (
                      <td key={crop} style={{ textAlign: 'center', padding: '12px 8px' }}>
                        {getStatusBadge(row.crops[crop])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Helper Legend */}
      <div className="card" style={{ marginTop: '16px', padding: '16px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Legend Guide:</h4>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '4px', background: '#dcfce7', border: '1px solid #bbf7d0' }} />
            Approved: Report accepted and verified.
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '4px', background: '#dbeafe', border: '1px solid #bfdbfe' }} />
            Submitted/Review: Pending review by crop head.
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '4px', background: '#ffedd5', border: '1px solid #fed7aa' }} />
            Need Action: Rejected / Returned for corrections.
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '4px', background: '#f3f4f6', border: '1px solid #e5e7eb' }} />
            Draft: Center user has started entry but not yet submitted.
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '4px', background: '#fff1f2', border: '1px solid #ffe4e6' }} />
            Not Submitted: Center is assigned to this crop but has not submitted/saved anything yet.
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#9ca3af' }}>N/A</span>
            Not Assigned: Center is not configured to report on this crop.
          </span>
        </div>
      </div>
    </div>
  );
}
