import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './SunflowerPathologyForm.css';
import api from '../../utils/api';

const DEFAULT_DISEASES = [
  { cropStage: 'Seedling', diseaseObserved: 'Alternaria Leaf Blight' },
  { cropStage: 'Vegetative', diseaseObserved: 'Powdery Mildew' },
  { cropStage: 'Star Bud', diseaseObserved: 'Sunflower Necrosis Disease' },
  { cropStage: 'Flowering', diseaseObserved: 'Leaf Curl Disease' },
  { cropStage: 'Seed Filling', diseaseObserved: 'Downy Mildew' },
  { cropStage: 'Maturity', diseaseObserved: 'Stem and Root Rot' },
  { cropStage: 'Maturity', diseaseObserved: 'Collar Rot' },
  { cropStage: 'Maturity', diseaseObserved: 'Head Rot' },
  { cropStage: 'Any Stage', diseaseObserved: 'Others' },
];

const STAGE_OPTIONS = [
  'Seedling', 'Vegetative', 'Star Bud', 'Flowering', 'Seed Filling', 'Maturity', 'Any Stage'
];

const DISEASE_OPTIONS = [
  'Alternaria Leaf Blight', 'Powdery Mildew', 'Sunflower Necrosis Disease', 'Leaf Curl Disease', 
  'Downy Mildew', 'Stem and Root Rot', 'Collar Rot', 'Head Rot', 'Others'
];

const defaultDiseaseRow = (overrides = {}) => ({
  cropStage: '',
  diseaseObserved: '',
  meanDiseaseIncidence: '',
  diseaseRange: '',
  maxDisScore: '',
  remarks: '',
  ...overrides,
});

const defaultObservation = () => ({
  location: '',
  latitude: '',
  longitude: '',
  sunflowerPathology: {
    village: '',
    farmerName: '',
    surveyDate: new Date().toISOString().split('T')[0],
    previousCrop: '',
    varietyHybrid: '',
    areaHa: '',
    noOfFieldsSurveyed: '',
    diseases: DEFAULT_DISEASES.map(d => defaultDiseaseRow(d)),
  },
  images: [],
});

