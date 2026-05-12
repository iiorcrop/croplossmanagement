import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { entriesAPI } from '../utils/api';
import { Alert, Spinner } from '../components/common';
import ObservationTable, { blankRow } from '../components/common/ObservationTable';
import { CROPS, DISCIPLINES, CROP_EMOJI, CROP_LABEL, SEASONS } from '../utils/constants';
import axios from 'axios';

// --- Stepper Component ---
const Stepper = ({ currentStep, steps }) => (
  <div className="stepper-container">
    {steps.map((step, idx) => (
      <React.Fragment key={idx}>
        <div className={`stepper-step ${idx <= currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}>
          <div className="stepper-circle">
            {idx < currentStep ? '✓' : idx + 1}
          </div>
          <div className="stepper-label">{step}</div>
        </div>
        {idx < steps.length - 1 && (
          <div className={`stepper-line ${idx < currentStep ? 'active' : ''}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

export default function EntryForm() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmit] = useState(false);

  const [form, setForm] = useState({
    crop: '',
    discipline: 'Pathology',
    season: 'Kharif 2024-25',
    year: 2024,
    state: user?.centerState || '',
    district: '',
    taluka: '',
    surveyDate: new Date().toISOString().split('T')[0],
    surveyorName: user?.name || '',
    surveyorDesig: user?.designation || '',
    centerName: user?.centerName || '',
    centerState: user?.centerState || '',
  });

  const [availableStates, setAvailableStates] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableTalukas, setAvailableTalukas] = useState([]);

  // Fetch States on Load
  useEffect(() => {
    axios.get('http://localhost:5000/api/locations/states')
      .then(res => setAvailableStates(res.data.data))
      .catch(err => console.error('Failed to fetch states', err));
  }, []);

  // Fetch Districts when State changes
  useEffect(() => {
    if (form.state) {
      axios.get(`http://localhost:5000/api/locations/districts/${encodeURIComponent(form.state)}`)
        .then(res => setAvailableDistricts(res.data.data))
        .catch(err => console.error('Failed to fetch districts', err));
    } else {
      setAvailableDistricts([]);
    }
  }, [form.state]);

  // Fetch Talukas when District changes
  useEffect(() => {
    if (form.state && form.district) {
      axios.get(`http://localhost:5000/api/locations/talukas/${encodeURIComponent(form.state)}/${encodeURIComponent(form.district)}`)
        .then(res => setAvailableTalukas(res.data.data))
        .catch(err => console.error('Failed to fetch talukas', err));
    } else {
      setAvailableTalukas([]);
    }
  }, [form.state, form.district]);

  const [observations, setObservations] = useState([]);
  const [entry, setEntry] = useState(null);

  const steps = ["Basics", "Location", "Observations", "Review"];

  useEffect(() => {
    if (!isEdit) return;
    entriesAPI.get(id)
      .then(res => {
        const e = res.data.data;
        setEntry(e);
        setForm({
          crop: e.crop,
          discipline: e.discipline || 'Pathology',
          season: e.season,
          year: e.year,
          state: e.state || '',
          district: e.district || '',
          taluka: e.taluka || '',
          surveyDate: e.surveyDate ? new Date(e.surveyDate).toISOString().split('T')[0] : '',
          surveyorName: e.surveyorName || '',
          surveyorDesig: e.surveyorDesig || '',
          centerName: e.centerName || '',
          centerState: e.centerState || '',
        });
        setObservations(e.observations || []);
      })
      .catch(() => {
        toast.error('Entry not found');
        navigate('/my-submissions');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const isEditable = !isEdit || (entry && ['draft', 'needs_correction'].includes(entry.status));
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onCropChange = (crop) => {
    setField('crop', crop);
    if (observations.length === 0 && crop) {
      setObservations([blankRow(crop)]);
    }
  };

  const validateStep = (step) => {
    if (step === 0) {
      if (!form.crop) { toast.error('Please select a crop'); return false; }
      if (!form.discipline) { toast.error('Please select a discipline'); return false; }
      if (!form.season) { toast.error('Please select a season'); return false; }
      if (!form.surveyDate) { toast.error('Please select survey date'); return false; }
    }
    if (step === 1) {
      if (!form.state) { toast.error('Please select a state'); return false; }
      if (!form.district) { toast.error('Please select a district'); return false; }
      if (!form.taluka) { toast.error('Please select a taluka / block'); return false; }
    }
    if (step === 2) {
      if (observations.length === 0) { toast.error('Add at least one observation row'); return false; }
      const unfilled = observations.filter(r => !r.location?.trim());
      if (unfilled.length > 0) { toast.error('All rows must have a location name'); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(s => Math.min(s + 1, steps.length - 1));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(s => Math.max(s - 1, 0));
    window.scrollTo(0, 0);
  };

  const buildPayload = (status) => ({
    ...form,
    year: parseInt((form.season || '').match(/\d{4}/)?.[0]) || new Date().getFullYear(),
    observations,
    status,
  });

  const handleSaveDraft = async () => {
    if (!form.crop) { toast.error('Select a crop first'); return; }
    setSaving(true);
    try {
      const payload = buildPayload('draft');
      if (isEdit) {
        await entriesAPI.update(id, payload);
        toast.success('Draft updated');
      } else {
        const res = await entriesAPI.create(payload);
        toast.success('Draft saved');
        navigate(`/entry/${res.data.data._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) return;
    setSubmit(true);
    try {
      let entryId = id;
      const payload = buildPayload('draft');
      if (isEdit) {
        await entriesAPI.update(id, payload);
      } else {
        const res = await entriesAPI.create(payload);
        entryId = res.data.data._id;
      }
      const res = await entriesAPI.submit(entryId);
      toast.success(res.data.message || 'Submitted successfully!');
      navigate('/my-submissions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmit(false);
    }
  };

  if (loading) return <Spinner text="Loading entry…" />;

  const maxWilt = observations.length ? Math.max(0, ...observations.map(r => parseFloat(r.wilt) || 0)) : 0;
  const availableCrops = isAdmin ? CROPS : (user?.assignedCrops || CROPS);

  return (
    <div className="entry-form-page">
      <div className="page-header">
        <div>
          <h2>{isEdit ? `Edit Survey` : 'New Crop Survey Entry'}</h2>
          <p className="text-gray" style={{ fontSize: '13px', marginTop: '4px' }}>
            {CROP_LABEL(form.crop) || 'Select crop'} • {form.discipline} • {form.season}
          </p>
        </div>
        <div className="header-actions">
          {isEditable && (
            <button className="btn btn-outline" onClick={handleSaveDraft} disabled={saving || submitting}>
              {saving ? 'Saving...' : '💾 Save Draft'}
            </button>
          )}
        </div>
      </div>

      <Stepper currentStep={currentStep} steps={steps} />

      {entry?.correctionNote && currentStep === 0 && (
        <Alert type="correction" icon="🔄">
          <strong>Correction Required:</strong> {entry.correctionNote}
        </Alert>
      )}

      <div className="step-content-card">
        {currentStep === 0 && (
          <div className="animate-fade-in">
            <h3 className="step-title">📋 Basic Information</h3>
            <div className="form-grid grid-2">
              <div className="form-group">
                <label className="form-label required">Crop</label>
                <select className="form-control" value={form.crop} onChange={e => onCropChange(e.target.value)} disabled={!isEditable}>
                  <option value="">— Select Crop —</option>
                  {availableCrops.map(c => (
                    <option key={c} value={c}>{CROP_EMOJI[c]} {CROP_LABEL(c)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Discipline</label>
                <select className="form-control" value={form.discipline} onChange={e => setField('discipline', e.target.value)} disabled={!isEditable}>
                  {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Season</label>
                <select className="form-control" value={form.season} onChange={e => setField('season', e.target.value)} disabled={!isEditable}>
                  {SEASONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Survey Date</label>
                <input className="form-control" type="date" value={form.surveyDate} onChange={e => setField('surveyDate', e.target.value)} readOnly={!isEditable} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="animate-fade-in">
            <h3 className="step-title">📍 Location & Surveyor</h3>
            <div className="form-grid grid-2">
              <div className="form-group">
                <label className="form-label required">State</label>
                <select className="form-control" value={form.state} onChange={e => setForm({ ...form, state: e.target.value, district: '', taluka: '' })} disabled={!isEditable}>
                  <option value="">— Select State —</option>
                  {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">District</label>
                <select className="form-control" value={form.district} onChange={e => setForm({ ...form, district: e.target.value, taluka: '' })} disabled={!isEditable || !form.state}>
                  <option value="">— Select District —</option>
                  {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label required">Taluka / Block</label>
                <select 
                  className="form-control" 
                  value={form.taluka} 
                  onChange={e => setForm({ ...form, taluka: e.target.value })} 
                  disabled={!isEditable || !form.district}
                >
                  <option value="">— Select Taluka —</option>
                  {availableTalukas.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Surveyor Name</label>
                <input className="form-control" type="text" value={form.surveyorName} onChange={e => setField('surveyorName', e.target.value)} placeholder="Full name" readOnly={!isEditable} />
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input className="form-control" type="text" value={form.surveyorDesig} onChange={e => setField('surveyorDesig', e.target.value)} placeholder="e.g. Research Associate" readOnly={!isEditable} />
              </div>
              <div className="form-group">
                <label className="form-label">Center</label>
                <input className="form-control" type="text" value={form.centerName} readOnly />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-fade-in">
            <div className="step-header-flex">
              <h3 className="step-title">📊 Observations</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-active">{CROP_EMOJI[form.crop]} {CROP_LABEL(form.crop)}</span>
                <span className="badge badge-submitted">{form.discipline}</span>
              </div>
            </div>
            <p className="step-desc">Enter {form.discipline} records for {CROP_LABEL(form.crop)} below.</p>
            
            {maxWilt >= 50 && form.discipline !== 'Entomology' && (
              <Alert type="danger" icon="🚨">
                <strong>High Wilt Alert!</strong> Max recorded: {maxWilt.toFixed(1)}%. Admin will be alerted.
              </Alert>
            )}

            <div className="observation-table-container">
              <ObservationTable
                crop={form.crop}
                discipline={form.discipline}
                rows={observations}
                onChange={setObservations}
                readOnly={!isEditable}
                state={form.state}
                district={form.district}
                taluka={form.taluka}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-fade-in">
            <h3 className="step-title">🏁 Review & Submit</h3>
            <div className="review-summary-grid">
              <div className="review-item">
                <label>Crop & Discipline</label>
                <div>{CROP_EMOJI[form.crop]} {CROP_LABEL(form.crop)} ({form.discipline})</div>
              </div>
              <div className="review-item">
                <label>Location</label>
                <div>{form.taluka}, {form.district}, {form.state}</div>
              </div>
              <div className="review-item">
                <label>Season</label>
                <div>{form.season}</div>
              </div>
              <div className="review-item">
                <label>Date</label>
                <div>{form.surveyDate}</div>
              </div>
              <div className="review-item">
                <label>Observations</label>
                <div>{observations.length} locations recorded</div>
              </div>
              {form.discipline !== 'Entomology' && (
                <div className="review-item">
                  <label>Max Wilt</label>
                  <div className={maxWilt >= 50 ? 'text-red font-bold' : ''}>{maxWilt.toFixed(1)}%</div>
                </div>
              )}
            </div>

            <Alert type="info" icon="ℹ️">
              By submitting, you confirm that the data is accurate. Notification will be sent to the Crop Head for review.
            </Alert>
          </div>
        )}
      </div>

      <div className="step-actions">
        {currentStep > 0 && (
          <button className="btn btn-outline" onClick={prevStep}>← Previous</button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          {currentStep < steps.length - 1 ? (
            <button className="btn btn-primary" onClick={nextStep}>Next Step →</button>
          ) : (
            isEditable && (
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : '🚀 Submit Final Report'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
