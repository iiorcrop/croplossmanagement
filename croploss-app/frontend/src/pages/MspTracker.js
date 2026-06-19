import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { Spinner } from '../components/common';

const CROPS = ['castor', 'sunflower', 'safflower', 'sesame', 'niger', 'linseed'];

const generateYears = () => {
  const years = [];
  const startYear = 1998;
  const currentYear = new Date().getFullYear();
  
  for (let y = startYear; y <= currentYear; y++) {
    const y2 = (y + 1).toString().slice(2);
    years.push(`${y}-${y2}`);
  }
  return years;
};

export default function MspTracker() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchMspData();
  }, []);

  const fetchMspData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/msp');
      const existingData = res.data.data || [];
      
      const allYears = generateYears();
      const mergedData = allYears.map(year => {
        const existing = existingData.find(r => r.year === year);
        if (existing) return existing;
        return {
          year,
          castor: 0,
          sunflower: 0,
          safflower: 0,
          sesame: 0,
          niger: 0,
          linseed: 0
        };
      });
      
      setRecords(mergedData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load MSP data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (index, crop, value) => {
    const updated = [...records];
    updated[index][crop] = parseFloat(value) || 0;
    setRecords(updated);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      await api.post('/msp/bulk', { records });
      toast.success('MSP records updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save MSP data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner text="Loading MSP Data..." />;

  return (
    <div className="animate-fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', color: 'var(--g9)' }}>Minimum Support Price (MSP) Tracker</h2>
          <p style={{ color: 'var(--gray)', fontSize: '14px', marginTop: '4px' }}>
            Historical MSP records from 1998-99 to present.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className={`btn ${isEditMode ? 'btn-outline' : 'btn-primary'}`}
            onClick={() => setIsEditMode(!isEditMode)}
            style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isEditMode ? '❌ Cancel Edit' : '✏️ Edit Prices'}
          </button>
          
          {isEditMode && (
            <button 
              className="btn btn-primary" 
              onClick={async () => { await saveChanges(); setIsEditMode(false); }} 
              disabled={saving}
              style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '0', borderRadius: '12px', border: '1px solid var(--gray-b)', overflow: 'hidden' }}>
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#f8fafc', color: 'var(--g8)', boxShadow: '0 1px 0 var(--gray-b)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Year</th>
                {CROPS.map(c => (
                  <th key={c} style={{ padding: '16px 20px', fontWeight: '600', textTransform: 'capitalize' }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((row, idx) => (
                <tr 
                  key={row.year} 
                  style={{ 
                    borderBottom: '1px solid #f1f5f9', 
                    background: idx % 2 === 0 ? '#fff' : '#fcfdfc',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fcfdfc'}
                >
                  <td style={{ padding: '16px 20px', fontWeight: '600', color: 'var(--g8)' }}>
                    {row.year}
                  </td>
                  {CROPS.map(c => (
                    <td key={c} style={{ padding: '12px 20px', color: 'var(--g7)' }}>
                      {isEditMode ? (
                        <input
                          type="number"
                          className="form-control"
                          value={row[c] || ''}
                          onChange={e => handleUpdate(idx, c, e.target.value)}
                          style={{ padding: '8px 12px', fontSize: '14px', width: '110px', background: '#fff', border: '1px solid var(--gray-b)' }}
                        />
                      ) : (
                        <div style={{ fontSize: '15px' }}>
                          ₹ {row[c] ? row[c].toLocaleString() : '0'}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
