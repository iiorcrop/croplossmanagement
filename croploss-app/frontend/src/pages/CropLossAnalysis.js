import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { masterDataAPI } from '../utils/api';
import { Spinner } from '../components/common';
import { CROPS, CROP_EMOJI, CROP_LABEL } from '../utils/constants';

const generateYears = () => {
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const y1 = currentYear - i;
    const y2 = (y1 + 1).toString().slice(2);
    years.push(`${y1}-${y2}`);
  }
  return years;
};
const YEARS = generateYears();

const initialLossRow = () => ({
  id: Date.now() + Math.random(),
  crop: CROPS[0],
  cultivars: '',
  areaAffected: '',
  location: '',
  insectPests: { name: '', percent: '' },
  diseases: { name: '', percent: '' },
  nematodes: { name: '', percent: '' },
  weeds: { name: '', percent: '' },
  mites: { name: '', percent: '' },
  rodents: { name: '', percent: '' },
  monetaryLoss: '',
  mgtPractices: ''
});

const CheckboxGroup = ({ options, selected, onChange, onAddNew, addNewLabel }) => {
  const handleToggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(x => x !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className="form-control" style={{ padding: '8px', maxHeight: '120px', overflowY: 'auto', background: '#fff', height: 'auto', minHeight: '80px' }}>
      {options.map(opt => (
        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '4px', cursor: 'pointer', margin: 0 }}>
          <input type="checkbox" checked={selected.includes(opt)} onChange={() => handleToggle(opt)} style={{ cursor: 'pointer', margin: 0 }} />
          <span style={{flex: 1}}>{opt}</span>
        </label>
      ))}
      {onAddNew && (
        <button 
          type="button" 
          onClick={onAddNew}
          style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'var(--g7)', fontWeight: '600', fontSize: '13px', marginTop: '6px', cursor: 'pointer', padding: 0 }}
        >
          {addNewLabel || '➕ Add New...'}
        </button>
      )}
    </div>
  );
};

