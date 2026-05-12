const express = require('express');
const router = express.Router();
const CropEntry = require('../models/CropEntry');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { CROPS, SOIL_TYPES, PREVIOUS_CROPS, IRRIGATION_TYPES, SOWING_DATES,
  CROP_STAGES, PERCENT_OPTIONS, VARIETIES, RAW_COLUMNS, STATUS } = require('../config/constants');
const {
  notifyNewSubmission, notifyApproved, notifyCorrectionRequested,
  notifyRejected, notifyHighLoss, notifyResubmitted,
} = require('../utils/notifications');
const { generateExcelReport } = require('../utils/excelExport');

// ── Helpers ────────────────────────────────────────────────────────────────
async function getCropHeads(crop) {
  return User.find({ role: 'crop_head', reviewCrops: crop, isActive: true });
}
async function getAdmins() {
  return User.find({ role: 'super_admin', isActive: true });
}

function buildEntryFilter(user, query) {
  const { crop, status, season, year, district, center, search } = query;
  const filter = {};

  // Role-based data visibility
  if (user.role === 'center_user') {
    filter.submittedBy = user._id;
  } else if (user.role === 'crop_head') {
    filter.crop = { $in: user.reviewCrops };
    // Crop heads only see submitted+ entries (not drafts from others)
    if (!status) filter.status = { $in: ['submitted','under_review','needs_correction','approved','rejected'] };
  }
  // super_admin sees everything

  if (crop) filter.crop = crop;
  if (status) filter.status = status;
  if (season) filter.season = season;
  if (year) filter.year = parseInt(year);
  if (district) filter.district = { $regex: district, $options: 'i' };
  if (center) filter.centerName = { $regex: center, $options: 'i' };
  if (search) filter.$or = [
    { district: { $regex: search, $options: 'i' } },
    { centerName: { $regex: search, $options: 'i' } },
    { 'observations.location': { $regex: search, $options: 'i' } },
  ];
  return filter;
}

// GET /api/entries/dropdowns  – all dropdown options for the form
router.get('/dropdowns', protect, (req, res) => {
  res.json({
    success: true,
    data: { CROPS, SOIL_TYPES, PREVIOUS_CROPS, IRRIGATION_TYPES, SOWING_DATES, CROP_STAGES, PERCENT_OPTIONS, VARIETIES, COLUMNS: RAW_COLUMNS },
  });
});

