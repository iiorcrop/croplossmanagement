import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './CastorEntomologyForm.css';
import api from '../../utils/api';

const DEFOLIATORS = [
  'Semilooper', 'Tobacco caterpillar', 'Serpentine leaf miner', 'Red hairy caterpillar',
  'Bihar hairy caterpillar', 'Castor hairy caterpillar', 'Euproctis hairy caterpillar',
  'Spiny caterpillar', 'Slung caterpillar', 'Cutworm'
];

const BORERS = [
  'Shoot and capsule borer', 'American bollworm', 'Castor gall fly'
];

const SUCKING_PESTS = [
  'Leafhopper / Jassid', 'Thrips', 'Castor Whitefly', 'Red spider mite'
];

const ROOT_PESTS = [
  'Termite', 'White grub'
];

const DEFOLIATION_SCALES = [
  { value: '0', label: '0 : No damage' },
  { value: '1', label: '1 : < 25 %' },
  { value: '2', label: '2 : 26 – 50 %' },
  { value: '3', label: '3 : 51 – 75 %' },
  { value: '4', label: '4 : 76 – 100 %' }
];

const HOPPER_BURN_SCALES = [
  { value: '0', label: '0 : No injury' },
  { value: '1', label: '1 : Hopper burn upto 10%' },
  { value: '2', label: '2 : Hopper burn 11 to 25%' },
  { value: '3', label: '3 : Hopper burn 26 to 50%' },
  { value: '4', label: '4 : Hopper burn above 50%' }
];

const WHITEFLY_SCALES = [
  { value: '0', label: '0 : No nymphs & pupae' },
  { value: '1', label: '1 : 1 to 50 nymphs & pupae' },
  { value: '2', label: '2 : 51 to 100 nymphs & pupae' },
  { value: '3', label: '3 : 101 to 200 nymphs & pupae' },
  { value: '4', label: '4 : 201 to 500 nymphs & pupae' },
  { value: '5', label: '5 : >500 nymphs & pupae and honey dew secretion with black sooty mould fungus' }
];

