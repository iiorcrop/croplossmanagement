import React from 'react';

/**
 * Field details recorded once per observation row (per village/location).
 *
 * These are the columns every PDF/Excel report prints alongside the disease and
 * insect readings. They used to live only on the entry ("Crop Details" on the
 * Location step), which left them blank in reports whenever that optional
 * section was skipped — so each row now carries its own copy, seeded from the
 * survey-level values.
 */
export const FIELD_DETAILS = [
  { key: 'location',         label: 'Location',          type: 'datalist', options: 'villages', placeholder: 'Village / field location' },
  { key: 'latitude',         label: 'Latitude',          type: 'number',   placeholder: 'e.g. 16.8712', required: true },
  { key: 'longitude',        label: 'Longitude',         type: 'number',   placeholder: 'e.g. 79.5641', required: true },
  { key: 'soilType',         label: 'Soil Type',         type: 'select',   options: 'soilTypes' },
  { key: 'previousCrop',     label: 'Previous Crop',     type: 'select',   options: 'previousCrops' },
  { key: 'variety',          label: 'Variety',           type: 'select',   options: 'varieties' },
  { key: 'irrigatedRainfed', label: 'Irrigated/Rainfed', type: 'select',   options: 'irrigationTypes' },
  { key: 'dateOfSowing',     label: 'Date of Sowing',    type: 'select',   options: 'sowingDates' },
  { key: 'stageOfCrop',      label: 'Stage of Crop',     type: 'select',   options: 'cropStages' },
];

/** Apply the survey-level defaults to any field the row hasn't filled itself. */
export const withFieldDefaults = (row = {}, defaults = {}) => {
  const next = { ...row };
  FIELD_DETAILS.forEach(({ key }) => {
    const v = next[key];
    if ((v === undefined || v === null || v === '') && defaults[key]) next[key] = defaults[key];
  });
  return next;
};

const inputStyle = { width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff' };

export default function FieldDetails({ values = {}, onChange, options = {}, readOnly = false, idPrefix = 'obs' }) {
  return (
    <div style={{ background: '#f8fafc', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0', marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#065f46' }} /> Field Details
      </div>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 20px 0' }}>
        Pre-filled from the survey&apos;s Crop Details — adjust for this location if it differs. These values appear in every report.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 20 }}>
        {FIELD_DETAILS.map(f => {
          const opts = (options[f.options] || []).filter(Boolean);
          const value = values[f.key] ?? '';
          return (
            <div key={f.key} className="form-group">
              <label className="p-label" style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                {f.label} {f.required && <span style={{ color: '#ef4444' }}>*</span>}
              </label>

              {f.type === 'select' && (
                <select
                  className="p-input"
                  style={inputStyle}
                  value={value}
                  onChange={e => onChange(f.key, e.target.value)}
                  disabled={readOnly}
                >
                  <option value="">— Select —</option>
                  {[...new Set([...opts, value].filter(Boolean))].map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              )}

              {f.type === 'datalist' && (
                <>
                  <input
                    className="p-input"
                    style={inputStyle}
                    list={`${idPrefix}-${f.key}-list`}
                    value={value}
                    onChange={e => onChange(f.key, e.target.value)}
                    disabled={readOnly}
                    placeholder={f.placeholder}
                  />
                  <datalist id={`${idPrefix}-${f.key}-list`}>
                    {opts.map(o => <option key={o} value={o} />)}
                  </datalist>
                </>
              )}

              {f.type === 'number' && (
                <input
                  className="p-input"
                  type="number"
                  step="0.0001"
                  style={inputStyle}
                  value={value}
                  onChange={e => onChange(f.key, e.target.value)}
                  disabled={readOnly}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
