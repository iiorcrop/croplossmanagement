import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './SunflowerEntomologyForm.css';
import api from '../../utils/api';

/**
 * SunflowerEntomologyForm – dynamic observation form for Crop: Sunflower & Discipline: Entomology.
 * Supports multiple locations and dynamic "Add Pest" entries per location.
 */

const SUNFLOWER_PESTS = [
  'Spodoptera litura',
  'Thysanoplusia',
  'Spilosoma obliqua',
  'Helicoverpa armigera',
  'Thrips',
  'Leafhoppers',
  'Whiteflies',
  'Others (Name1)',
  'Others (Name2)',
  'Natural enemies Name1',
  'Natural enemies Name2',
];

const SunflowerEntomologyForm = ({ rows, onChange, readOnly, state, district, taluka }) => {
  const defaultObservation = {
    location: '',
    latitude: '',
    longitude: '',
    soilType: 'Black',
    previousCrop: 'Castor',
    variety: '',
    otherVariety: '',
    irrigatedRainfed: 'Irrigated',
    dateOfSowing: '1st Wk Aug',
    stageOfCrop: '',
    sunflowerPests: [],
    yieldLoss: { method1: '', method2: '', method3: '' },
    images: [],
  };

  const [observations, setObservations] = useState(rows && rows.length > 0 ? rows : [defaultObservation]);
  const [customOpts, setCustomOpts] = useState({
    sunflowerPests: []
  });


  useEffect(() => {
    // Only notify parent if rows actually changed
    onChange(observations);
    // eslint-disable-next-line
  }, [observations]);

  const handleLocChange = (locIdx, field, value) => {
    const updated = [...observations];
    updated[locIdx] = { ...updated[locIdx], [field]: value };
    setObservations(updated);
  };

  const addPest = (locIdx) => {
    const updated = [...observations];
    if (!updated[locIdx].sunflowerPests) updated[locIdx].sunflowerPests = [];
    updated[locIdx].sunflowerPests.push({
      pestName: '',
      noOfInsects: '',
      sndPercent: '',
      leafCurlPercent: '',
      defoliationPercent: '',
      yellowingDryingPercent: '',
      estimatedYieldLoss: '',
      specificInformation: '',
      customName: '',
    });
    setObservations(updated);
  };

  const removePest = (locIdx, pestIdx) => {
    const updated = [...observations];
    updated[locIdx].sunflowerPests = updated[locIdx].sunflowerPests.filter((_, i) => i !== pestIdx);
    setObservations(updated);
  };

  const handlePestChange = (locIdx, pestIdx, field, value) => {
    if (field === 'pestName' && value === '__ADD_NEW__') {
      const newVal = window.prompt(`Enter new pest name:`);
      if (newVal && newVal.trim()) {
        const properVal = newVal.trim().replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
        setCustomOpts(prev => ({ ...prev, sunflowerPests: [...new Set([...(prev.sunflowerPests || []), properVal])] }));
        const updated = [...observations];
        updated[locIdx].sunflowerPests[pestIdx] = {
          ...updated[locIdx].sunflowerPests[pestIdx],
          [field]: properVal
        };
        setObservations(updated);
      }
    } else {
      const updated = [...observations];
      updated[locIdx].sunflowerPests[pestIdx] = {
        ...updated[locIdx].sunflowerPests[pestIdx],
        [field]: value
      };
      setObservations(updated);
    }
  };

  const handleYieldChange = (locIdx, method, value) => {
    const updated = [...observations];
    if (!updated[locIdx].yieldLoss) updated[locIdx].yieldLoss = {};
    updated[locIdx].yieldLoss = { ...updated[locIdx].yieldLoss, [method]: value };
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
    <div className="sf-form-container">
      {observations.map((obs, locIdx) => (
        <div key={locIdx} className="sf-card">


          {/* Dynamic Pest Section */}
          <div className="sf-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h5 className="sf-section-title" style={{ margin: 0 }}>A. Sunflower Pests</h5>
              {!readOnly && (
                <button className="sf-btn sf-btn-outline sf-btn-sm" onClick={() => addPest(locIdx)}>
                  + Add Pest
                </button>
              )}
            </div>

            {(obs.sunflowerPests || []).map((pest, pIdx) => {
              const isThrips = pest.pestName === 'Thrips';
              const isWhiteflies = pest.pestName === 'Whiteflies';
              const isOthersOrNat = pest.pestName && (pest.pestName.startsWith('Others') || pest.pestName.startsWith('Natural enemies'));

              return (
                <div key={pIdx} className="sf-pest-subcard">
                  <div className="sf-pest-header">
                    <select
                      value={pest.pestName || ''}
                      onChange={(e) => handlePestChange(locIdx, pIdx, 'pestName', e.target.value)}
                      disabled={readOnly}
                      className="sf-input sf-pest-select"
                    >
                      <option value="">— Select Pest —</option>
                      {[...SUNFLOWER_PESTS, ...(customOpts.sunflowerPests || [])].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                      <option value="__ADD_NEW__" style={{ fontWeight: "bold", color: "var(--g7)" }}>➕ Add New Option...</option>
                    </select>
                    {!readOnly && (
                      <button className="sf-btn sf-btn-danger sf-btn-sm" onClick={() => removePest(locIdx, pIdx)}>
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="sf-yield-grid">
                    {isOthersOrNat && (
                      <div className="sf-field">
                        <label>Specific Name</label>
                        <input
                          type="text"
                          value={pest.customName || ''}
                          onChange={(e) => handlePestChange(locIdx, pIdx, 'customName', e.target.value)}
                          disabled={readOnly}
                          className="sf-input"
                          placeholder="Enter specific name"
                        />
                      </div>
                    )}
                    <div className="sf-field">
                      <label>No. of insects / plant</label>
                      <input
                        type="text"
                        value={pest.noOfInsects || ''}
                        onChange={(e) => handlePestChange(locIdx, pIdx, 'noOfInsects', e.target.value)}
                        disabled={readOnly}
                        className="sf-input"
                      />
                    </div>
                    {isThrips && (
                      <div className="sf-field">
                        <label>SND%</label>
                        <input
                          type="text"
                          value={pest.sndPercent || ''}
                          onChange={(e) => handlePestChange(locIdx, pIdx, 'sndPercent', e.target.value)}
                          disabled={readOnly}
                          className="sf-input sf-highlight"
                        />
                      </div>
                    )}
                    {isWhiteflies && (
                      <div className="sf-field">
                        <label>Leaf curl%</label>
                        <input
                          type="text"
                          value={pest.leafCurlPercent || ''}
                          onChange={(e) => handlePestChange(locIdx, pIdx, 'leafCurlPercent', e.target.value)}
                          disabled={readOnly}
                          className="sf-input sf-highlight"
                        />
                      </div>
                    )}
                    <div className="sf-field">
                      <label>% Defoliation</label>
                      <input
                        type="text"
                        value={pest.defoliationPercent || ''}
                        onChange={(e) => handlePestChange(locIdx, pIdx, 'defoliationPercent', e.target.value)}
                        disabled={readOnly}
                        className="sf-input"
                      />
                    </div>
                    <div className="sf-field">
                      <label>% Yellowing / Drying</label>
                      <input
                        type="text"
                        value={pest.yellowingDryingPercent || ''}
                        onChange={(e) => handlePestChange(locIdx, pIdx, 'yellowingDryingPercent', e.target.value)}
                        disabled={readOnly}
                        className="sf-input"
                      />
                    </div>
                    {['Flowering', 'Seed filling', 'Harvesting', 'Post-harvest', 'Secondary spike'].includes(obs.stageOfCrop) && (
                      <div className="sf-field">
                        <label>Estimated Yield Loss %</label>
                        <input
                          type="text"
                          value={pest.estimatedYieldLoss || ''}
                          onChange={(e) => handlePestChange(locIdx, pIdx, 'estimatedYieldLoss', e.target.value)}
                          disabled={readOnly}
                          className="sf-input"
                        />
                      </div>
                    )}
                    <div className="sf-field">
                      <label>Specific Information</label>
                      <input
                        type="text"
                        value={pest.specificInformation || ''}
                        onChange={(e) => handlePestChange(locIdx, pIdx, 'specificInformation', e.target.value)}
                        disabled={readOnly}
                        className="sf-input"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>



          {/* Image Upload */}
          <div className="sf-section">
            <h5 className="sf-section-title">🖼 Images (optional)</h5>
            {obs.images && obs.images.length > 0 && (
              <div className="sf-image-grid">
                {obs.images.map((img, imgIdx) => (
                  <div key={imgIdx} className="sf-image-thumb">
                    <img src={img} alt={`Observation ${imgIdx + 1}`} />
                    {!readOnly && (
                      <button className="sf-img-remove" onClick={() => removeImage(locIdx, imgIdx)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!readOnly && (
              <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(locIdx, e.target.files)} className="sf-file-input" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

SunflowerEntomologyForm.propTypes = {
  rows: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  state: PropTypes.string,
  district: PropTypes.string,
  taluka: PropTypes.string,
};

export default SunflowerEntomologyForm;
