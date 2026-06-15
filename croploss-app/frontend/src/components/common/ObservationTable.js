import React, { useState } from 'react';
import { IRRIGATION_TYPES, SOWING_DATES, CROP_STAGES, PCT_OPTS, getColsByDiscipline } from '../../utils/constants';
import axios from 'axios';

export function blankRow(crop, discipline = 'Both') {
  const row = {
    location: '', latitude: '', longitude: '',
    soilType: 'Black', previousCrop: 'Castor', variety: '', otherVariety: '',
    irrigatedRainfed: 'Irrigated', dateOfSowing: '1st Wk Aug', stageOfCrop: '',
    cropDamage: '', remarks: '',
  };
  const cols = getColsByDiscipline(crop, discipline);
  [...cols.disease, ...cols.insect].forEach(c => { row[c.key] = '-'; });
  return row;
}

export default function ObservationTable({ crop, discipline = 'Both', rows, onChange, readOnly = false, state, district, taluka }) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [formData, setFormData] = useState({});

  const cols = getColsByDiscipline(crop, discipline);
  const dcols = cols.disease;
  const icols = cols.insect;


  const [availableVillages, setAvailableVillages] = useState([]);
  const [masterData, setMasterData] = useState({ soilTypes: [], previousCrops: [], varieties: {} });

  React.useEffect(() => {
    if (state && district && taluka) {
      axios.get(`http://localhost:5000/api/locations/villages/${encodeURIComponent(state)}/${encodeURIComponent(district)}/${encodeURIComponent(taluka)}`)
        .then(res => setAvailableVillages(res.data.data || []))
        .catch(err => console.error('Failed to fetch villages', err));
    } else {
      setAvailableVillages([]);
    }
  }, [state, district, taluka]);

  // Load master data on mount
  React.useEffect(() => {
    axios.get('/api/masterData')
      .then(res => {
        const data = res.data?.data || {};
        setMasterData({
          soilTypes: data.soilTypes || [],
          previousCrops: data.previousCrops || [],
          varieties: data.varieties || {},
        });
      })
      .catch(err => console.error('Failed to load master data', err));
  }, []);

  const handleOpenAdd = () => {
    setEditingIdx(null);
    setFormData(blankRow(crop, discipline));
    setShowModal(true);
  };

  const handleOpenEdit = (idx) => {
    setEditingIdx(idx);
    setFormData({ ...rows[idx] });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.location) {
      alert('Village/Location name is required');
      return;
    }
    if (editingIdx !== null) {
      const updated = rows.map((r, i) => i === editingIdx ? formData : r);
      onChange(updated);
    } else {
      onChange([...rows, formData]);
    }
    // Persist custom entries to master data
    if (formData.customSoil && !masterData.soilTypes.includes(formData.customSoil)) {
      axios.put('/api/masterData/soilTypes', { value: [...masterData.soilTypes, formData.customSoil] })
        .catch(err => console.error('Failed to persist custom soil type', err));
    }
    if (formData.customPrevCrop && !masterData.previousCrops.includes(formData.customPrevCrop)) {
      axios.put('/api/masterData/previousCrops', { value: [...masterData.previousCrops, formData.customPrevCrop] })
        .catch(err => console.error('Failed to persist custom previous crop', err));
    }
    setShowModal(false);
  };

  const delRow = (i) => {
    if (window.confirm('Delete this record?')) {
      onChange(rows.filter((_, idx) => idx !== i));
    }
  };

  if (!crop) return (
    <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🚜</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>Select a crop to begin field observations</div>
    </div>
  );

  return (
    <div className="observation-premium-container">
      {/* Header & Stats Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, background: '#f8fafc', padding: '16px 24px', borderRadius: 16,
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Observations</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>{rows.length} <span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8' }}>Entries</span></div>
          </div>
        </div>
        {!readOnly && (
          <button type="button" className="btn btn-primary" onClick={handleOpenAdd} style={{ height: 44, padding: '0 20px', borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <span style={{ fontSize: 20 }}>+</span> Add New Record
          </button>
        )}
      </div>
      {/* Review & Submit Button */}
      {!readOnly && (
        <button type="button" className="btn btn-primary" onClick={() => setShowReviewModal(true)} style={{ marginTop: 20, height: 44, padding: '0 20px', borderRadius: 12, fontWeight: 700, background: '#2563eb', color: '#fff' }}>Review & Submit All</button>
      )}

      {/* Modern Record List */}
      {rows.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: 24,
          border: '2px dashed #e2e8f0', color: '#94a3b8'
        }}>
          <div style={{ fontSize: 50, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontSize: 18, color: '#475569', fontWeight: 700 }}>No Data Recorded</h3>
          <p style={{ fontSize: 14, marginTop: 4 }}>Click the button above to start logging field observations for this crop.</p>
        </div>
      ) : (
        <div className="premium-table-card" style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <table className="table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px 24px', width: 60, color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>#</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Location & Environment</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Cultivation</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>Observations</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="hover-row-premium" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px 24px', color: '#94a3b8', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{r.location}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', gap: 12 }}>
                      <span>📍 {r.latitude}, {r.longitude}</span>
                      <span>🟤 {r.soilType}</span>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ padding: '4px 8px', background: '#f1f5f9', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#475569' }}>
                        {r.variety === 'Others' ? r.otherVariety || 'Unknown Variety' : r.variety}
                      </span>
                      <span style={{ padding: '4px 8px', background: '#ecfdf5', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#065f46' }}>{r.stageOfCrop}</span>
                      <span style={{ padding: '4px 8px', background: '#eff6ff', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#1e40af' }}>{r.irrigatedRainfed}</span>
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      {dcols.slice(0, 3).map(c => (
                        <div key={c.key}>
                          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>{c.label}</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: r[c.key] === '>50% (Specify)' ? '#ef4444' : '#1e293b' }}>
                            {r[c.key] === '>50% (Specify)' ? r[`${c.key}_specify`] + '%' : r[c.key]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button type="button" className="p-action-btn" onClick={() => handleOpenEdit(i)} style={{ background: '#f1f5f9', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer' }}>✏️</button>
                      {!readOnly && <button type="button" className="p-action-btn delete" onClick={() => delRow(i)} style={{ background: '#fee2e2', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer' }}>🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORM */}
      {showReviewModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: 32, width: '90%', maxWidth: 1000, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '24px 32px', background: '#065f46', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Review All Observations</h2>
              <button type="button" onClick={() => setShowReviewModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>✖</button>
            </div>
            <div style={{ padding: 32, maxHeight: '70vh', overflowY: 'auto' }}>
              {rows.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b' }}>No observations to review.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>#</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Location</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Soil Type</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Prev Crop</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Variety</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Irrigation</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Sowing</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px' }}>{i + 1}</td>
                        <td style={{ padding: '8px' }}>{r.location}</td>
                        <td style={{ padding: '8px' }}>{r.soilType}</td>
                        <td style={{ padding: '8px' }}>{r.previousCrop}</td>
                        <td style={{ padding: '8px' }}>{r.variety === 'Others' ? r.otherVariety || 'Unknown' : r.variety}</td>
                        <td style={{ padding: '8px' }}>{r.irrigatedRainfed}</td>
                        <td style={{ padding: '8px' }}>{r.dateOfSowing}</td>
                        <td style={{ padding: '8px' }}>{r.stageOfCrop}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ padding: '0 32px 32px', textAlign: 'right' }}>
              <button type="button" className="btn btn-primary" onClick={() => {
                // Placeholder for final submit logic
                alert('Submit all observations logic goes here.');
                setShowReviewModal(false);
              }} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Submit All</button>
            </div>
          </div>
          </div>
      )}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: 32, width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>

            {/* Modal Header */}
            <div style={{ padding: '32px 40px', background: '#065f46', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.1)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                  📝
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{editingIdx !== null ? 'Edit Observation' : 'New Observation'}</h2>
                  <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: 15 }}>Scientific field recording for <strong style={{ color: '#fff' }}>{crop}</strong></p>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>✖</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 40 }}>

              {/* Section 1: Location */}
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 24 }}>
                  <div className="form-group">
                    <label className="p-label" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#64748b' }}>Village / Cluster Name</label>
                    <select className="p-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }} value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} disabled={!taluka}>
                      <option value="">{taluka ? "— Select Village —" : "Select Taluka first"}</option>
                      {availableVillages.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="p-label" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#64748b' }}>Latitude</label>
                    <input className="p-input" type="number" step="0.0001" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }} value={formData.latitude || ''} onChange={e => setFormData({ ...formData, latitude: e.target.value })} placeholder="22.49" />
                  </div>
                  <div className="form-group">
                    <label className="p-label" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#64748b' }}>Longitude</label>
                    <input className="p-input" type="number" step="0.0001" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }} value={formData.longitude || ''} onChange={e => setFormData({ ...formData, longitude: e.target.value })} placeholder="71.31" />
                  </div>
                </div>
              </div>

              {/* Section 2: Cultivation */}
              <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#065f46' }} /> Cultivation Context
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                  <div className="form-group">
                    {/* Soil Type field with Others option */}
                    <label className="p-label" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#64748b' }}>Soil Type</label>
                    {formData.soilType !== 'Others' ? (
                      <select className="p-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }}
                        value={formData.soilType || ''}
                        onChange={e => setFormData({ ...formData, soilType: e.target.value })}>
                        <option value="">— Select —</option>
                        {masterData.soilTypes.map(o => <option key={o} value={o}>{o}</option>)}
                        <option value="Others">Others</option>
                      </select>
                    ) : (
                      <input className="p-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }}
                        placeholder="Enter custom soil type"
                        value={formData.customSoil || ''}
                        onChange={e => setFormData({ ...formData, customSoil: e.target.value })} />
                    )}
                  </div>
                  <div className="form-group">
                    {/* Previous Crop field with Others option */}
                    <label className="p-label" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#64748b' }}>Previous Crop</label>
                    {formData.previousCrop !== 'Others' ? (
                      <select className="p-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }}
                        value={formData.previousCrop || ''}
                        onChange={e => setFormData({ ...formData, previousCrop: e.target.value })}>
                        <option value="">— Select —</option>
                        {masterData.previousCrops.map(o => <option key={o} value={o}>{o}</option>)}
                        <option value="Others">Others</option>
                      </select>
                    ) : (
                      <input className="p-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }}
                        placeholder="Enter custom previous crop"
                        value={formData.customPrevCrop || ''}
                        onChange={e => setFormData({ ...formData, customPrevCrop: e.target.value })} />
                    )}
                  </div>
                  <div className="form-group">
                    {/* Variety field – include custom previous crop if not present */}
                    <label className="p-label" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#64748b' }}>Variety</label>
                    {
                      (() => {
                        let dynamicVars = [...(masterData.varieties[crop] || [])];
                        const finalPrev = formData.previousCrop === 'Others' ? (formData.customPrevCrop || '') : formData.previousCrop;
                        if (finalPrev && !dynamicVars.includes(finalPrev)) {
                          dynamicVars.push(finalPrev);
                        }
                        return (
                          <select className="p-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }}
                            value={formData.variety || ''}
                            onChange={e => setFormData({ ...formData, variety: e.target.value })}>
                            <option value="">— Select —</option>
                            {dynamicVars.map(v => <option key={v} value={v}>{v}</option>)}
                            <option value="Others">Others</option>
                          </select>
                        );
                      })()
                    }
                    {formData.variety === 'Others' && (
                      <input
                        type="text"
                        style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8, marginTop: 10 }}
                        placeholder="Specify custom variety"
                        value={formData.otherVariety || ''}
                        onChange={e => setFormData({ ...formData, otherVariety: e.target.value })}
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="p-label" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#64748b' }}>Irrigation Type</label>
                    <select className="p-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }} value={formData.irrigatedRainfed || ''} onChange={e => setFormData({ ...formData, irrigatedRainfed: e.target.value })}>
                      {IRRIGATION_TYPES.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="p-label" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#64748b' }}>Sowing Period</label>
                    <select className="p-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }} value={formData.dateOfSowing || ''} onChange={e => setFormData({ ...formData, dateOfSowing: e.target.value })}>
                      {SOWING_DATES.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="p-label" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#64748b' }}>Crop Stage</label>
                    <select className="p-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }} value={formData.stageOfCrop || ''} onChange={e => setFormData({ ...formData, stageOfCrop: e.target.value })}>
                      <option value="">— Select —</option>
                      {CROP_STAGES.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Incidence & Severity */}
              <div style={{ background: '#f8fafc', padding: 32, borderRadius: 24, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#065f46' }} /> Incidence & Severity
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                  {[...dcols, ...icols].map(c => (
                    <div key={c.key} className="form-group">
                      <label className="p-label" style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#64748b' }}>{c.label}</label>
                      {c.type === 'percent' ? (
                        <>
                          <select className="p-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }} value={formData[c.key] || ''} onChange={e => setFormData({ ...formData, [c.key]: e.target.value })}>
                            {PCT_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                          {formData[c.key] === '>50% (Specify)' && (
                            <input
                              type="text"
                              style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8, marginTop: 10 }}
                              placeholder="Specify %"
                              value={formData[`${c.key}_specify`] || ''}
                              onChange={e => setFormData({ ...formData, [`${c.key}_specify`]: e.target.value })}
                            />
                          )}
                        </>
                      ) : (
                        <select className="p-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }} value={formData[c.key] || ''} onChange={e => setFormData({ ...formData, [c.key]: e.target.value })}>
                          <option value="-">— Select —</option>
                          <option value="Low">Low</option>
                          <option value="Moderate">Moderate</option>
                          <option value="High">High</option>
                          <option value="Severe">Severe</option>
                        </select>
                      )}
                    </div>
                  ))}

                  <div className="form-group">
                    <label className="p-label" style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#64748b' }}>% Crop Damage</label>
                    <select className="p-input" style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }} value={formData.cropDamage || ''} onChange={e => setFormData({ ...formData, cropDamage: e.target.value })}>
                      {PCT_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {formData.cropDamage === '>50% (Specify)' && (
                      <input
                        type="text"
                        style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8, marginTop: 10 }}
                        placeholder="Specify %"
                        value={formData.cropDamage_specify || ''}
                        onChange={e => setFormData({ ...formData, cropDamage_specify: e.target.value })}
                      />
                    )}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 32 }}>
                  <label className="p-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                    <span>Supporting Images (Optional)</span>
                    <span style={{ fontWeight: 400, color: '#94a3b8' }}>Upload up to 5 photos</span>
                  </label>

                  <div style={{ padding: '16px', border: '2px dashed #cbd5e1', borderRadius: 12, background: '#f8fafc', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {(formData.images || []).map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <img src={img} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => {
                          const newImgs = [...formData.images];
                          newImgs.splice(idx, 1);
                          setFormData({ ...formData, images: newImgs });
                        }} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    ))}

                    {(!formData.images || formData.images.length < 5) && (
                      <label style={{ width: 80, height: 80, border: '1px dashed #94a3b8', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', background: '#fff' }}>
                        <span style={{ fontSize: 24 }}>+</span>
                        <span style={{ fontSize: 10, fontWeight: 600 }}>Add Photo</span>
                        <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => {
                          if (e.target.files) {
                            const newFiles = Array.from(e.target.files).slice(0, 5 - (formData.images?.length || 0));
                            const promises = newFiles.map(file => {
                              return new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onload = (ev) => resolve(ev.target.result);
                                reader.readAsDataURL(file);
                              });
                            });
                            Promise.all(promises).then(base64s => {
                              setFormData({ ...formData, images: [...(formData.images || []), ...base64s] });
                            });
                          }
                        }} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 24 }}>
                  <label className="p-label" style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#64748b' }}>Field Remarks</label>
                  <textarea className="p-input" rows={3} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8 }} placeholder="Add any observational remarks..." value={formData.remarks || ''} onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, height: 50, borderRadius: 12, fontSize: 16, fontWeight: 700, background: '#f1f5f9', border: 'none', color: '#475569', cursor: 'pointer' }}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSave} style={{ flex: 2, height: 50, borderRadius: 12, fontSize: 16, fontWeight: 700, background: '#16a34a', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  {editingIdx !== null ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
