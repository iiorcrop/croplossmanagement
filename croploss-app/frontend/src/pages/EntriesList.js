import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { entriesAPI } from '../utils/api';
import { StatusBadge, WiltValue, fmtDate, EmptyState, Spinner } from '../components/common';
import { CROPS, CROP_EMOJI, CROP_LABEL, SEASONS } from '../utils/constants';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_OPTS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'needs_correction', label: 'Needs Correction' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function EntriesList({ mode = 'all' }) {
  // mode: 'mine' | 'review' | 'all'
  const { user, isAdmin, isCropHead, isCenter } = useAuth();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    crop: '', status: mode === 'review' ? 'submitted' : '', season: '', search: '', page: 1,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 25 };
      // For review mode, restrict to pending statuses
      if (mode === 'review' && !filters.status) params.status = '';
      const res = await entriesAPI.list(params);
      setEntries(res.data.data);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [filters, mode]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await entriesAPI.list({ ...filters, limit: 10000 });
      const dataToExport = res.data.data;
      
      const formattedData = dataToExport.map((e, i) => ({
        '#': i + 1,
        'Crop': e.crop ? e.crop.charAt(0).toUpperCase() + e.crop.slice(1) : '',
        'District': e.district || '',
        'Center': e.centerName || '',
        'State': e.centerState || '',
        'Season': e.season || '',
        'Survey Date': e.surveyDate ? new Date(e.surveyDate).toLocaleDateString('en-IN') : '',
        'Locations': e.totalLocations || 0,
        'Avg Wilt %': (e.avgWilt || 0).toFixed(2),
        'Max Wilt %': (e.maxWilt || 0).toFixed(2),
        'Status': e.status || '',
        'Submitted By': e.submittedBy?.name || e.submittedByName || '',
        'Submitted At': e.submittedAt ? new Date(e.submittedAt).toLocaleString('en-IN') : ''
      }));

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Entries");
      
      const fileName = `CropLoss_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Use a more robust download method for broad browser support
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.setAttribute('download', fileName);
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 150);

      toast.success('Excel exported successfully');
    } catch (err) {
      console.error(err);
      toast.error('Excel Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const res = await entriesAPI.list({ ...filters, limit: 10000 });
      const dataToExport = res.data.data;

      const doc = new jsPDF('landscape');
      doc.setFontSize(16);
      doc.text('CropLoss Management Portal - Survey Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 22);

      const tableData = dataToExport.map((e, i) => [
        i + 1,
        e.crop ? e.crop.charAt(0).toUpperCase() + e.crop.slice(1) : '',
        e.district || '-',
        e.centerName || '-',
        e.season || '-',
        e.surveyDate ? new Date(e.surveyDate).toLocaleDateString('en-IN') : '-',
        e.totalLocations || 0,
        (e.avgWilt || 0).toFixed(2) + '%',
        e.status || '-',
        e.submittedByName || '-'
      ]);

      autoTable(doc, {
        startY: 28,
        head: [['#', 'Crop', 'District', 'Center', 'Season', 'Survey Date', 'Locs', 'Avg Wilt', 'Status', 'Submitted By']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [27, 94, 32] },
        styles: { fontSize: 8 }
      });

      const fileName = `CropLoss_Export_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF exported successfully');
    } catch (err) {
      console.error(err);
      toast.error('PDF Export failed');
    } finally {
      setExporting(false);
    }
  };

  const titles = { mine: 'My Submissions', review: 'Review Queue', all: 'All Survey Entries' };
  const showBy = mode !== 'mine';
  const statusOpts = mode === 'review'
    ? [{ value: '', label: 'All Pending' }, { value: 'submitted', label: 'Submitted' }, { value: 'under_review', label: 'Under Review' }]
    : STATUS_OPTS;

  return (
    <div>
      <div className="page-header">
        <h2>{titles[mode]}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {mode !== 'review' && (
            <>
              <button className="btn btn-outline btn-sm" onClick={handleExportExcel} disabled={exporting}>
                {exporting ? 'Exporting…' : '📊 Excel'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleExportPDF} disabled={exporting}>
                {exporting ? 'Exporting…' : '📄 PDF'}
              </button>
            </>
          )}
          {(mode === 'mine' || isAdmin) && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/entry/new')}>＋ New Survey</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select className="filter-control" value={filters.crop} onChange={e => setFilter('crop', e.target.value)}>
          <option value="">All Crops</option>
          {CROPS.map(c => <option key={c} value={c}>{CROP_EMOJI[c]} {CROP_LABEL(c)}</option>)}
        </select>
        <select className="filter-control" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          {statusOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="filter-control" value={filters.season} onChange={e => setFilter('season', e.target.value)}>
          <option value="">All Seasons</option>
          {SEASONS.map(s => <option key={s}>{s}</option>)}
        </select>
        {mode !== 'mine' && (
          <input
            className="filter-control"
            placeholder="Search district / center…"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            style={{ minWidth: 200 }}
          />
        )}
        <span style={{ fontSize: 12, color: 'var(--gray)', alignSelf: 'center' }}>
          {total} result{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <Spinner text="Loading entries…" />
        ) : entries.length === 0 ? (
          <EmptyState emoji="📭" title="No entries found" subtitle="Try changing filters or submit a new survey." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>District</th>
                  <th>Center</th>
                  <th>Season</th>
                  <th>Survey Date</th>
                  <th>Locs</th>
                  <th>Avg Wilt%</th>
                  <th>Max Wilt%</th>
                  <th>Status</th>
                  {showBy && <th>Submitted By</th>}
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e._id} onClick={() => navigate(`/entry/${e._id}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <span style={{ fontSize: 16 }}>{CROP_EMOJI[e.crop]}</span>
                      {' '}<b>{CROP_LABEL(e.crop)}</b>
                    </td>
                    <td>{e.district || '–'}</td>
                    <td style={{ fontSize: 11.5 }}>
                      <div>{e.centerName || '–'}</div>
                      <div style={{ color: 'var(--gray)' }}>{e.centerState || ''}</div>
                    </td>
                    <td>{e.season}</td>
                    <td style={{ fontSize: 11.5 }}>{fmtDate(e.surveyDate)}</td>
                    <td style={{ textAlign: 'center' }}>{e.totalLocations || 0}</td>
                    <td style={{ textAlign: 'center' }}><WiltValue value={e.avgWilt} /></td>
                    <td style={{ textAlign: 'center' }}><WiltValue value={e.maxWilt} /></td>
                    <td><StatusBadge status={e.status} /></td>
                    {showBy && <td style={{ fontSize: 11.5 }}>{e.submittedBy?.name || e.submittedByName || '–'}</td>}
                    <td style={{ fontSize: 11.5 }}>{fmtDate(e.updatedAt)}</td>
                    <td style={{ whiteSpace: 'nowrap' }} onClick={e2 => e2.stopPropagation()}>
                      <button className="btn btn-outline btn-xs" onClick={() => navigate(`/entry/${e._id}`)}>View</button>
                      {['draft','needs_correction'].includes(e.status) && (isAdmin || e.submittedBy?._id === user?._id) && (
                        <button className="btn btn-primary btn-xs" style={{ marginLeft: 4 }} onClick={() => navigate(`/entry/edit/${e._id}`)}>Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`btn btn-sm ${filters.page === p ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilters(f => ({ ...f, page: p }))}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
