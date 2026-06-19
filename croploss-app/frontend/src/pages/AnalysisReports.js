import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const REPORT_TABS = [
  { key: 'pest',     label: '🐛 Pest Analysis Report' },
  { key: 'disease',  label: '🦠 Disease Analysis Report' },
  { key: 'yield',    label: '📊 Consolidated Yield Loss Profile' },
  { key: 'value',    label: '💰 Value of Produce' },
  { key: 'monetary', label: '📉 Monetary Loss Estimation' },
  { key: 'overall',  label: '📋 Overall Report' },
];

const tabStyle = (active) => ({
  padding: '10px 18px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: active ? '600' : '400',
  background: active ? 'var(--g7)' : '#f1f5f9',
  color: active ? '#fff' : 'var(--g8)',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
});

function PestReport() {
  return (
    <div>
      <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #b91c1c' }}>
        <h3 style={{ color: '#b91c1c', marginBottom: '8px' }}>🐛 Pest Analysis Report</h3>
        <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
          Detailed breakdown of yield losses caused by insect pests across all entries.
        </p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table id="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fef2f2', color: '#b91c1c' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Crop</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Pest Name</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Min Loss (%)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Avg Loss (%)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Location</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Year</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #fee2e2' }}>
              <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray)', fontSize: '14px' }}>
                No data available. Please save entries in the Analysis form first.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiseaseReport() {
  return (
    <div>
      <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #7e22ce' }}>
        <h3 style={{ color: '#7e22ce', marginBottom: '8px' }}>🦠 Disease Analysis Report</h3>
        <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
          Detailed breakdown of yield losses caused by diseases across all entries.
        </p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table id="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#faf5ff', color: '#7e22ce' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Crop</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Disease Name</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Min Loss (%)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Avg Loss (%)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Location</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Year</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ede9fe' }}>
              <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray)', fontSize: '14px' }}>
                No data available. Please save entries in the Analysis form first.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function YieldProfile() {
  return (
    <div>
      <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #047857' }}>
        <h3 style={{ color: '#047857', marginBottom: '8px' }}>📊 Consolidated Yield Loss Profile</h3>
        <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
          A summary table showing minimum and average yield loss percentages per crop, aggregated across all years.
        </p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table id="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0fdf4', color: '#047857' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Crop</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Min Insect Loss (%)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Avg Insect Loss (%)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Min Disease Loss (%)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Avg Disease Loss (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray)', fontSize: '14px' }}>
                No data available. Please save entries in the Analysis form first.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ValueOfProduce() {
  return (
    <div>
      <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #b45309' }}>
        <h3 style={{ color: '#b45309', marginBottom: '8px' }}>💰 Value of Produce</h3>
        <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
          Calculated as: <strong>Value of Produce (Crores) = Production (Lakh Tonnes) × MSP (₹/Tonne)</strong>.
          Data sourced from UPAg and CACP.
        </p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table id="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fffbeb', color: '#b45309' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Crop</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Production (Lakh T)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>MSP (₹/Quintal)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Value of Produce (Cr)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray)', fontSize: '14px' }}>
                No data available. Please ensure MSP and production data are entered.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonetaryLoss() {
  return (
    <div>
      <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #0f766e' }}>
        <h3 style={{ color: '#0f766e', marginBottom: '8px' }}>📉 Monetary Loss Estimation</h3>
        <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
          Calculated as: <strong>Monetary Loss = Value of Produce × (Loss% / 100)</strong>.
        </p>
        <div style={{ background: '#f0fdfa', padding: '12px 16px', borderRadius: '8px', marginTop: '12px', fontSize: '13px' }}>
          <div>• Loss due to Insects (Crores) = Value × L_ins / 100</div>
          <div>• Loss due to Diseases (Crores) = Value × L_dis / 100</div>
          <div>• Combined Minimum Loss = Loss_ins<sup>min</sup> + Loss_dis<sup>min</sup></div>
          <div>• Combined Average Loss = Loss_ins<sup>avg</sup> + Loss_dis<sup>avg</sup></div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table id="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0fdfa', color: '#0f766e' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Crop</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Min Insect Loss (Cr)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Avg Insect Loss (Cr)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Min Disease Loss (Cr)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Avg Disease Loss (Cr)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Combined Min (Cr)</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Combined Avg (Cr)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray)', fontSize: '14px' }}>
                No data available. Please ensure yield loss and value of produce data are entered.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OverallReport() {
  const th = { padding: '10px 8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', border: '1px solid #c8d6c8', whiteSpace: 'nowrap' };
  const thSticky = { ...th, position: 'sticky', left: 0, zIndex: 10, background: '#e8f5e9', borderRight: '2px solid #a5d6a7' };
  const td = { padding: '8px 6px', textAlign: 'right', fontSize: '12px', border: '1px solid #e2e8e2', fontFamily: 'monospace' };
  const tdCrop = { ...td, textAlign: 'left', fontWeight: '600', color: 'var(--g8)', fontFamily: 'inherit', position: 'sticky', left: 0, zIndex: 5, borderRight: '2px solid #a5d6a7' };

  const sampleData = [
    { crop: 'Safflower', ipMin: 18.00, ipAvg: null, ipMax: 18.00, dMin: 20.50, dAvg: 25.71, dMax: 22.25, msp: 0.56, yield: 5631.6, value: 315, mlIpMin: 56.77, mlIpAvg: 0, mlIpMax: 56.77, mlDMin: 64.65, mlDAvg: 81.10, mlDMax: 70.17, tMin: 121.42, tAvg: 126.94 },
    { crop: 'Linseed', ipMin: 13.07, ipAvg: 11.78, ipMax: 13.77, dMin: 6.21, dAvg: 7.00, dMax: 6.93, msp: 1.258, yield: 5672, value: 714, mlIpMin: 93.24, mlIpAvg: 84.04, mlIpMax: 98.23, mlDMin: 44.34, mlDAvg: 49.95, mlDMax: 49.44, tMin: 137.58, tAvg: 147.67 },
    { crop: 'Sesame', ipMin: 4.60, ipAvg: 5.32, ipMax: 5.16, dMin: 4.50, dAvg: 38.78, dMax: 17.01, msp: 8.296, yield: 7978.8, value: 6619, mlIpMin: 304.48, mlIpAvg: 352.14, mlIpMax: 341.41, mlDMin: 298.05, mlDAvg: 2566.67, mlDMax: 1126.21, tMin: 602.54, tAvg: 1467.62 },
    { crop: 'Castor', ipMin: 16.88, ipAvg: 7.20, ipMax: 17.07, dMin: 20.06, dAvg: 11.40, dMax: 20.23, msp: 17.982, yield: 5967.33, value: 10730, mlIpMin: 1811.57, mlIpAvg: 772.59, mlIpMax: 1831.37, mlDMin: 2152.50, mlDAvg: 1223.27, mlDMax: 2171.28, tMin: 3964.07, tAvg: 4002.66 },
  ];

  const fmt = (v) => v === null || v === undefined ? '-' : v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid var(--g7)' }}>
        <h3 style={{ color: 'var(--g8)', marginBottom: '8px' }}>📋 Overall Comprehensive Report</h3>
        <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
          Summary of yield loss and monetary loss for Safflower, Linseed, Sesame &amp; Castor.
        </p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'auto', borderRadius: '8px' }}>
        <table id="report-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
          <thead>
            {/* Level 1 */}
            <tr style={{ background: '#e8f5e9', color: 'var(--g9)' }}>
              <th rowSpan={3} style={{ ...thSticky, minWidth: '80px' }}>Crop</th>
              <th colSpan={6} style={th}>Yield Loss (%)</th>
              <th rowSpan={3} style={{ ...th, minWidth: '80px' }}>Average MSP (Rs)</th>
              <th rowSpan={3} style={{ ...th, minWidth: '90px' }}>Average Yield (Lakh Tonnes)</th>
              <th rowSpan={3} style={{ ...th, minWidth: '80px' }}>Value of Produce (Crores)</th>
              <th colSpan={6} style={th}>Monetary Loss (₹ Crores)</th>
              <th colSpan={2} style={th}>Total Monetary Loss (₹ Crores)</th>
            </tr>
            {/* Level 2 */}
            <tr style={{ background: '#f1f8e9', color: 'var(--g8)' }}>
              <th colSpan={3} style={th}>Insect Pests</th>
              <th colSpan={3} style={th}>Diseases</th>
              <th colSpan={3} style={th}>Insect Pests</th>
              <th colSpan={3} style={th}>Diseases</th>
              <th rowSpan={2} style={th}>Min</th>
              <th rowSpan={2} style={th}>Avg</th>
            </tr>
            {/* Level 3 */}
            <tr style={{ background: '#f9fbe7', color: 'var(--g7)' }}>
              <th style={th}>Min</th><th style={th}>Avg</th><th style={th}>Max</th>
              <th style={th}>Min</th><th style={th}>Avg</th><th style={th}>Max</th>
              <th style={th}>Min</th><th style={th}>Avg</th><th style={th}>Max</th>
              <th style={th}>Min</th><th style={th}>Avg</th><th style={th}>Max</th>
            </tr>
          </thead>
          <tbody>
            {sampleData.map((r, idx) => {
              const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafcfa';
              return (
              <tr key={r.crop} style={{ background: rowBg }}>
                <td style={{ ...tdCrop, background: rowBg }}>{r.crop}</td>
                <td style={td}>{fmt(r.ipMin)}</td>
                <td style={td}>{fmt(r.ipAvg)}</td>
                <td style={td}>{fmt(r.ipMax)}</td>
                <td style={td}>{fmt(r.dMin)}</td>
                <td style={td}>{fmt(r.dAvg)}</td>
                <td style={td}>{fmt(r.dMax)}</td>
                <td style={td}>{fmt(r.msp)}</td>
                <td style={td}>{fmt(r.yield)}</td>
                <td style={{ ...td, fontWeight: '600', color: '#1565c0' }}>{fmt(r.value)}</td>
                <td style={td}>{fmt(r.mlIpMin)}</td>
                <td style={td}>{fmt(r.mlIpAvg)}</td>
                <td style={td}>{fmt(r.mlIpMax)}</td>
                <td style={td}>{fmt(r.mlDMin)}</td>
                <td style={td}>{fmt(r.mlDAvg)}</td>
                <td style={td}>{fmt(r.mlDMax)}</td>
                <td style={{ ...td, fontWeight: '700', color: '#b71c1c', background: '#fff3f0' }}>{fmt(r.tMin)}</td>
                <td style={{ ...td, fontWeight: '700', color: '#b71c1c', background: '#fff3f0' }}>{fmt(r.tAvg)}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AnalysisReports() {
  const [activeTab, setActiveTab] = useState('pest');
  const [fromYear, setFromYear] = useState('2021-22');
  const [toYear, setToYear] = useState('2026-27');

  const yearsList = ['1998-99','1999-00','2000-01','2001-02','2002-03','2003-04','2004-05','2005-06','2006-07','2007-08','2008-09','2009-10','2010-11','2011-12','2012-13','2013-14','2014-15','2015-16','2016-17','2017-18','2018-19','2019-20','2020-21','2021-22','2022-23','2023-24','2024-25','2025-26','2026-27'];

  const handleDownloadPDF = () => {
    const doc = new jsPDF('landscape');
    const title = REPORT_TABS.find(t => t.key === activeTab)?.label || 'Report';
    doc.text(`${title} (${fromYear} to ${toYear})`, 14, 15);
    doc.autoTable({ html: '#report-table', startY: 20 });
    doc.save(`croploss_${activeTab}_report.pdf`);
  };

  const handleDownloadExcel = () => {
    const table = document.getElementById('report-table');
    const wb = XLSX.utils.table_to_book(table, { sheet: 'Report' });
    XLSX.writeFile(wb, `croploss_${activeTab}_report.xlsx`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'pest':     return <PestReport />;
      case 'disease':  return <DiseaseReport />;
      case 'yield':    return <YieldProfile />;
      case 'value':    return <ValueOfProduce />;
      case 'monetary': return <MonetaryLoss />;
      case 'overall':  return <OverallReport />;
      default:         return null;
    }
  };

  return (
    <div className="page-content animate-fade-in" style={{ padding: '30px', maxWidth: '1300px', margin: '0 auto' }}>
      {/* Page Header with Actions */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '26px', color: 'var(--g9)', marginBottom: '6px' }}>📈 CropLoss Analysis Reports</h2>
          <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
            View detailed analytics across pests, diseases, yield profiles, and monetary losses.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" style={{ background: '#d32f2f', color: '#fff', padding: '8px 16px', fontSize: '13px' }} onClick={handleDownloadPDF}>
            📄 Download PDF
          </button>
          <button className="btn" style={{ background: '#2e7d32', color: '#fff', padding: '8px 16px', fontSize: '13px' }} onClick={handleDownloadExcel}>
            📊 Download Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '16px 20px', marginBottom: '24px', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--g8)' }}>From Year:</label>
          <select className="form-control" style={{ width: '150px' }} value={fromYear} onChange={e => setFromYear(e.target.value)}>
            {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--g8)' }}>To Year:</label>
          <select className="form-control" style={{ width: '150px' }} value={toYear} onChange={e => setToYear(e.target.value)}>
            {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        background: '#f8fafc',
        padding: '10px',
        borderRadius: '12px',
        marginBottom: '28px',
        border: '1px solid var(--gray-b)'
      }}>
        {REPORT_TABS.map(t => (
          <button
            key={t.key}
            style={tabStyle(activeTab === t.key)}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {renderContent()}
      </div>
    </div>
  );
}