const CastorEntomologyForm = ({ rows, onChange, readOnly, state, district, taluka }) => {
  const [observations, setObservations] = useState(rows || []);
  const [customOpts, setCustomOpts] = useState({
    defoliators: [],
    capsuleSpikeBorers: [],
    suckingPests: [],
    rootPests: []
  });


  useEffect(() => {
    onChange(observations);
    // eslint-disable-next-line
  }, [observations]);

  const addRow = () => {
    setObservations([...observations, { 
      location: '', latitude: '', longitude: '',
      defoliators: [], capsuleSpikeBorers: [], suckingPests: [], rootPests: [], otherPests: [],
      yieldLoss: { method1: '', method2: '', method3: '' },
      images: []
    }]);
  };

  const removeRow = (idx) => {
    const updated = observations.filter((_, i) => i !== idx);
    setObservations(updated);
  };

  const handleLocChange = (idx, field, value) => {
    const updated = [...observations];
    updated[idx] = { ...updated[idx], [field]: value };
    setObservations(updated);
  };

  const handleYieldChange = (locIdx, method, value) => {
    const updated = [...observations];
    if (!updated[locIdx].yieldLoss) updated[locIdx].yieldLoss = {};
    updated[locIdx].yieldLoss[method] = value;
    setObservations(updated);
  }

  // Generic handler for nested pest arrays
  const addPest = (locIdx, category) => {
    const updated = [...observations];
    if (!updated[locIdx][category]) updated[locIdx][category] = [];
    updated[locIdx][category].push({ pestName: '' });
    setObservations(updated);
  };

  const removePest = (locIdx, category, pestIdx) => {
    const updated = [...observations];
    updated[locIdx][category] = updated[locIdx][category].filter((_, i) => i !== pestIdx);
    setObservations(updated);
  };

  const handlePestChange = (locIdx, category, pestIdx, field, value) => {
    if (field === 'pestName' && value === '__ADD_NEW__') {
      const newVal = window.prompt(`Enter new pest name:`);
      if (newVal && newVal.trim()) {
        const properVal = newVal.trim().replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
        setCustomOpts(prev => ({ ...prev, [category]: [...new Set([...(prev[category] || []), properVal])] }));
        const updated = [...observations];
        updated[locIdx][category][pestIdx][field] = properVal;
        setObservations(updated);
      }
    } else {
      const updated = [...observations];
      updated[locIdx][category][pestIdx][field] = value;
      setObservations(updated);
    }
  };

  const handleImageUpload = (locIdx, files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setObservations(prev => {
          const next = [...prev];
          // ensure a deep copy of the images array so we don't mutate state directly
          next[locIdx] = { ...next[locIdx] };
          if (!next[locIdx].images) next[locIdx].images = [];
          next[locIdx].images = [...next[locIdx].images, e.target.result];
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (locIdx, imgIdx) => {
    setObservations(prev => {
      const next = [...prev];
      next[locIdx] = { ...next[locIdx] };
      next[locIdx].images = next[locIdx].images.filter((_, i) => i !== imgIdx);
      return next;
    });
  };

  return (
    <div className="castor-form-container">
      <button className="btn btn-outline" onClick={addRow} disabled={readOnly}>+ Add Location Observation</button>
      
      {observations.map((obs, i) => (
        <div key={i} className="observation-card">
          <div className="card-header">
            <h4>Location #{i + 1}</h4>
            {!readOnly && (
              <button className="btn btn-danger btn-sm" onClick={() => removeRow(i)}>✕ Remove Location</button>
            )}
          </div>
          


          {/* A. Defoliators */}
          <section className="group-section">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h5>A. Defoliators</h5>
              {!readOnly && <button className="btn btn-outline btn-sm" onClick={() => addPest(i, 'defoliators')}>+ Add Pest</button>}
            </div>
            {(obs.defoliators || []).map((pest, pIdx) => (
              <div key={pIdx} className="pest-subcard">
                <div className="pest-header">
                  <select value={pest.pestName || ''} onChange={(e) => handlePestChange(i, 'defoliators', pIdx, 'pestName', e.target.value)} disabled={readOnly} className="form-control pest-select">
                    <option value="">— Select Defoliator —</option>
                    {[...DEFOLIATORS, ...(customOpts.defoliators || [])].map(d => <option key={d} value={d}>{d}</option>)}
                    <option value="__ADD_NEW__" style={{ fontWeight: "bold", color: "var(--g7)" }}>➕ Add New Option...</option>
                  </select>
                  {!readOnly && <button className="btn btn-danger btn-sm" onClick={() => removePest(i, 'defoliators', pIdx)}>✕</button>}
                </div>
                <div className="grid-2">
                  <div className="field-group">
                    <label>Number of larvae per plant</label>
                    <input type="text" value={pest.larvaePerPlant || ''} onChange={(e) => handlePestChange(i, 'defoliators', pIdx, 'larvaePerPlant', e.target.value)} disabled={readOnly} className="form-control" />
                  </div>
                  <div className="field-group">
                    <label>Percent leaf area damaged / plant</label>
                    <select value={pest.leafAreaDamaged || ''} onChange={(e) => handlePestChange(i, 'defoliators', pIdx, 'leafAreaDamaged', e.target.value)} disabled={readOnly} className="form-control">
                      <option value="">— Select Scale —</option>
                      {DEFOLIATION_SCALES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Percent defoliation</label>
                    <input type="text" value={pest.percentDefoliation || ''} onChange={(e) => handlePestChange(i, 'defoliators', pIdx, 'percentDefoliation', e.target.value)} disabled={readOnly} className="form-control" />
                  </div>
                  <div className="field-group">
                    <label>Severity category</label>
                    <input type="text" value={pest.severityCategory || ''} onChange={(e) => handlePestChange(i, 'defoliators', pIdx, 'severityCategory', e.target.value)} disabled={readOnly} className="form-control" />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* B. Capsule / Spike Borers */}
          <section className="group-section">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h5>B. Capsule / Spike Borers</h5>
              {!readOnly && <button className="btn btn-outline btn-sm" onClick={() => addPest(i, 'capsuleSpikeBorers')}>+ Add Pest</button>}
            </div>
            {(obs.capsuleSpikeBorers || []).map((pest, pIdx) => (
              <div key={pIdx} className="pest-subcard">
                <div className="pest-header">
                  <select value={pest.pestName || ''} onChange={(e) => handlePestChange(i, 'capsuleSpikeBorers', pIdx, 'pestName', e.target.value)} disabled={readOnly} className="form-control pest-select">
                    <option value="">— Select Borer —</option>
                    {[...BORERS, ...(customOpts.capsuleSpikeBorers || [])].map(b => <option key={b} value={b}>{b}</option>)}
                    <option value="__ADD_NEW__" style={{ fontWeight: "bold", color: "var(--g7)" }}>➕ Add New Option...</option>
                  </select>
                  {!readOnly && <button className="btn btn-danger btn-sm" onClick={() => removePest(i, 'capsuleSpikeBorers', pIdx)}>✕</button>}
                </div>
                <div className="grid-2">
                  <div className="field-group">
                    <label>Number of spikes examined</label>
                    <input type="number" value={pest.spikesExamined || ''} onChange={(e) => handlePestChange(i, 'capsuleSpikeBorers', pIdx, 'spikesExamined', e.target.value)} disabled={readOnly} className="form-control" />
                  </div>
                  <div className="field-group">
                    <label>Number of spikes damaged</label>
                    <input type="number" value={pest.spikesDamaged || ''} onChange={(e) => handlePestChange(i, 'capsuleSpikeBorers', pIdx, 'spikesDamaged', e.target.value)} disabled={readOnly} className="form-control" />
                  </div>
                  <div className="field-group">
                    <label>Number of capsules damaged</label>
                    <input type="number" value={pest.capsulesDamaged || ''} onChange={(e) => handlePestChange(i, 'capsuleSpikeBorers', pIdx, 'capsulesDamaged', e.target.value)} disabled={readOnly} className="form-control" />
                  </div>
                  <div className="field-group">
                    <label>Percent capsule damage</label>
                    <input type="number" step="0.1" value={pest.percentCapsuleDamage || ''} onChange={(e) => handlePestChange(i, 'capsuleSpikeBorers', pIdx, 'percentCapsuleDamage', e.target.value)} disabled={readOnly} className="form-control" />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* C. Sucking Pests */}
          <section className="group-section">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h5>C. Sucking Pests</h5>
              {!readOnly && <button className="btn btn-outline btn-sm" onClick={() => addPest(i, 'suckingPests')}>+ Add Pest</button>}
            </div>
            {(obs.suckingPests || []).map((pest, pIdx) => (
              <div key={pIdx} className="pest-subcard">
                <div className="pest-header">
                  <select value={pest.pestName || ''} onChange={(e) => handlePestChange(i, 'suckingPests', pIdx, 'pestName', e.target.value)} disabled={readOnly} className="form-control pest-select">
                    <option value="">— Select Sucking Pest —</option>
                    {[...SUCKING_PESTS, ...(customOpts.suckingPests || [])].map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="__ADD_NEW__" style={{ fontWeight: "bold", color: "var(--g7)" }}>➕ Add New Option...</option>
                  </select>
                  {!readOnly && <button className="btn btn-danger btn-sm" onClick={() => removePest(i, 'suckingPests', pIdx)}>✕</button>}
                </div>
                <div className="grid-2">
                  <div className="field-group">
                    <label>Insect count per leaf/plant</label>
                    <input type="text" value={pest.insectCount || ''} onChange={(e) => handlePestChange(i, 'suckingPests', pIdx, 'insectCount', e.target.value)} disabled={readOnly} className="form-control" />
                  </div>
                  <div className="field-group">
                    <label>Hopper burn / Yellowing symptoms</label>
                    <select value={pest.yellowingSymptoms || ''} onChange={(e) => handlePestChange(i, 'suckingPests', pIdx, 'yellowingSymptoms', e.target.value)} disabled={readOnly} className="form-control">
                      <option value="">— Select Scale —</option>
                      {HOPPER_BURN_SCALES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Whitefly pupae scale / Honeydew</label>
                    <select value={pest.honeydewSymptoms || ''} onChange={(e) => handlePestChange(i, 'suckingPests', pIdx, 'honeydewSymptoms', e.target.value)} disabled={readOnly} className="form-control">
                      <option value="">— Select Scale —</option>
                      {WHITEFLY_SCALES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="field-group">
                    <label>Percent affected plants</label>
                    <input type="number" step="0.1" value={pest.percentAffectedPlants || ''} onChange={(e) => handlePestChange(i, 'suckingPests', pIdx, 'percentAffectedPlants', e.target.value)} disabled={readOnly} className="form-control" />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* D. Pests damaging roots */}
          <section className="group-section">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h5>D. Pests damaging roots</h5>
              {!readOnly && <button className="btn btn-outline btn-sm" onClick={() => addPest(i, 'rootPests')}>+ Add Pest</button>}
            </div>
            {(obs.rootPests || []).map((pest, pIdx) => (
              <div key={pIdx} className="pest-subcard">
                <div className="pest-header">
                  <select value={pest.pestName || ''} onChange={(e) => handlePestChange(i, 'rootPests', pIdx, 'pestName', e.target.value)} disabled={readOnly} className="form-control pest-select">
                    <option value="">— Select Root Pest —</option>
                    {[...ROOT_PESTS, ...(customOpts.rootPests || [])].map(r => <option key={r} value={r}>{r}</option>)}
                    <option value="__ADD_NEW__" style={{ fontWeight: "bold", color: "var(--g7)" }}>➕ Add New Option...</option>
                  </select>
                  {!readOnly && <button className="btn btn-danger btn-sm" onClick={() => removePest(i, 'rootPests', pIdx)}>✕</button>}
                </div>
                <div className="grid-2">
                  <div className="field-group">
                    <label>Termite count</label>
                    <input type="text" value={pest.termiteCount || ''} onChange={(e) => handlePestChange(i, 'rootPests', pIdx, 'termiteCount', e.target.value)} disabled={readOnly} className="form-control" />
                  </div>
                  <div className="field-group">
                    <label>White grub count</label>
                    <input type="text" value={pest.whiteGrubCount || ''} onChange={(e) => handlePestChange(i, 'rootPests', pIdx, 'whiteGrubCount', e.target.value)} disabled={readOnly} className="form-control" />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Yield Loss Assessment Methods */}
          <section className="group-section">
            <h5>Yield Loss Assessment Methods (Calculated %)</h5>
            <div className="grid-2">
              <div className="field-group">
                <label>Method 1: Protected vs Unprotected Plot</label>
                <input type="number" step="0.1" placeholder="%" value={obs.yieldLoss?.method1 || ''} onChange={(e) => handleYieldChange(i, 'method1', e.target.value)} disabled={readOnly} className="form-control" />
              </div>
              <div className="field-group">
                <label>Method 2: Healthy vs Damaged Plant</label>
                <input type="number" step="0.1" placeholder="%" value={obs.yieldLoss?.method2 || ''} onChange={(e) => handleYieldChange(i, 'method2', e.target.value)} disabled={readOnly} className="form-control" />
              </div>
              <div className="field-group">
                <label>Method 3: Avoidable Yield Loss</label>
                <input type="number" step="0.1" placeholder="%" value={obs.yieldLoss?.method3 || ''} onChange={(e) => handleYieldChange(i, 'method3', e.target.value)} disabled={readOnly} className="form-control" />
              </div>
            </div>
          </section>

          {/* Image upload */}
          <section className="group-section">
            <h5>Images (optional)</h5>
            {obs.images && obs.images.length > 0 && (
              <div className="image-preview-grid" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px', marginBottom: '12px' }}>
                {obs.images.map((img, imgIdx) => (
                  <div key={imgIdx} className="image-preview" style={{ position: 'relative' }}>
                    <img src={img} alt={`Observation ${imgIdx + 1}`} style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                    {!readOnly && (
                      <button className="btn btn-sm btn-danger" onClick={() => removeImage(i, imgIdx)} style={{ position: 'absolute', top: '-8px', right: '-8px', borderRadius: '50%', padding: '4px 8px' }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!readOnly && (
              <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(i, e.target.files)} className="form-control" />
            )}
          </section>
        </div>
      ))}
    </div>
  );
};

CastorEntomologyForm.propTypes = {
  rows: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
};

export default CastorEntomologyForm;
