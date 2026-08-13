import React from 'react';
import { STATUS_LABELS, STATUS_BADGE_CLASS, ROLE_LABELS, ROLE_BADGE_CLASS, CROP_EMOJI, CROP_LABEL, AV_COLORS, wiltColor } from '../../utils/constants';

// ── Status Badge ─────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_BADGE_CLASS[status] || 'badge-draft'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ── Role Badge ────────────────────────────────────────────────────────────
export function RoleBadge({ role }) {
  return (
    <span className={`badge ${ROLE_BADGE_CLASS[role] || 'badge-draft'}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────
export function KpiCard({ number, label, icon, color = 'green' }) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-number">{number}</div>
      <div className="kpi-label">{label}</div>
      {icon && <div className="kpi-icon">{icon}</div>}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ size = 32, text = 'Loading…' }) {
  return (
    <div className="spinner" style={{ padding: 40 }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner-ring" style={{ width: size, height: size, margin: '0 auto 10px' }} />
        {text && <div style={{ fontSize: 12, color: 'var(--gray)' }}>{text}</div>}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────
export function EmptyState({ emoji = '📭', title = 'No data found', subtitle = '' }) {
  return (
    <div className="table-empty">
      <div style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--gray)' }}>{subtitle}</div>}
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────
export function BarChart({ rows }) {
  if (!rows || !rows.length) return <div style={{ color: 'var(--gray)', fontSize: 13, padding: '10px 0' }}>No data</div>;
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <div className="bar-chart">
      {rows.map((r, i) => (
        <div className="bar-row" key={i}>
          <span className="bar-label" title={r.label}>{r.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${Math.round((r.value / max) * 100)}%`, background: r.color || 'var(--g7)' }}>
              {r.value > 0 ? r.value : ''}
            </div>
          </div>
          <span className="bar-value">{typeof r.display !== 'undefined' ? r.display : r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────
export function Avatar({ name = '', index = 0, size = 30 }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const color = AV_COLORS[index % AV_COLORS.length];
  return (
    <div className="avatar" style={{ width: size, height: size, background: color, color: '#fff', fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

// ── Wilt Display ──────────────────────────────────────────────────────────
export function WiltValue({ value = 0, bold = true }) {
  const v = parseFloat(value) || 0;
  return (
    <span style={{ color: wiltColor(v), fontWeight: bold ? 700 : 400 }}>
      {v.toFixed(2)}%
    </span>
  );
}

// ── Crop Tag ──────────────────────────────────────────────────────────────
export function CropTag({ crop }) {
  return (
    <span style={{
      display: 'inline-block', background: 'var(--g1)', color: 'var(--g8)',
      borderRadius: 12, padding: '1px 7px', fontSize: 10.5, fontWeight: 600, margin: 1,
    }}>
      {CROP_EMOJI[crop]} {CROP_LABEL(crop)}
    </span>
  );
}

// ── Alert Box ─────────────────────────────────────────────────────────────
export function Alert({ type = 'info', icon, children }) {
  return (
    <div className={`alert alert-${type}`}>
      {icon && <span>{icon}</span>}
      <div>{children}</div>
    </div>
  );
}

// ── Modal Wrapper ─────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, maxWidth = 640 }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth }}>
        <div className="modal-title">
          <span>{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Workflow Stepper ──────────────────────────────────────────────────────
export function WorkflowStepper({ status }) {
  const steps = [
    { label: 'Draft', key: 'draft' },
    { label: 'Submitted', key: 'submitted' },
    { label: 'Under Review', key: 'under_review' },
    { label: 'Approved', key: 'approved' },
  ];
  const orderMap = { draft: 0, submitted: 1, under_review: 2, needs_correction: 1, approved: 3, rejected: 2 };
  const cur = orderMap[status] ?? 0;
  const isRejected = status === 'rejected';
  const isCorrection = status === 'needs_correction';

  return (
    <div className="wf-stepper">
      {steps.map((s, i) => {
        const done = i < cur;
        const active = i === cur;
        const isErr = isRejected && i === 2;
        const isCor = isCorrection && i === 1;
        let cls = 'wf-step';
        if (done) cls += ' wf-done';
        if (active && !isErr && !isCor) cls += ' wf-active';
        if (isErr) cls += ' wf-error';
        if (isCor) cls += ' wf-active';
        return (
          <React.Fragment key={s.key}>
            {i > 0 && <div className={`wf-line ${done ? 'wf-line-done' : ''}`} />}
            <div className={cls}>
              <div className="wf-circle">
                {done ? '✓' : isErr ? '✕' : i + 1}
              </div>
              <div className="wf-label">{s.label}</div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Date Formatter ────────────────────────────────────────────────────────
export function fmtDate(d) {
  if (!d) return '–';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(d); }
}

export function fmtDateTime(d) {
  if (!d) return '–';
  try { return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return String(d); }
}
