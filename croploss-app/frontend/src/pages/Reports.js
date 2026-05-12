import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { entriesAPI } from '../utils/api';
import { KpiCard, BarChart, StatusBadge, WiltValue, EmptyState, Spinner } from '../components/common';
import { CROPS, CROP_EMOJI, CROP_LABEL, SEASONS, wiltColor } from '../utils/constants';

const STATUS_COLORS = {
  draft:'#9ca3af', submitted:'#1d4ed8', under_review:'#d97706',
  needs_correction:'#ea580c', approved:'#1b5e20', rejected:'#dc2626',
};

import { generatePDFReport, generateDetailedMasterPDF, generateCustomPDF } from '../utils/pdfExport';

export default function Reports() {
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExport]  = useState(false);
  const [exportingPDF, setExportPDF] = useState(false);
  const [season, setSeason]     = useState('');
  const [status, setStatus]     = useState('approved'); // Default to approved
  const [showCustom, setShowCustom] = useState(false);
  const [selectedFields, setSelectedFields] = useState(['location', 'variety', 'wilt']);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (season) params.season = season;
      // Summary API shows aggregate data; status filter applied at export time
      const res = await entriesAPI.summary(params);
      setSummary(res.data.data);
    } catch { toast.error('Failed to load report data'); }
    finally { setLoading(false); }
  }, [season]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async (onlyApproved = false) => {
    setExport(true);
    try {
      const params = season ? { season } : {};
      params.status = onlyApproved ? 'approved' : (status === 'all' ? '' : status);
      
      const res = await entriesAPI.exportExcel(params);
      const blob = res.data;
      
      const suffix = params.status || 'All';
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `CropLoss_Excel_${suffix}_${dateStr}.xlsx`;

      // Convert Blob to Data URL (Base64) - often more reliable for 'download' attribute in Chrome
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target.result;
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
        }, 1000);
      };
      reader.readAsDataURL(blob);
      
      toast.success('Excel report exported');
    } catch (error) {
      console.error('Export Error:', error);
      toast.error('Export failed');
    }
    finally { setExport(false); }
  };

  // Summary PDF — fetches filtered data so it matches season+status selection
  const handleExportPDF = async (onlyApproved = false) => {
    setExportPDF(true);
    const toastId = toast.loading('Generating Summary PDF...');
    try {
      // Fetch entries matching the current season+status selection
      const params = { limit: 2000 };
      if (season) params.season = season;
      
      const effectiveStatus = onlyApproved ? 'approved' : status;
      if (effectiveStatus !== 'all') params.status = effectiveStatus;

      const res = await entriesAPI.list(params);
      const entries = (res.data.data || []).filter(e => e.status !== 'draft');

      if (!entries.length) {
        toast.error('No data found for this selection', { id: toastId });
        return;
      }

      // Build crop stats from fetched entries (respects status filter)
      const cropMap = {};
      entries.forEach(e => {
        if (!cropMap[e.crop]) cropMap[e.crop] = { totalEntries:0, appEntries:0, pendingEntries:0, corrEntries:0, rejEntries:0, wiltSum:0, maxWilt:0, locs:0, centers:new Set() };
        const m = cropMap[e.crop];
        m.totalEntries++;
        if (e.status === 'approved') m.appEntries++;
        if (['submitted','under_review'].includes(e.status)) m.pendingEntries++;
        if (e.status === 'needs_correction') m.corrEntries++;
        if (e.status === 'rejected') m.rejEntries++;
        m.wiltSum += (e.avgWilt || 0);
        m.maxWilt = Math.max(m.maxWilt, e.maxWilt || 0);
        m.locs += (e.totalLocations || 0);
        if (e.centerName) m.centers.add(e.centerName);
      });

      const stats = Object.entries(cropMap).map(([crop, m]) => ({
        crop,
        totalEntries: m.totalEntries,
        appEntries:   m.appEntries,
        pendingEntries: m.pendingEntries,
        corrEntries:  m.corrEntries,
        rejEntries:   m.rejEntries,
        avgWilt:      m.totalEntries ? m.wiltSum / m.totalEntries : 0,
        maxWilt:      m.maxWilt,
        locs:         m.locs,
        centers:      m.centers.size,
      }));

      const label = `${season || 'All Seasons'} – ${status === 'all' ? 'All Status' : status.replace('_', ' ').toUpperCase()}`;
      generatePDFReport({ cropStats: stats }, label);
      toast.success('Summary PDF generated', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('PDF export failed', { id: toastId });
    } finally {
      setExportPDF(false);
    }
  };

  const handleExportDetailedPDF = async () => {
    setExportPDF(true);
    const toastId = toast.loading('Generating Detailed Report...');
    try {
      const params = { limit: 1000, includeObs: 'true' };
      if (season) params.season = season;
      if (status && status !== 'all') params.status = status;

      const res = await entriesAPI.list(params);
      const allEntries = (res.data.data || []).filter(e => e.status !== 'draft');

      if (!allEntries.length) {
        toast.error('No data found for the selected Season & Status', { id: toastId });
        return;
      }

      const label = `${season || 'All Seasons'} – ${status === 'all' ? 'All Status' : status.replace('_', ' ').toUpperCase()}`;
      generateDetailedMasterPDF(allEntries, label);
      toast.success(`Detailed Report generated — ${allEntries.length} entr${allEntries.length === 1 ? 'y' : 'ies'}`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Export failed', { id: toastId });
    } finally {
      setExportPDF(false);
    }
  };

  const handleExportCustomPDF = async () => {
    setShowCustom(false);
    setExportPDF(true);
    const toastId = toast.loading('Generating Custom Report...');
    try {
      const params = { limit: 1000, includeObs: 'true' };
      if (season) params.season = season;
      if (status && status !== 'all') params.status = status;

      const res = await entriesAPI.list(params);
      const allEntries = (res.data.data || []).filter(e => e.status !== 'draft');

      if (!allEntries.length) {
        toast.error('No data found for the selected Season & Status', { id: toastId });
        return;
      }

      const label = `${season || 'All Seasons'} – Custom Fields`;
      generateCustomPDF(allEntries, selectedFields, label);
      toast.success('Custom Report generated', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Export failed', { id: toastId });
    } finally {
      setExportPDF(false);
    }
  };

  if (loading) return <Spinner text="Loading reports…" />;
  if (!summary) return null;

  const { cropSummary = [], statusBreakdown = [], centerSummary = [] } = summary;

  const count = (s) => statusBreakdown.find(x => x._id === s)?.count || 0;
  const total = statusBreakdown.reduce((a, b) => a + b.count, 0);
  const approved = count('approved');
  const pending = count('submitted') + count('under_review');

  // Aggregate per-crop stats from cropSummary
  const cropStats = CROPS.map(crop => {
    const rows = cropSummary.filter(cs => cs._id.crop === crop);
    const totalEntries = rows.reduce((a, r) => a + r.total, 0);
    const appEntries = rows.reduce((a, r) => a + r.approved, 0);
    const pendingEntries = rows.reduce((a, r) => a + r.pending, 0);
    const corrEntries = rows.reduce((a, r) => a + r.correction, 0);
    const rejEntries = rows.reduce((a, r) => a + r.rejected, 0);
    const draftEntries = rows.reduce((a, r) => a + r.draft, 0);
    const avgWilt = rows.length ? rows.reduce((a, r) => a + (r.avgWilt || 0), 0) / rows.length : 0;
    const maxWilt = rows.reduce((a, r) => Math.max(a, r.maxWilt || 0), 0);
    const locs = rows.reduce((a, r) => a + (r.totalLocations || 0), 0);
    const centers = [...new Set(rows.flatMap(r => r.centers || []))].length;
    return { crop, totalEntries, appEntries, pendingEntries, corrEntries, rejEntries, draftEntries, avgWilt, maxWilt, locs, centers };
  }).filter(x => x.totalEntries > 0);

  // Wilt chart
  const wiltRows = cropStats.map(cs => ({
    label: `${CROP_EMOJI[cs.crop]} ${CROP_LABEL(cs.crop)}`,
    value: parseFloat(cs.avgWilt.toFixed(1)),
    display: `${cs.avgWilt.toFixed(1)}%`,
    color: cs.avgWilt >= 20 ? '#dc2626' : cs.avgWilt >= 10 ? '#d97706' : '#1b5e20',
  }));

  // Status chart
  const statusRows = [
    { label:'Draft',        value: count('draft'),            color: STATUS_COLORS.draft },
    { label:'Submitted',    value: count('submitted'),        color: STATUS_COLORS.submitted },
    { label:'Under Review', value: count('under_review'),     color: STATUS_COLORS.under_review },
    { label:'Correction',   value: count('needs_correction'), color: STATUS_COLORS.needs_correction },
    { label:'Approved',     value: count('approved'),         color: STATUS_COLORS.approved },
    { label:'Rejected',     value: count('rejected'),         color: STATUS_COLORS.rejected },
  ];

  // High loss crops
  const highLoss = cropStats.filter(cs => cs.maxWilt >= 20).sort((a, b) => b.maxWilt - a.maxWilt);

  return (
    <div>
      <div className="page-header">
        <h2>Reports &amp; Analytics</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--gray)' }}>Season:</span>
            <select className="filter-control" value={season} onChange={e => setSeason(e.target.value)}>
              <option value="">All Seasons</option>
              {SEASONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--gray)' }}>Status:</span>
            <select className="filter-control" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="approved">Approved Only</option>
              <option value="submitted">Submitted Only</option>
              <option value="under_review">Under Review</option>
              <option value="needs_correction">Needs Correction</option>
            </select>
          </div>

          <button className="btn btn-outline btn-sm" onClick={() => handleExport(false)} disabled={exporting}>
            {exporting ? 'Exporting…' : '📥 Excel (Fixed)'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => handleExport(true)} disabled={exporting}>
            {exporting ? 'Exporting…' : '✅ Approved Only Excel (Fixed)'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => handleExportPDF(false)} disabled={exportingPDF}>
            {exportingPDF ? 'Exporting…' : '📄 Summary PDF (Fixed)'}
          </button>
          <button className="btn btn-teal btn-sm" onClick={() => handleExportPDF(true)} disabled={exportingPDF}>
            {exportingPDF ? 'Exporting…' : '✅ Approved Only PDF (Fixed)'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleExportDetailedPDF} disabled={exportingPDF}>
            {exportingPDF ? 'Exporting…' : '📕 Detailed Report (PDF) (Fixed)'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowCustom(true)} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            🛠️ Custom Report
          </button>
        </div>
      </div>

      {/* Custom Report Modal */}
      {showCustom && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="modal-title">
              <h3 style={{ margin: 0 }}>🛠️ Custom Report Configuration</h3>
              <button className="modal-close" onClick={() => setShowCustom(false)}>✕</button>
            </div>
            <div style={{ padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0 }}>Select the fields you want to include:</p>
                <button 
                  className="btn btn-xs btn-outline" 
                  onClick={() => {
                    const allIds = [
                      'location', 'latitude', 'longitude', 'soilType', 'previousCrop', 'variety', 
                      'irrigatedRainfed', 'dateOfSowing', 'stageOfCrop', 'wilt', 'rootRot', 'cls', 'als',
                      'rust', 'powderyMildew', 'downyMildew', 'leafCurl', 'stemRot', 'capsuleBorer', 
                      'semiLooper', 'jassids', 'whitefly', 'thrips', 'aphids', 'remarks'
                    ];
                    if (selectedFields.length === allIds.length) setSelectedFields(['location', 'variety', 'wilt']);
                    else setSelectedFields(allIds);
                  }}
                >
                  {selectedFields.length > 10 ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 15px', maxHeigh: '300px', overflowY: 'auto', padding: '5px' }}>
                {[
                  { id: 'location', label: 'Location' },
                  { id: 'latitude', label: 'Latitude' },
                  { id: 'longitude', label: 'Longitude' },
                  { id: 'soilType', label: 'Soil Type' },
                  { id: 'previousCrop', label: 'Prev Crop' },
                  { id: 'variety', label: 'Variety' },
                  { id: 'irrigatedRainfed', label: 'Irrig/Rain' },
                  { id: 'dateOfSowing', label: 'Sowing' },
                  { id: 'stageOfCrop', label: 'Stage' },
                  { id: 'wilt', label: 'Wilt %' },
                  { id: 'rootRot', label: 'Root Rot %' },
                  { id: 'cls', label: 'CLS %' },
                  { id: 'als', label: 'ALS %' },
                  { id: 'rust', label: 'Rust %' },
                  { id: 'powderyMildew', label: 'P. Mildew' },
                  { id: 'downyMildew', label: 'D. Mildew' },
                  { id: 'leafCurl', label: 'Leaf Curl' },
                  { id: 'stemRot', label: 'Stem Rot' },
                  { id: 'capsuleBorer', label: 'Cap Borer' },
                  { id: 'semiLooper', label: 'SemiLooper' },
                  { id: 'jassids', label: 'Jassids' },
                  { id: 'whitefly', label: 'Whitefly' },
                  { id: 'thrips', label: 'Thrips' },
                  { id: 'aphids', label: 'Aphids' },
                  { id: 'remarks', label: 'Remarks' },
                ].map(f => (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedFields.includes(f.id)}
                      onChange={() => {
                        if (selectedFields.includes(f.id)) setSelectedFields(selectedFields.filter(x => x !== f.id));
                        else setSelectedFields([...selectedFields, f.id]);
                      }}
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowCustom(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleExportCustomPDF} disabled={selectedFields.length === 0}>
                🚀 Generate Custom PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        {[
          { number: total,         label: 'Total Entries',    icon: '📋', color: 'green' },
          { number: approved,      label: 'Approved',         icon: '✅', color: 'teal' },
          { number: pending,       label: 'Pending Review',   icon: '🔍', color: 'amber' },
          { number: count('needs_correction'), label: 'Corrections', icon: '🔄', color: 'red' },
          { number: highLoss.length, label: 'High Loss Crops', icon: '🚨', color: 'purple' },
          { number: centerSummary.length, label: 'Centers Active', icon: '🏛️', color: 'blue' },
        ].map((k, i) => <KpiCard key={i} {...k} />)}
      </div>

      {/* Charts */}
      <div className="two-col" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Average Wilt % by Crop (Approved)</span></div>
          {wiltRows.length ? <BarChart rows={wiltRows} /> : <p style={{ color:'var(--gray)',fontSize:13 }}>No approved data.</p>}
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Entries by Status</span></div>
          <BarChart rows={statusRows} />
        </div>
      </div>

      {/* Center Summary (Specific for Crop Head) */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header"><span className="card-title">🏛️ Center-wise Submission Status</span></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Center Name</th>
                <th>Total</th>
                <th>Approved</th>
                <th>Submitted</th>
                <th>Pending</th>
                <th>Correction</th>
                <th>Avg Wilt</th>
              </tr>
            </thead>
            <tbody>
              {centerSummary.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign:'center', color:'var(--gray)' }}>No center data available.</td></tr>
              ) : (
                centerSummary.map(c => (
                  <tr key={c._id}>
                    <td><b>{c._id || 'Unknown Center'}</b></td>
                    <td>{c.total}</td>
                    <td><span className="badge badge-approved">{c.approved || 0}</span></td>
                    <td><span className="badge badge-submitted">{c.submitted || 0}</span></td>
                    <td><span className="badge badge-review">{c.pending || 0}</span></td>
                    <td><span className="badge badge-correction">{c.correction || 0}</span></td>
                    <td><WiltValue value={c.avgWilt} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary table */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header"><span className="card-title">🌾 Crop-wise Summary ({season || 'All Seasons'})</span></div>
        {cropStats.length === 0 ? (
          <EmptyState emoji="📊" title="No data yet" subtitle="Submit and approve surveys to see reports." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Total</th>
                  <th>Approved</th>
                  <th>Pending</th>
                  <th>Correction</th>
                  <th>Rejected</th>
                  <th>Draft</th>
                  <th>Avg Wilt%</th>
                  <th>Max Wilt%</th>
                  <th>Locations</th>
                  <th>Centers</th>
                </tr>
              </thead>
              <tbody>
                {cropStats.map(cs => (
                  <tr key={cs.crop}>
                    <td><span style={{ fontSize: 16 }}>{CROP_EMOJI[cs.crop]}</span> <b>{CROP_LABEL(cs.crop)}</b></td>
                    <td>{cs.totalEntries}</td>
                    <td><span className="badge badge-approved">{cs.appEntries}</span></td>
                    <td><span className="badge badge-submitted">{cs.pendingEntries}</span></td>
                    <td><span className="badge badge-correction">{cs.corrEntries}</span></td>
                    <td><span className="badge badge-rejected">{cs.rejEntries}</span></td>
                    <td><span className="badge badge-draft">{cs.draftEntries}</span></td>
                    <td><WiltValue value={cs.avgWilt} /></td>
                    <td><WiltValue value={cs.maxWilt} /></td>
                    <td>{cs.locs}</td>
                    <td>{cs.centers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* High loss events */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🚨 High Loss Events (Wilt ≥ 20%)</span>
        </div>
        {highLoss.length === 0 ? (
          <p style={{ color: 'var(--gray)', textAlign: 'center', padding: 20, fontSize: 13 }}>
            No high-loss events. All crops below 20% wilt threshold.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Crop</th><th>Max Wilt%</th><th>Avg Wilt%</th><th>Total Entries</th><th>Approved</th><th>Centers</th></tr>
              </thead>
              <tbody>
                {highLoss.map(cs => (
                  <tr key={cs.crop}>
                    <td><span style={{ fontSize: 16 }}>{CROP_EMOJI[cs.crop]}</span> <b>{CROP_LABEL(cs.crop)}</b></td>
                    <td><span style={{ fontWeight: 700, fontSize: 15, color: 'var(--red)' }}>{cs.maxWilt.toFixed(1)}%</span></td>
                    <td><WiltValue value={cs.avgWilt} /></td>
                    <td>{cs.totalEntries}</td>
                    <td><span className="badge badge-approved">{cs.appEntries}</span></td>
                    <td>{cs.centers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
