import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { entriesAPI } from '../utils/api';
import {
  StatusBadge, WorkflowStepper, Alert, Modal, WiltValue, fmtDate, fmtDateTime, Spinner, CropTag
} from '../components/common';
import ObservationTable from '../components/common/ObservationTable';
import CastorEntomologyForm from '../components/castor/CastorEntomologyForm';
import SunflowerEntomologyForm from '../components/sunflower/SunflowerEntomologyForm';
import SunflowerPathologyForm from '../components/sunflower/SunflowerPathologyForm';
import { CROP_EMOJI, CROP_LABEL } from '../utils/constants';

import { generateEntryPDF } from '../utils/pdfExport';

export default function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isCropHead, isCenter, canReview } = useAuth();

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState({ open: false, action: null });
  const [reviewNote, setReviewNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await entriesAPI.get(id);
      setEntry(res.data.data);
    } catch {
      toast.error('Entry not found');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleExportPDF = () => {
    setExportingPDF(true);
    try {
      generateEntryPDF(entry);
      toast.success('PDF report generated');
    } catch (err) {
      toast.error('PDF export failed');
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading) return <Spinner text="Loading entry…" />;
  if (!entry) return null;

  const canEdit = ['draft','needs_correction'].includes(entry.status) && (isAdmin || entry.submittedBy?._id === user?._id);
  const canDoReview = canReview && ['submitted','under_review'].includes(entry.status) &&
    (isAdmin || user?.reviewCrops?.includes(entry.crop));

  const openReview = (action) => {
    setReviewNote('');
    setReviewModal({ open: true, action });
  };

  const confirmReview = async () => {
    if (reviewModal.action !== 'approve' && !reviewNote.trim()) {
      toast.error('Please enter a note'); return;
    }
    setActionLoading(true);
    try {
      let res;
      if (reviewModal.action === 'approve') {
        res = await entriesAPI.approve(id, { comments: reviewNote });
      } else if (reviewModal.action === 'correction') {
        res = await entriesAPI.requestCorrection(id, { note: reviewNote });
      } else if (reviewModal.action === 'reject') {
        res = await entriesAPI.reject(id, { reason: reviewNote });
      }
      toast.success(res.data.message);
      setReviewModal({ open: false, action: null });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartReview = async () => {
    try {
      await entriesAPI.startReview(id);
      load();
      toast.success('Review started');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await entriesAPI.submit(id);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
  };

  const reviewConfig = {
    approve: { title: 'Approve Survey', label: 'Comments (optional)', btnClass: 'btn-primary', btnText: '✅ Confirm Approve' },
    correction: { title: 'Request Correction', label: 'Correction note (required — sent to center user via WhatsApp)', btnClass: 'btn-amber', btnText: '🔄 Request Correction' },
    reject: { title: 'Reject Survey', label: 'Reason for rejection (required)', btnClass: 'btn-danger', btnText: '❌ Confirm Reject' },
  };
  const rc = reviewConfig[reviewModal.action] || {};

  const obs = entry.observations || [];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>
            {CROP_EMOJI[entry.crop]} {CROP_LABEL(entry.crop)} Survey
            &nbsp;– {entry.district}
          </h2>
          <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 3 }}>
            {entry.season} · {entry.centerName} · <StatusBadge status={entry.status} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>← Back</button>
          {entry.status !== 'draft' && (
            <button className="btn btn-outline btn-sm" onClick={handleExportPDF} disabled={exportingPDF}>
              {exportingPDF ? 'Exporting…' : '📄 PDF Report'}
            </button>
          )}
          {canEdit && (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/entry/edit/${id}`)}>✏️ Edit</button>
              {obs.length > 0 && (
                <button className="btn btn-primary btn-sm" onClick={handleSubmit}>📤 Submit</button>
              )}
            </>
          )}
          {canDoReview && entry.status === 'submitted' && (
            <button className="btn btn-teal btn-sm" onClick={handleStartReview}>🔍 Start Review</button>
          )}
          {canDoReview && (
            <>
              <button className="btn btn-amber btn-sm" onClick={() => openReview('correction')}>🔄 Request Correction</button>
              <button className="btn btn-danger btn-sm" onClick={() => openReview('reject')}>❌ Reject</button>
              <button className="btn btn-primary btn-sm" onClick={() => openReview('approve')}>✅ Approve</button>
            </>
          )}
        </div>
      </div>

      {/* Workflow stepper */}
      <div className="card" style={{ marginBottom: 14 }}>
        <WorkflowStepper status={entry.status} />
      </div>

      {/* Status alerts */}
      {entry.status === 'needs_correction' && entry.correctionNote && (
        <Alert type="correction" icon="🔄">
          <strong>Correction Required by {entry.reviewedBy?.name}:</strong><br />{entry.correctionNote}
        </Alert>
      )}
      {entry.status === 'rejected' && (
        <Alert type="danger" icon="❌">
          <strong>Rejected by {entry.rejectedBy?.name}:</strong> {entry.rejectionReason || entry.reviewComments}
        </Alert>
      )}
      {entry.status === 'approved' && (
        <Alert type="success" icon="✅">
          <strong>Approved</strong> by {entry.approvedBy?.name} on {fmtDateTime(entry.approvedAt)}
          {entry.reviewComments && <> — "{entry.reviewComments}"</>}
        </Alert>
      )}

      {/* Summary grid */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header"><span className="card-title">Survey Summary</span></div>
        <div className="entry-summary-grid">
          {[
            ['Crop', <CropTag crop={entry.crop} />],
            ['Season', entry.season],
            ['District / Taluka', `${entry.district}${entry.taluka ? ', ' + entry.taluka : ''}`],
            ['Survey Date', fmtDate(entry.surveyDate)],
            ['Center', entry.centerName || '–'],
            ['State', entry.centerState || '–'],
            ['Submitted By', entry.submittedBy?.name || entry.submittedByName || '–'],
            ['Submitted At', fmtDateTime(entry.submittedAt)],
            ['Surveyor', entry.surveyorName || '–'],
          ].map(([label, val]) => (
            <div className="entry-summary-box" key={label}>
              <div className="entry-summary-label">{label}</div>
              <div className="entry-summary-value">{val}</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 10 }}>
          {[
            ['Total Locations', entry.totalLocations || 0],
            ['Avg Wilt %', <WiltValue value={entry.avgWilt} />],
            ['Max Wilt %', <WiltValue value={entry.maxWilt} />],
            ['Avg Root Rot %', <WiltValue value={entry.avgRootRot} />],
          ].map(([label, val]) => (
            <div key={label} style={{ background: 'var(--g0)', borderRadius: 7, padding: '10px 12px' }}>
              <div style={{ fontSize: 10.5, color: 'var(--gray)' }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Observation Table */}
      <div className="form-section">
        <div className="form-section-title">
          📍 Observation Records ({obs.length} locations)
        </div>
        {obs.length > 0 ? (
          entry.crop === 'castor' && entry.discipline === 'Entomology' ? (
            <CastorEntomologyForm rows={obs} onChange={() => {}} readOnly={true} state={entry.state} district={entry.district} taluka={entry.taluka} />
          ) : entry.crop === 'sunflower' && entry.discipline === 'Entomology' ? (
            <SunflowerEntomologyForm rows={obs} onChange={() => {}} readOnly={true} state={entry.state} district={entry.district} taluka={entry.taluka} />
          ) : entry.crop === 'sunflower' && entry.discipline === 'Pathology' ? (
            <SunflowerPathologyForm rows={obs} onChange={() => {}} readOnly={true} state={entry.state} district={entry.district} taluka={entry.taluka} />
          ) : (
            <ObservationTable crop={entry.crop} discipline={entry.discipline} rows={obs} onChange={() => {}} readOnly={true} state={entry.state} district={entry.district} taluka={entry.taluka} />
          )
        ) : (
          <p style={{ color: 'var(--gray)', fontSize: 13, textAlign: 'center', padding: 20 }}>No observation records.</p>
        )}
      </div>

      {/* Workflow history */}
      {entry.workflowHistory?.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Workflow History</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entry.workflowHistory.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--gray-b)' }}>
                <div style={{ fontSize: 11, color: 'var(--gray)', whiteSpace: 'nowrap', marginTop: 2 }}>{fmtDateTime(ev.timestamp)}</div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                    <StatusBadge status={ev.fromStatus} /> → <StatusBadge status={ev.toStatus} />
                    &nbsp;by <strong>{ev.actorName}</strong>
                  </div>
                  {ev.comments && <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>"{ev.comments}"</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        open={reviewModal.open}
        onClose={() => setReviewModal({ open: false, action: null })}
        title={rc.title || ''}
        maxWidth={480}
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setReviewModal({ open: false, action: null })}>Cancel</button>
            <button className={`btn btn-sm ${rc.btnClass}`} onClick={confirmReview} disabled={actionLoading}>
              {actionLoading ? 'Processing…' : rc.btnText}
            </button>
          </>
        }
      >
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">{rc.label}</label>
          <textarea
            className="form-control"
            rows={4}
            value={reviewNote}
            onChange={e => setReviewNote(e.target.value)}
            placeholder="Enter your comments…"
            style={{ resize: 'vertical' }}
          />
        </div>
        {reviewModal.action === 'correction' && (
          <Alert type="warning" icon="⚠️">
            The center user will receive a <strong>WhatsApp message and email</strong> with your correction note.
          </Alert>
        )}
        {reviewModal.action === 'reject' && (
          <Alert type="danger" icon="⚠️">
            This will permanently reject the submission. The center user will be notified.
          </Alert>
        )}
      </Modal>
    </div>
  );
}