// GET /api/entries/reports/summary  – aggregated summary
router.get('/reports/summary', protect, async (req, res, next) => {
  try {
    const { season, year } = req.query;
    const matchFilter = {};

    if (req.user.role === 'crop_head') matchFilter.crop = { $in: req.user.reviewCrops };
    if (season) matchFilter.season = season;
    if (year) matchFilter.year = parseInt(year);

    const cropSummary = await CropEntry.aggregate([
      { $match: matchFilter },
      { $group: {
        _id: { crop: '$crop', season: '$season' },
        total: { $sum: 1 },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $in: ['$status', ['submitted','under_review']] }, 1, 0] } },
        correction: { $sum: { $cond: [{ $eq: ['$status', 'needs_correction'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
        avgWilt: { $avg: '$avgWilt' },
        maxWilt: { $max: '$maxWilt' },
        avgRootRot: { $avg: '$avgRootRot' },
        totalLocations: { $sum: '$totalLocations' },
        centers: { $addToSet: '$centerName' },
      }},
      { $sort: { '_id.season': -1, '_id.crop': 1 } },
    ]);

    const statusBreakdown = await CropEntry.aggregate([
      { $match: req.user.role === 'crop_head' ? { crop: { $in: req.user.reviewCrops } } : {} },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Center-wise breakdown – totals by center name
    const centerSummary = await CropEntry.aggregate([
      { $match: { ...matchFilter, status: { $ne: 'draft' } } },
      { $group: {
        _id: '$centerName',
        total:      { $sum: 1 },
        approved:   { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        submitted:  { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
        pending:    { $sum: { $cond: [{ $in: ['$status', ['submitted','under_review']] }, 1, 0] } },
        correction: { $sum: { $cond: [{ $eq: ['$status', 'needs_correction'] }, 1, 0] } },
        rejected:   { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        avgWilt:    { $avg: '$avgWilt' },
      }},
      { $sort: { _id: 1 } },
    ]);

    const recentActivity = await CropEntry.find(
      req.user.role === 'center_user' ? { submittedBy: req.user._id } :
      req.user.role === 'crop_head' ? { crop: { $in: req.user.reviewCrops }, status: { $ne: 'draft' } } : {}
    )
      .populate('submittedBy', 'name')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('crop district centerName season status avgWilt maxWilt submittedAt updatedAt totalLocations');

    res.json({ success: true, data: { cropSummary, statusBreakdown, centerSummary, recentActivity } });
  } catch (err) { next(err); }
});

// GET /api/entries/reports/export  – Excel export
router.get('/reports/export', protect, async (req, res, next) => {
  try {
    const filter = buildEntryFilter(req.user, req.query);
    // IMPORTANT: do NOT exclude observations — we need them for the detailed sheet
    const entries = await CropEntry.find(filter)
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });

    const wb = await generateExcelReport(entries, req.query);
    const filename = `CropLoss_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

// GET /api/entries  – list with pagination
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, includeObs = 'false' } = req.query;
    const filter = buildEntryFilter(req.user, req.query);

    const total = await CropEntry.countDocuments(filter);
    let query = CropEntry.find(filter)
      .populate('submittedBy', 'name email centerName')
      .populate('reviewedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    if (includeObs !== 'true') {
      query = query.select('-observations');
    }

    const entries = await query
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: entries, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// GET /api/entries/:id  – single entry with full observations
router.get('/:id', protect, async (req, res, next) => {
  try {
    const entry = await CropEntry.findById(req.params.id)
      .populate('submittedBy', 'name email phone centerName')
      .populate('reviewedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });

    // Access control
    if (req.user.role === 'center_user' && entry.submittedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (req.user.role === 'crop_head' && !req.user.reviewCrops.includes(entry.crop)) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this crop.' });
    }

    res.json({ success: true, data: entry });
  } catch (err) { next(err); }
});

// POST /api/entries  – create draft
router.post('/', protect, authorize('center_user', 'super_admin'), async (req, res, next) => {
  try {
    const { crop } = req.body;

    // Check crop access for center users
    if (req.user.role === 'center_user' && !req.user.assignedCrops.includes(crop)) {
      return res.status(403).json({ success: false, message: `You are not assigned to crop: ${crop}` });
    }

    const entry = await CropEntry.create({
      ...req.body,
      submittedBy: req.user._id,
      submittedByName: req.user.name,
      centerName: req.user.centerName || req.body.centerName || '',
      centerState: req.user.centerState || req.body.centerState || '',
      centerDistrict: req.user.centerDistrict || req.body.centerDistrict || '',
      status: STATUS.DRAFT,
    });

    res.status(201).json({ success: true, data: entry, message: 'Draft saved.' });
  } catch (err) { next(err); }
});

// PUT /api/entries/:id  – update draft or needs_correction
router.put('/:id', protect, authorize('center_user', 'super_admin'), async (req, res, next) => {
  try {
    const entry = await CropEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });

    if (req.user.role === 'center_user' && entry.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (!['draft', 'needs_correction'].includes(entry.status)) {
      return res.status(400).json({ success: false, message: `Cannot edit entry with status: ${entry.status}` });
    }

    const allowedFields = ['observations', 'district', 'taluka', 'surveyDate', 'season', 'year', 'surveyorName', 'surveyorDesig'];
    allowedFields.forEach(f => { if (req.body[f] !== undefined) entry[f] = req.body[f]; });

    await entry.save();
    res.json({ success: true, data: entry, message: 'Entry updated.' });
  } catch (err) { next(err); }
});

// POST /api/entries/:id/submit  – submit for review
router.post('/:id/submit', protect, authorize('center_user', 'super_admin'), async (req, res, next) => {
  try {
    const entry = await CropEntry.findById(req.params.id).populate('submittedBy', 'name email phone notifyWhatsApp notifyEmail');
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });

    if (!['draft', 'needs_correction'].includes(entry.status)) {
      return res.status(400).json({ success: false, message: 'Only draft or correction-pending entries can be submitted.' });
    }
    if (!entry.observations || entry.observations.length === 0) {
      return res.status(400).json({ success: false, message: 'Add at least one observation row before submitting.' });
    }

    const wasCorrection = entry.status === STATUS.NEEDS_CORRECTION;
    entry.status = STATUS.SUBMITTED;
    entry.submittedAt = new Date();
    entry.correctionRequested = false;
    if (wasCorrection) entry.version = (entry.version || 1) + 1;

    entry.workflowHistory.push({
      fromStatus: wasCorrection ? STATUS.NEEDS_CORRECTION : STATUS.DRAFT,
      toStatus: STATUS.SUBMITTED,
      actorId: req.user._id,
      actorName: req.user.name,
      comments: wasCorrection ? 'Resubmitted after correction' : 'Initial submission',
    });

    await entry.save();

    // Notifications
    const cropHeads = await getCropHeads(entry.crop);
    if (wasCorrection) {
      await notifyResubmitted({ entry, submitter: entry.submittedBy, cropHeads });
    } else {
      await notifyNewSubmission({ entry, submitter: entry.submittedBy, cropHeads });
    }

    // High loss alert
    const threshold = parseInt(process.env.HIGH_LOSS_THRESHOLD_WILT || 50);
    if (entry.maxWilt >= threshold) {
      const admins = await getAdmins();
      await notifyHighLoss({ entry, admins, cropHeads });
    }

    res.json({ success: true, data: entry, message: `Entry submitted. ${cropHeads.length} crop head(s) notified.` });
  } catch (err) { next(err); }
});

// POST /api/entries/:id/start-review  – crop head picks up entry
router.post('/:id/start-review', protect, authorize('crop_head', 'super_admin'), async (req, res, next) => {
  try {
    const entry = await CropEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });
    if (req.user.role === 'crop_head' && !req.user.reviewCrops.includes(entry.crop)) {
      return res.status(403).json({ success: false, message: 'Not your assigned crop.' });
    }
    if (entry.status !== STATUS.SUBMITTED) {
      return res.status(400).json({ success: false, message: 'Entry is not in submitted state.' });
    }
    entry.status = STATUS.UNDER_REVIEW;
    entry.reviewedBy = req.user._id;
    entry.reviewedByName = req.user.name;
    entry.reviewedAt = new Date();
    entry.workflowHistory.push({ fromStatus: STATUS.SUBMITTED, toStatus: STATUS.UNDER_REVIEW, actorId: req.user._id, actorName: req.user.name });
    await entry.save();
    res.json({ success: true, data: entry, message: 'Review started.' });
  } catch (err) { next(err); }
});

// POST /api/entries/:id/approve
router.post('/:id/approve', protect, authorize('crop_head', 'super_admin'), async (req, res, next) => {
  try {
    const entry = await CropEntry.findById(req.params.id).populate('submittedBy', 'name email phone notifyWhatsApp notifyEmail');
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });
    if (req.user.role === 'crop_head' && !req.user.reviewCrops.includes(entry.crop)) {
      return res.status(403).json({ success: false, message: 'Not your assigned crop.' });
    }
    if (!['submitted','under_review'].includes(entry.status)) {
      return res.status(400).json({ success: false, message: 'Entry must be submitted or under review to approve.' });
    }

    entry.status = STATUS.APPROVED;
    entry.approvedBy = req.user._id;
    entry.approvedByName = req.user.name;
    entry.approvedAt = new Date();
    entry.reviewComments = req.body.comments || '';
    entry.workflowHistory.push({ fromStatus: entry.status, toStatus: STATUS.APPROVED, actorId: req.user._id, actorName: req.user.name, comments: req.body.comments });

    await entry.save();
    await notifyApproved({ entry, submitter: entry.submittedBy, approver: req.user });

    res.json({ success: true, data: entry, message: 'Entry approved. Center user notified.' });
  } catch (err) { next(err); }
});

// POST /api/entries/:id/request-correction
router.post('/:id/request-correction', protect, authorize('crop_head', 'super_admin'), async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ success: false, message: 'Correction note is required.' });

    const entry = await CropEntry.findById(req.params.id).populate('submittedBy', 'name email phone notifyWhatsApp notifyEmail');
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });
    if (req.user.role === 'crop_head' && !req.user.reviewCrops.includes(entry.crop)) {
      return res.status(403).json({ success: false, message: 'Not your assigned crop.' });
    }

    const prevStatus = entry.status;
    entry.status = STATUS.NEEDS_CORRECTION;
    entry.correctionRequested = true;
    entry.correctionNote = note;
    entry.workflowHistory.push({ fromStatus: prevStatus, toStatus: STATUS.NEEDS_CORRECTION, actorId: req.user._id, actorName: req.user.name, comments: note });

    await entry.save();
    await notifyCorrectionRequested({ entry, submitter: entry.submittedBy, reviewer: req.user, note });

    res.json({ success: true, data: entry, message: 'Correction requested. Center user notified via WhatsApp and email.' });
  } catch (err) { next(err); }
});

// POST /api/entries/:id/reject
router.post('/:id/reject', protect, authorize('crop_head', 'super_admin'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required.' });

    const entry = await CropEntry.findById(req.params.id).populate('submittedBy', 'name email phone notifyWhatsApp notifyEmail');
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });

    const prevStatus = entry.status;
    entry.status = STATUS.REJECTED;
    entry.rejectedBy = req.user._id;
    entry.rejectedAt = new Date();
    entry.rejectionReason = reason;
    entry.reviewComments = reason;
    entry.workflowHistory.push({ fromStatus: prevStatus, toStatus: STATUS.REJECTED, actorId: req.user._id, actorName: req.user.name, comments: reason });

    await entry.save();
    await notifyRejected({ entry, submitter: entry.submittedBy, reviewer: req.user, reason });

    res.json({ success: true, data: entry, message: 'Entry rejected. Center user notified.' });
  } catch (err) { next(err); }
});

// DELETE /api/entries/:id  – only drafts can be deleted
router.delete('/:id', protect, authorize('center_user', 'super_admin'), async (req, res, next) => {
  try {
    const entry = await CropEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });
    if (entry.status !== STATUS.DRAFT) return res.status(400).json({ success: false, message: 'Only draft entries can be deleted.' });
    if (req.user.role === 'center_user' && entry.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    await CropEntry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Draft deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