export default function CropLossAnalysis() {
  const [year, setYear] = useState(YEARS[0]);
  const [instituteName, setInstituteName] = useState('');
  
  const [generalInfo, setGeneralInfo] = useState({
    stateDistrict: '',
    agroEcologicalZone: [],
    majorCrops: [],
    croppingSystem: [],
    soilType: [],
    weather: { tempMaxMin: '', rhMorningEvening: '', rainfall: '' }
  });

  const [cropLosses, setCropLosses] = useState([initialLossRow()]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { tab } = useParams();
  const activeTab = tab === 'methodology' ? 'methodology' : 'analysis';

  const fetchAnalysisData = useCallback(async () => {
    if (!instituteName.trim()) return;

    setLoading(true);
    try {
      const res = await api.get('/analysis', {
        params: { year, instituteName }
      });
      
      if (res.data.data.length > 0) {
        const data = res.data.data[0];
        setGeneralInfo({
          stateDistrict: data.stateDistrict || '',
          agroEcologicalZone: Array.isArray(data.agroEcologicalZone) ? data.agroEcologicalZone : (data.agroEcologicalZone ? data.agroEcologicalZone.split(',').map(s=>s.trim()) : []),
          majorCrops: Array.isArray(data.majorCrops) ? data.majorCrops : (data.majorCrops ? data.majorCrops.split(',').map(s=>s.trim()) : []),
          croppingSystem: Array.isArray(data.croppingSystem) ? data.croppingSystem : (data.croppingSystem ? data.croppingSystem.split(',').map(s=>s.trim()) : []),
          soilType: Array.isArray(data.soilType) ? data.soilType : (data.soilType ? data.soilType.split(',').map(s=>s.trim()) : []),
          weather: data.weather || { tempMaxMin: '', rhMorningEvening: '', rainfall: '' }
        });
        
        if (data.cropLosses && data.cropLosses.length > 0) {
          setCropLosses(data.cropLosses.map(r => ({ ...r, id: r._id || Math.random() })));
        } else {
          setCropLosses([initialLossRow()]);
        }
        toast.success(`Data loaded for ${year}`);
      } else {
        setGeneralInfo({
          stateDistrict: '', agroEcologicalZone: [], majorCrops: [],
          croppingSystem: [], soilType: [], weather: { tempMaxMin: '', rhMorningEvening: '', rainfall: '' }
        });
        setCropLosses([initialLossRow()]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  }, [year, instituteName]);

  const handleSave = async () => {
    if (!instituteName.trim()) {
      return toast.error("Please enter the Institute Name");
    }
    setSaving(true);
    try {
      const payload = {
        year,
        instituteName: instituteName.trim(),
        generalInfo: {
          ...generalInfo,
          agroEcologicalZone: Array.isArray(generalInfo.agroEcologicalZone) ? generalInfo.agroEcologicalZone.join(', ') : generalInfo.agroEcologicalZone,
          majorCrops: Array.isArray(generalInfo.majorCrops) ? generalInfo.majorCrops.join(', ') : generalInfo.majorCrops,
          croppingSystem: Array.isArray(generalInfo.croppingSystem) ? generalInfo.croppingSystem.join(', ') : generalInfo.croppingSystem,
          soilType: Array.isArray(generalInfo.soilType) ? generalInfo.soilType.join(', ') : generalInfo.soilType
        },
        cropLosses: cropLosses.map(({ id, ...rest }) => rest)
      };
      await api.post('/analysis', payload);
      toast.success('Analysis report saved successfully!');
      fetchAnalysisData(); 
    } catch (err) {
      console.error(err);
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const updateGenInfo = (field, value) => {
    setGeneralInfo(prev => ({ ...prev, [field]: value }));
  };
  const updateWeather = (field, value) => {
    setGeneralInfo(prev => ({
      ...prev,
      weather: { ...prev.weather, [field]: value }
    }));
  };

  const addLossRow = () => setCropLosses(prev => [...prev, initialLossRow()]);
  const removeLossRow = (id) => {
    if (cropLosses.length > 1) {
      setCropLosses(prev => prev.filter(r => r.id !== id));
    }
  };
  const updateLossRow = (id, field, value) => {
    setCropLosses(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const [availableYears, setAvailableYears] = useState(YEARS);
  const [availableInstitutes, setAvailableInstitutes] = useState([]);
  const [availableStates, setAvailableStates] = useState([]);
  const [availableAgroZones, setAvailableAgroZones] = useState([]);
  const [availableCultivars, setAvailableCultivars] = useState(['Variety A', 'Variety B', 'Variety C']);
  const [availableMajorCrops, setAvailableMajorCrops] = useState(['Cotton', 'Rice', 'Maize', 'Sorghum', 'Pulses']);
  const [availableCroppingSystems, setAvailableCroppingSystems] = useState(['Rice-Rice', 'Maize-Groundnut', 'Mixed Cropping', 'Rabi-Winter']);
  const [availableSoilTypes, setAvailableSoilTypes] = useState(['Red-chalka', 'Sandy-loam', 'Black cotton', 'Laterite']);

  useEffect(() => {
    masterDataAPI.get().then(res => {
      if (res.data && res.data.data) {
        const md = res.data.data;
        if (md.agroEcologicalZones?.length) setAvailableAgroZones(md.agroEcologicalZones);
        if (md.analysisMajorCrops?.length) setAvailableMajorCrops(md.analysisMajorCrops);
        if (md.analysisCroppingSystems?.length) setAvailableCroppingSystems(md.analysisCroppingSystems);
        if (md.analysisSoilTypes?.length) setAvailableSoilTypes(md.analysisSoilTypes);
      }
    }).catch(err => console.error("Failed to load master data", err));

    // Fetch States
    api.get('/locations/states')
       .then(res => setAvailableStates(res.data.data))
       .catch(err => console.error("Failed to fetch states", err));
  }, []);
  const [availableDistricts, setAvailableDistricts] = useState([]);

  // Fetch Districts when State changes
  const currentState = generalInfo.stateDistrict ? generalInfo.stateDistrict.split(',')[0].trim() : '';
  useEffect(() => {
    if (currentState && currentState !== '__ADD_NEW__') {
      api.get(`/locations/districts/${encodeURIComponent(currentState)}`)
         .then(res => setAvailableDistricts(res.data.data || []))
         .catch(err => console.error("Failed to fetch districts", err));
    } else {
      setAvailableDistricts([]);
    }
  }, [currentState]);
const [availablePests, setAvailablePests] = useState({
    insectPests: ['Bollworm', 'Aphids', 'Jassids'],
    diseases: ['Wilt', 'Blight', 'Rust'],
    nematodes: ['Root-knot', 'Lesion'],
    weeds: ['Grassy weeds', 'Broad-leaved weeds'],
    mites: ['Red spider mite', 'Yellow mite'],
    rodents: ['Field rats', 'Bandicoot']
  });

  const handlePestUpdate = (id, category, subField, value) => {
    setCropLosses(prev => prev.map(r => r.id === id ? { ...r, [category]: { ...r[category], [subField]: value } } : r));
  };

  // Handlers for dynamic dropdowns with add‑new option
  const handleAddNewAgroZone = async () => {
    const newVal = window.prompt('Enter new Agro‑ecological Zone:');
    if (newVal && newVal.trim()) {
      const updated = [...new Set([...availableAgroZones, newVal.trim()])];
      setAvailableAgroZones(updated);
      updateGenInfo('agroEcologicalZone', [...generalInfo.agroEcologicalZone, newVal.trim()]);
      try { await masterDataAPI.updateList('agroEcologicalZones', updated); toast.success("Added globally!"); } catch (e) { console.error(e); }
    }
  };
  const handleAddNewMajorCrop = async () => {
    const newVal = window.prompt('Enter new Major Crop (comma separated if multiple):');
    if (newVal && newVal.trim()) {
      const newItems = newVal.split(',').map(s => s.trim()).filter(Boolean);
      const updated = [...new Set([...availableMajorCrops, ...newItems])];
      setAvailableMajorCrops(updated);
      updateGenInfo('majorCrops', [...generalInfo.majorCrops, ...newItems]);
      try { await masterDataAPI.updateList('analysisMajorCrops', updated); toast.success("Added globally!"); } catch (e) { console.error(e); }
    }
  };
  const handleAddNewCroppingSystem = async () => {
    const newVal = window.prompt('Enter new Cropping System:');
    if (newVal && newVal.trim()) {
      const updated = [...new Set([...availableCroppingSystems, newVal.trim()])];
      setAvailableCroppingSystems(updated);
      updateGenInfo('croppingSystem', [...generalInfo.croppingSystem, newVal.trim()]);
      try { await masterDataAPI.updateList('analysisCroppingSystems', updated); toast.success("Added globally!"); } catch (e) { console.error(e); }
    }
  };
  const handleAddNewSoilType = async () => {
    const newVal = window.prompt('Enter new Soil Type:');
    if (newVal && newVal.trim()) {
      const updated = [...new Set([...availableSoilTypes, newVal.trim()])];
      setAvailableSoilTypes(updated);
      updateGenInfo('soilType', [...generalInfo.soilType, newVal.trim()]);
      try { await masterDataAPI.updateList('analysisSoilTypes', updated); toast.success("Added globally!"); } catch (e) { console.error(e); }
    }
  };

  useEffect(() => {
    api.get('/analysis').then(res => {
      const data = res.data.data || [];
      const insts = [...new Set(data.map(d => d.instituteName).filter(Boolean))];
      if (insts.length > 0) setAvailableInstitutes(prev => [...new Set([...prev, ...insts])]);
    }).catch(console.error);
  }, []);

  const handleYearChange = (e) => {
    const val = e.target.value;
    if (val === '__ADD_NEW__') {
      const newYear = window.prompt("Enter new Reporting Year (e.g. 2027-28):");
      if (newYear && newYear.trim()) {
        setAvailableYears(prev => [...new Set([...prev, newYear.trim()])]);
        setYear(newYear.trim());
      }
    } else {
      setYear(val);
    }
  };

  const handleInstituteChange = (e) => {
    const val = e.target.value;
    if (val === '__ADD_NEW__') {
      const newInst = window.prompt("Enter new Institute Name:");
      if (newInst && newInst.trim()) {
        setAvailableInstitutes(prev => [...new Set([...prev, newInst.trim()])]);
        setInstituteName(newInst.trim());
      }
    } else {
      setInstituteName(val);
    }
  };

  const handleStateChange = (e) => {
    const val = e.target.value;
    if (val === '__ADD_NEW__') {
      const newState = window.prompt("Enter new State Name:");
      if (newState && newState.trim()) {
        setAvailableStates(prev => [...new Set([...prev, newState.trim()])]);
        updateGenInfo('stateDistrict', newState.trim() + (generalInfo.stateDistrict.includes(',') ? ',' + generalInfo.stateDistrict.split(',')[1] : ''));
      }
    } else {
       const dist = generalInfo.stateDistrict.includes(',') ? ',' + generalInfo.stateDistrict.split(',')[1] : '';
       updateGenInfo('stateDistrict', val + dist);
    }
  };

  const handleDistrictChange = (e) => {
    const currentState = generalInfo.stateDistrict.split(',')[0] || '';
    const val = e.target.value;
    if (val === '__ADD_NEW__') {
      const newDist = window.prompt('Enter new District name:');
      if (newDist && newDist.trim()) {
        setAvailableDistricts(prev => [...new Set([...prev, newDist.trim()])]);
        updateGenInfo('stateDistrict', `${currentState}, ${newDist.trim()}`);
      }
    } else {
      updateGenInfo('stateDistrict', currentState + (val ? ', ' + val : ''));
    }
  };

  return (
    <div className="page-content animate-fade-in" style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
  {/* Tab navigation moved to Sidebar */}
  {activeTab === 'analysis' && ( <> 
      
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '28px', color: 'var(--g9)' }}>📊 Comprehensive CropLoss Analysis</h2>
          <p style={{ color: 'var(--gray)', marginTop: '6px', fontSize: '14px' }}>
            Consolidated reporting of crop losses by Institute, Zone, and Reporting Period.
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ padding: '10px 20px', fontSize: '14px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(46,125,50,0.2)' }} 
          onClick={handleSave} 
          disabled={saving || loading}
        >
          {saving ? 'Saving...' : '💾 Save Official Report'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--g7)' }}>
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Report Target Configuration</h3>
        <div className="form-grid grid-3">
          <div className="form-group">
            <label className="form-label required">Reporting Year (Period)</label>
            <select className="form-control" style={{ fontSize: '14px', padding: '10px', background: '#fcfdfc' }} value={year} onChange={handleYearChange}>
              <option value="">-- Select Year --</option>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--g7)' }}>➕ Add New Year...</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label required">Name of the Institute</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select 
                className="form-control" 
                style={{ fontSize: '14px', padding: '10px', background: '#fcfdfc' }}
                value={instituteName} 
                onChange={handleInstituteChange} 
              >
                <option value="">-- Select Institute --</option>
                {availableInstitutes.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--g7)' }}>➕ Add New Institute...</option>
              </select>
              <button className="btn btn-outline" style={{ padding: '0 24px' }} onClick={fetchAnalysisData} disabled={loading || !instituteName.trim()}>
                Load Existing
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <Spinner text="Loading analysis data..." />
      ) : (
        <div className="animate-fade-in">
          
          <div className="card" style={{ marginBottom: '24px', background: '#fcfdfc' }}>
            <div className="card-header" style={{ borderBottom: '2px solid var(--g1)', paddingBottom: '12px' }}>
              <h3 className="card-title" style={{ color: 'var(--g8)', fontSize: '16px' }}>
                <span style={{ background: 'var(--g1)', padding: '4px 8px', borderRadius: '6px', marginRight: '8px' }}>1</span>
                General Information Profile
              </h3>
            </div>
            
            <div className="form-grid grid-2" style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">State</label>
                <select className="form-control" value={generalInfo.stateDistrict.split(',')[0] || ''} onChange={handleStateChange}>
                  <option value="">-- Select State --</option>
                  {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="__ADD_NEW__" style={{ fontWeight: 'bold', color: 'var(--g7)' }}>➕ Add New State...</option>
                </select>
              </div>
              <div className="form-group">
<select className="form-control" value={generalInfo.stateDistrict.split(',')[1]?.trim() || ''} onChange={handleDistrictChange}>
  <option value="">-- Select District --</option>
  {availableDistricts.map(d => (
    <option key={d} value={d}>{d}</option>
  ))}
  <option value="__ADD_NEW__" style={{fontWeight:'bold', color:'var(--g7)'}}>➕ Add New District...</option>
</select>
              </div>
              <div className="form-group">
                <label className="form-label">Agro-ecological Zone</label>
                <CheckboxGroup
                  options={availableAgroZones}
                  selected={generalInfo.agroEcologicalZone}
                  onChange={(val) => updateGenInfo('agroEcologicalZone', val)}
                  onAddNew={handleAddNewAgroZone}
                  addNewLabel="➕ Add New Agro Zone..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Major crops of the zone</label>
                <CheckboxGroup
                  options={availableMajorCrops}
                  selected={generalInfo.majorCrops}
                  onChange={(val) => updateGenInfo('majorCrops', val)}
                  onAddNew={handleAddNewMajorCrop}
                  addNewLabel="➕ Add New Major Crop..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cropping system</label>
                <CheckboxGroup
                  options={availableCroppingSystems}
                  selected={generalInfo.croppingSystem}
                  onChange={(val) => updateGenInfo('croppingSystem', val)}
                  onAddNew={handleAddNewCroppingSystem}
                  addNewLabel="➕ Add New Cropping System..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Soil Type</label>
                <CheckboxGroup
                  options={availableSoilTypes}
                  selected={generalInfo.soilType}
                  onChange={(val) => updateGenInfo('soilType', val)}
                  onAddNew={handleAddNewSoilType}
                  addNewLabel="➕ Add New Soil Type..."
                />
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '16px', background: 'var(--g1)', padding: '16px', borderRadius: '8px', border: '1px solid #cce5cc' }}>
                <label className="form-label" style={{ fontWeight: '700', color: 'var(--g9)', display: 'block', marginBottom: '12px' }}>🌤️ Weather Parameters</label>
                <div className="form-grid grid-3">
                  <div className="form-group">
                    <label className="form-label">a. Avg Temp (Max & Min)</label>
                    <input type="text" className="form-control" style={{ background: '#fff' }} placeholder="e.g. 38°C / 22°C" value={generalInfo.weather.tempMaxMin} onChange={e => updateWeather('tempMaxMin', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">b. Avg RH (Morn & Eve)</label>
                    <input type="text" className="form-control" style={{ background: '#fff' }} placeholder="e.g. 68% / 88%" value={generalInfo.weather.rhMorningEvening} onChange={e => updateWeather('rhMorningEvening', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">c. Avg Rainfall</label>
                    <input type="text" className="form-control" style={{ background: '#fff' }} placeholder="e.g. 740 mm" value={generalInfo.weather.rainfall} onChange={e => updateWeather('rainfall', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ overflow: 'visible', background: '#fcfdfc' }}>
            <div className="card-header" style={{ borderBottom: '2px solid var(--g1)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 className="card-title" style={{ color: 'var(--g8)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'var(--g1)', padding: '4px 8px', borderRadius: '6px' }}>2</span>
                Crop Losses Due to Pests during {year}
              </h3>
              <button className="btn btn-outline" style={{ background: 'var(--g1)' }} onClick={addLossRow}>
                ➕ Add Record
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {cropLosses.map((row, idx) => (
                <div key={row.id} style={{ border: '1px solid var(--gray-b)', borderRadius: '12px', background: '#fff', boxShadow: 'var(--sh)', overflow: 'hidden' }}>
                  
                  <div style={{ background: 'var(--g9)', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>Record #{idx + 1}</div>
                    <button 
                      className="btn" 
                      style={{ background: 'rgba(255,0,0,0.2)', color: '#ffb3b3', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }} 
                      onClick={() => removeLossRow(row.id)} 
                      disabled={cropLosses.length === 1}
                    >
                      🗑️ Remove Record
                    </button>
                  </div>

                  <div style={{ padding: '20px' }}>
                    
                    <div className="form-grid grid-2" style={{ marginBottom: '24px' }}>
                      <div className="form-group">
                        <label className="form-label">Crop</label>
                        <select className="form-control" value={row.crop} onChange={e => updateLossRow(row.id, 'crop', e.target.value)}>
                          {CROPS.map(c => <option key={c} value={c}>{CROP_EMOJI[c]} {CROP_LABEL(c)}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Cultivars</label>
                        <select className="form-control" value={row.cultivars} onChange={e => {
                          const val = e.target.value;
                          if (val === '__ADD_NEW__') {
                            const newVal = window.prompt('Enter new Cultivar name:');
                            if (newVal && newVal.trim()) {
                              setAvailableCultivars(prev => [...new Set([...prev, newVal.trim()])]);
                              updateLossRow(row.id, 'cultivars', newVal.trim());
                            }
                          } else {
                            updateLossRow(row.id, 'cultivars', val);
                          }
                        }}>
                          <option value="">-- Select Cultivar --</option>
                          {availableCultivars.map(c => <option key={c} value={c}>{c}</option>)}
                          <option value="__ADD_NEW__" style={{fontWeight:'bold', color:'var(--g7)'}}>➕ Add New Cultivar...</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Area Affected</label>
                        <textarea className="form-control" rows={2} style={{ resize: 'vertical' }} value={row.areaAffected} onChange={e => updateLossRow(row.id, 'areaAffected', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Location</label>
                        <textarea className="form-control" rows={2} style={{ resize: 'vertical' }} value={row.location} onChange={e => updateLossRow(row.id, 'location', e.target.value)} />
                      </div>
                    </div>

                    {/* Pest Losses Grid */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                      <label className="form-label" style={{ display: 'block', marginBottom: '16px', fontWeight: 'bold', color: '#1e3a8a', fontSize: '14px' }}>
                        📈 Percent Crop Losses due to Economically Important Factors
                      </label>
                      <div className="form-grid grid-3">
                        <div className="form-group">
                          <label className="form-label" style={{ color: '#b91c1c' }}>Insect Pests</label>
                          <div className="form-grid grid-2" style={{ gap: '8px' }}>
                            <select className="form-control" value={row.insectPests.name} onChange={e => {
                              const val = e.target.value;
                              if (val === '__ADD_NEW__') {
                                const newVal = window.prompt('Enter new Insect Pest name:');
                                if (newVal && newVal.trim()) {
                                  setAvailablePests(prev => ({ ...prev, insectPests: [...new Set([...prev.insectPests, newVal.trim()])] }));
                                  handlePestUpdate(row.id, 'insectPests', 'name', newVal.trim());
                                }
                              } else {
                                handlePestUpdate(row.id, 'insectPests', 'name', val);
                              }
                            }}>
                              <option value="">-- Select Pest --</option>
                              {availablePests.insectPests.map(p => <option key={p} value={p}>{p}</option>)}
                              <option value="__ADD_NEW__" style={{fontWeight:'bold', color:'var(--g7)'}}>➕ Add New Pest...</option>
                            </select>
                            <input type="text" className="form-control" placeholder="Loss %" value={row.insectPests.percent} onChange={e => handlePestUpdate(row.id, 'insectPests', 'percent', e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ color: '#7e22ce' }}>Diseases</label>
                          <div className="form-grid grid-2" style={{ gap: '8px' }}>
                            <select className="form-control" value={row.diseases.name} onChange={e => {
                              const val = e.target.value;
                              if (val === '__ADD_NEW__') {
                                const newVal = window.prompt('Enter new Disease name:');
                                if (newVal && newVal.trim()) {
                                  setAvailablePests(prev => ({ ...prev, diseases: [...new Set([...prev.diseases, newVal.trim()])] }));
                                  handlePestUpdate(row.id, 'diseases', 'name', newVal.trim());
                                }
                              } else {
                                handlePestUpdate(row.id, 'diseases', 'name', val);
                              }
                            }}>
                              <option value="">-- Select Disease --</option>
                              {availablePests.diseases.map(p => <option key={p} value={p}>{p}</option>)}
                              <option value="__ADD_NEW__" style={{fontWeight:'bold', color:'var(--g7)'}}>➕ Add New Disease...</option>
                            </select>
                            <input type="text" className="form-control" placeholder="Loss %" value={row.diseases.percent} onChange={e => handlePestUpdate(row.id, 'diseases', 'percent', e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ color: '#b45309' }}>Nematodes</label>
                          <div className="form-grid grid-2" style={{ gap: '8px' }}>
                            <select className="form-control" value={row.nematodes.name} onChange={e => {
                              const val = e.target.value;
                              if (val === '__ADD_NEW__') {
                                const newVal = window.prompt('Enter new Nematode name:');
                                if (newVal && newVal.trim()) {
                                  setAvailablePests(prev => ({ ...prev, nematodes: [...new Set([...prev.nematodes, newVal.trim()])] }));
                                  handlePestUpdate(row.id, 'nematodes', 'name', newVal.trim());
                                }
                              } else {
                                handlePestUpdate(row.id, 'nematodes', 'name', val);
                              }
                            }}>
                              <option value="">-- Select Nematode --</option>
                              {availablePests.nematodes.map(p => <option key={p} value={p}>{p}</option>)}
                              <option value="__ADD_NEW__" style={{fontWeight:'bold', color:'var(--g7)'}}>➕ Add New Nematode...</option>
                            </select>
                            <input type="text" className="form-control" placeholder="Loss %" value={row.nematodes.percent} onChange={e => handlePestUpdate(row.id, 'nematodes', 'percent', e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ color: '#047857' }}>Weeds</label>
                          <div className="form-grid grid-2" style={{ gap: '8px' }}>
                            <select className="form-control" value={row.weeds.name} onChange={e => {
                              const val = e.target.value;
                              if (val === '__ADD_NEW__') {
                                const newVal = window.prompt('Enter new Weed name:');
                                if (newVal && newVal.trim()) {
                                  setAvailablePests(prev => ({ ...prev, weeds: [...new Set([...prev.weeds, newVal.trim()])] }));
                                  handlePestUpdate(row.id, 'weeds', 'name', newVal.trim());
                                }
                              } else {
                                handlePestUpdate(row.id, 'weeds', 'name', val);
                              }
                            }}>
                              <option value="">-- Select Weed --</option>
                              {availablePests.weeds.map(p => <option key={p} value={p}>{p}</option>)}
                              <option value="__ADD_NEW__" style={{fontWeight:'bold', color:'var(--g7)'}}>➕ Add New Weed...</option>
                            </select>
                            <input type="text" className="form-control" placeholder="Loss %" value={row.weeds.percent} onChange={e => handlePestUpdate(row.id, 'weeds', 'percent', e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ color: '#0f766e' }}>Mites</label>
                          <div className="form-grid grid-2" style={{ gap: '8px' }}>
                            <select className="form-control" value={row.mites.name} onChange={e => {
                              const val = e.target.value;
                              if (val === '__ADD_NEW__') {
                                const newVal = window.prompt('Enter new Mite name:');
                                if (newVal && newVal.trim()) {
                                  setAvailablePests(prev => ({ ...prev, mites: [...new Set([...prev.mites, newVal.trim()])] }));
                                  handlePestUpdate(row.id, 'mites', 'name', newVal.trim());
                                }
                              } else {
                                handlePestUpdate(row.id, 'mites', 'name', val);
                              }
                            }}>
                              <option value="">-- Select Mite --</option>
                              {availablePests.mites.map(p => <option key={p} value={p}>{p}</option>)}
                              <option value="__ADD_NEW__" style={{fontWeight:'bold', color:'var(--g7)'}}>➕ Add New Mite...</option>
                            </select>
                            <input type="text" className="form-control" placeholder="Loss %" value={row.mites.percent} onChange={e => handlePestUpdate(row.id, 'mites', 'percent', e.target.value)} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ color: '#334155' }}>Rodents / Vertebrates</label>
                          <div className="form-grid grid-2" style={{ gap: '8px' }}>
                            <select className="form-control" value={row.rodents.name} onChange={e => {
                              const val = e.target.value;
                              if (val === '__ADD_NEW__') {
                                const newVal = window.prompt('Enter new Rodent/Vertebrate name:');
                                if (newVal && newVal.trim()) {
                                  setAvailablePests(prev => ({ ...prev, rodents: [...new Set([...prev.rodents, newVal.trim()])] }));
                                  handlePestUpdate(row.id, 'rodents', 'name', newVal.trim());
                                }
                              } else {
                                handlePestUpdate(row.id, 'rodents', 'name', val);
                              }
                            }}>
                              <option value="">-- Select Rodent/Vertebrate --</option>
                              {availablePests.rodents.map(p => <option key={p} value={p}>{p}</option>)}
                              <option value="__ADD_NEW__" style={{fontWeight:'bold', color:'var(--g7)'}}>➕ Add New Rodent/Vertebrate...</option>
                            </select>
                            <input type="text" className="form-control" placeholder="Loss %" value={row.rodents.percent} onChange={e => handlePestUpdate(row.id, 'rodents', 'percent', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-grid grid-2">
                      <div className="form-group">
                        <label className="form-label">Monetary losses (INR)</label>
                        <input type="text" className="form-control" placeholder="e.g. Rs. 20,500/-" value={row.monetaryLoss} onChange={e => updateLossRow(row.id, 'monetaryLoss', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Management practices developed (Yes/No)</label>
                        <input type="text" className="form-control" placeholder="e.g. Yes" value={row.mgtPractices} onChange={e => updateLossRow(row.id, 'mgtPractices', e.target.value)} />
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <button className="btn btn-outline" style={{ background: 'var(--g1)', padding: '12px 24px', fontSize: '15px' }} onClick={addLossRow}>
                ➕ Add Another Record
              </button>
            </div>
          </div>
        </div>
      )}
  </>)}
{activeTab === 'methodology' && (
  <div className="card" style={{ marginTop: '32px', background: '#fcfdfc', padding: '20px', borderRadius: '8px' }}>
    <h3 style={{ color: 'var(--g8)', marginBottom: '16px' }}>Methodology</h3>
    <h4>2.1 Compilation and aggregation of yield loss data</h4>
    <p>The initial dataset comprised raw observations on yield loss caused by various insect pests and diseases affecting individual crops. These data were collected from multiple ICAR research institutions and its AICRP centres, State Agriculture Universities and KVKs across several cropping seasons and locations during the last five years from 2021 to 2025. For each crop, the raw data contained multiple entries for different insect pests and diseases across different years. To derive a consolidated estimate for each crop, the following aggregation procedure was followed:</p>
    <ul>
      <li>Data Segregation: For each crop, all records to insect pests were grouped, and diseases were grouped separately.</li>
      <li>Treatment of Individual Records: For each insect pest or disease record, if a range of loss (minimum and maximum) was reported, the average yield loss was computed. If a single point estimate was reported that value was uniformly adopted as the minimum and average for that specific record.</li>
      <li>Crop-Level Aggregation: After processing individual records, all loss percentages related to insect pests and diseases for a given crop were aggregated to derive a single average, representative set of two values: minimum per cent loss and average per cent loss due to insect pests and diseases. For each crop, the average yield loss was calculated separately for insect pest and disease-related records.</li>
      <li>A consolidated yield loss profile was developed for each crop by capturing both the minimum and average of yield losses attributed to insect pests and diseases over the study period.</li>
    </ul>
    <h4>2.2 Estimation of the value of produce</h4>
    <p><strong>Value of produce for field crops</strong></p>
    <p>For field crops, including cereals, pulses, oilseeds and commercial crops, the value of produce was derived from the production volume and the Minimum Support Price (MSP). Production data (in Lakh Tonnes) were sourced from the official government Unified Portal for Agricultural Statistics (UPAg). MSP data (in Rupees per Quintal) were obtained from the Commission for Agricultural Costs and Prices (CACP). If MSP is not available for a particular crop, the average price during last three years was taken from UPAg portal. To compute the total value in crores, production volume and price were harmonized. The production and MSP data used for this calculation represent the average data from the years 2020‑21 to 2024‑25.</p>
    <p>Value of Produce (Crores) = Production (Lakh Tonnes) × MSP (Rs. /Tonnes)</p>
    <p><strong>Value of Produce for horticulture crops</strong></p>
    <p>For horticultural crops, the total value of production was obtained directly from official horticulture statistics. These statistics report on the value of production in Lakhs. The values were converted into Crores. The production value data used for this calculation represents the average values for the years 2019‑20 to 2022‑23.</p>
    <p>Value of Produce (Crores) = Value of Produce (Lakhs) × 100</p>
    <h4>2.3 Calculation of monetary loss</h4>
    <p>Monetary loss = Total value of the crop × proportion of yield lost.</p>
    <p>Loss_ins = V × L_ins / 100</p>
    <p>Loss_Dis = V × L_Dis / 100</p>
    <h4>2.4 Estimation of combined monetary loss</h4>
    <p>Combined Minimum Loss = Loss_ins^min + Loss_dis^min</p>
    <p>Combined Average Loss = Loss_ins^avg + Loss_dis^avg</p>
  </div>
)}
    </div>
  );
}
