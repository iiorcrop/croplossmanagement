import React, { useState } from 'react';
import { reportsAPI } from '../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { Spinner } from '../components/common';

export default function CropLossReport() {
  const [year, setYear] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!year) {
      toast.error('Please enter a fiscal year (e.g., 2021-22)');
      return;
    }
    setLoading(true);
    try {
      const res = await reportsAPI.cropLoss({ year });
      setReport(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!report) return;
    const headers = ['Crop','Discipline','Year','Production (Lakh Tonnes)','MSP (Rs/Tonnes)','Value (Crores)','Insect Min %','Insect Avg %','Insect Mon Min','Insect Mon Avg','Disease Min %','Disease Avg %','Disease Mon Min','Disease Mon Avg','Combined Mon Min','Combined Mon Avg'];
    const rows = report.map(r => [
      r.crop,
      r.discipline,
      r.year,
      r.productionLakhTonnes,
      r.mspRsPerTonnes,
      r.valueCrores,
      r.insect.minPercent,
      r.insect.avgPercent,
      r.insect.monetaryMin,
      r.insect.monetaryAvg,
      r.disease.minPercent,
      r.disease.avgPercent,
      r.disease.monetaryMin,
      r.disease.monetaryAvg,
      r.combined.monetaryMin,
      r.combined.monetaryAvg,
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crop_loss_report_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    doc.text(`Crop Loss Report – ${year}`, 14, 15);
    const columns = [
      'Crop','Discipline','Prod','MSP','Value','Insect Min%','Insect Avg%','Insect $Min','Insect $Avg','Disease Min%','Disease Avg%','Disease $Min','Disease $Avg','Combined $Min','Combined $Avg'
    ];
    const rows = report.map(r => [
      r.crop,
      r.discipline,
      r.productionLakhTonnes,
      r.mspRsPerTonnes,
      r.valueCrores,
      r.insect.minPercent,
      r.insect.avgPercent,
      r.insect.monetaryMin.toFixed(2),
      r.insect.monetaryAvg.toFixed(2),
      r.disease.minPercent,
      r.disease.avgPercent,
      r.disease.monetaryMin.toFixed(2),
      r.disease.monetaryAvg.toFixed(2),
      r.combined.monetaryMin.toFixed(2),
      r.combined.monetaryAvg.toFixed(2),
    ]);
    autoTable(doc, { startY: 25, head: [columns], body: rows, theme: 'grid' });
    doc.save(`crop_loss_report_${year}.pdf`);
  };

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <h2>Super‑Admin Crop‑Loss Report</h2>
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Fiscal year e.g., 2021-22"
          value={year}
          onChange={e => setYear(e.target.value)}
          style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button className="btn btn-primary" onClick={fetchReport} disabled={loading}>
          {loading ? 'Loading…' : 'Generate Report'}
        </button>
        {report && (
          <>
            <button className="btn btn-outline" onClick={exportCSV}>Export CSV</button>
            <button className="btn btn-outline" onClick={exportPDF}>Export PDF</button>
          </>
        )}
      </div>
      {loading && <Spinner text="Fetching report…" />}
      {report && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>Crop</th><th>Discipline</th><th>Year</th><th>Prod (Lakh T)</th><th>MSP (Rs/T)</th><th>Value (Cr)</th><th>Insect Min %</th><th>Insect Avg %</th><th>Insect $ Min</th><th>Insect $ Avg</th><th>Disease Min %</th><th>Disease Avg %</th><th>Disease $ Min</th><th>Disease $ Avg</th><th>Combined $ Min</th><th>Combined $ Avg</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.crop}</td>
                  <td>{r.discipline}</td>
                  <td>{r.year}</td>
                  <td>{r.productionLakhTonnes}</td>
                  <td>{r.mspRsPerTonnes}</td>
                  <td>{r.valueCrores}</td>
                  <td>{r.insect.minPercent}</td>
                  <td>{r.insect.avgPercent}</td>
                  <td>{r.insect.monetaryMin.toFixed(2)}</td>
                  <td>{r.insect.monetaryAvg.toFixed(2)}</td>
                  <td>{r.disease.minPercent}</td>
                  <td>{r.disease.avgPercent}</td>
                  <td>{r.disease.monetaryMin.toFixed(2)}</td>
                  <td>{r.disease.monetaryAvg.toFixed(2)}</td>
                  <td>{r.combined.monetaryMin.toFixed(2)}</td>
                  <td>{r.combined.monetaryAvg.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