const SunflowerPathologyForm = ({ rows, onChange, readOnly, state, district, taluka }) => {
  const [observations, setObservations] = useState(rows && rows.length > 0 ? rows : [defaultObservation()]);


  useEffect(() => {
    onChange(observations);
    // eslint-disable-next-line
  }, [observations]);



  const addDisease = (locIdx) => {
    const updated = [...observations];
    if (!updated[locIdx].sunflowerPathology) updated[locIdx].sunflowerPathology = {};
    if (!updated[locIdx].sunflowerPathology.diseases) updated[locIdx].sunflowerPathology.diseases = [];
    updated[locIdx].sunflowerPathology.diseases.push(defaultDiseaseRow());
    setObservations(updated);
  };

  const removeDisease = (locIdx, dIdx) => {
    const updated = [...observations];
    if (updated[locIdx].sunflowerPathology && updated[locIdx].sunflowerPathology.diseases) {
      updated[locIdx].sunflowerPathology.diseases = updated[locIdx].sunflowerPathology.diseases.filter((_, i) => i !== dIdx);
      setObservations(updated);
    }
  };

  const handleDiseaseChange = (locIdx, dIdx, field, value) => {
    const updated = [...observations];
    if (!updated[locIdx].sunflowerPathology || !updated[locIdx].sunflowerPathology.diseases) return;
    const disease = updated[locIdx].sunflowerPathology.diseases[dIdx];
    disease[field] = value;

    setObservations(updated);
  };

  const handleImageUpload = (locIdx, files) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setObservations((prev) => {
          const next = [...prev];
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
    setObservations((prev) => {
      const next = [...prev];
      next[locIdx] = { ...next[locIdx] };
      next[locIdx].images = next[locIdx].images.filter((_, i) => i !== imgIdx);
      return next;
    });
  };

  return (
    <div className="sfp-form-container">
      {observations.map((obs, locIdx) => {
        const pathData = obs.sunflowerPathology || {};
        return (
          <div key={locIdx} className="sfp-card">


            {/* Disease Section */}
            <div className="sfp-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h5 className="sfp-section-title" style={{ margin: 0 }}>🦠 Disease Observations</h5>
                {!readOnly && (
                  <button className="sfp-btn sfp-btn-outline sfp-btn-sm" onClick={() => addDisease(locIdx)}>
                    + Add Disease
                  </button>
                )}
              </div>

              {(pathData.diseases || []).map((disease, dIdx) => (
                <div key={dIdx} className="sfp-disease-subcard">
                  <div className="sfp-disease-header">
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <div className="sfp-field" style={{ minWidth: '150px' }}>
                        <label>Crop Stage</label>
                        <select
                          value={disease.cropStage || ''}
                          onChange={(e) => handleDiseaseChange(locIdx, dIdx, 'cropStage', e.target.value)}
                          disabled={readOnly}
                          className="sfp-input sfp-select-bold"
                        >
                          <option value="">— Stage —</option>
                          {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="sfp-field" style={{ minWidth: '150px' }}>
                        <label>Disease Observed</label>
                        <select
                          value={disease.diseaseObserved || ''}
                          onChange={(e) => handleDiseaseChange(locIdx, dIdx, 'diseaseObserved', e.target.value)}
                          disabled={readOnly}
                          className="sfp-input sfp-select-bold"
                        >
                          <option value="">— Disease —</option>
                          {DISEASE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    {!readOnly && (
                      <button className="sfp-btn sfp-btn-danger sfp-btn-sm" onClick={() => removeDisease(locIdx, dIdx)}>
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="sfp-metrics-grid">
                    <div className="sfp-field">
                      <label>Mean disease incidence (PDI)</label>
                      <input type="number" step="0.01" value={disease.meanDiseaseIncidence || ''} onChange={(e) => handleDiseaseChange(locIdx, dIdx, 'meanDiseaseIncidence', e.target.value)} disabled={readOnly} className="sfp-input" />
                    </div>
                    <div className="sfp-field">
                      <label>Disease range (%)</label>
                      <input type="text" value={disease.diseaseRange || ''} onChange={(e) => handleDiseaseChange(locIdx, dIdx, 'diseaseRange', e.target.value)} disabled={readOnly} className="sfp-input" />
                    </div>
                    <div className="sfp-field">
                      <label>Max Dis Score observed (as per scale)</label>
                      <input type="text" value={disease.maxDisScore || ''} onChange={(e) => handleDiseaseChange(locIdx, dIdx, 'maxDisScore', e.target.value)} disabled={readOnly} className="sfp-input" />
                    </div>
                  </div>
                  
                  <div className="sfp-field" style={{ marginTop: '12px' }}>
                    <label>Remarks</label>
                    <input type="text" value={disease.remarks || ''} onChange={(e) => handleDiseaseChange(locIdx, dIdx, 'remarks', e.target.value)} disabled={readOnly} className="sfp-input" />
                  </div>
                </div>
              ))}
            </div>

            {/* Image Upload */}
            <div className="sfp-section">
              <h5 className="sfp-section-title">🖼 Images (optional)</h5>
              {obs.images && obs.images.length > 0 && (
                <div className="sfp-image-grid">
                  {obs.images.map((img, imgIdx) => (
                    <div key={imgIdx} className="sfp-image-thumb">
                      <img src={img} alt={`Observation ${imgIdx + 1}`} />
                      {!readOnly && (
                        <button className="sfp-img-remove" onClick={() => removeImage(locIdx, imgIdx)}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!readOnly && (
                <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(locIdx, e.target.files)} className="sfp-file-input" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

SunflowerPathologyForm.propTypes = {
  rows: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  state: PropTypes.string,
  district: PropTypes.string,
  taluka: PropTypes.string,
};

export default SunflowerPathologyForm;
