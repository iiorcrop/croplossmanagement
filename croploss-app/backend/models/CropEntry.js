const mongoose = require('mongoose');
const {
  CROPS, DISCIPLINES, SOIL_TYPES, PREVIOUS_CROPS, IRRIGATION_TYPES,
  SOWING_DATES, CROP_STAGES, PERCENT_OPTIONS, STATUS,
} = require('../config/constants');

// ── Single observation row (one row = one village/location) ────────────────
const observationSchema = new mongoose.Schema({
  // Location info
  location:  { type: String, required: true, trim: true },
  latitude:  { type: Number },
  longitude: { type: Number },

  // Field info (all dropdowns)
  soilType:         { type: String, enum: SOIL_TYPES, default: 'Black' },
  previousCrop:     { type: String, enum: PREVIOUS_CROPS, default: 'Castor' },
  variety:          { type: String, trim: true, default: '' },
  irrigatedRainfed: { type: String, enum: IRRIGATION_TYPES, default: 'Irrigated' },
  dateOfSowing:     { type: String, enum: SOWING_DATES },
  stageOfCrop:      { type: String, enum: ['', ...CROP_STAGES], default: '' },

  // ── Disease fields (dynamic strings like "1-10%", ">50%") ──────────────────
  wilt:          { type: mongoose.Schema.Types.Mixed, default: '-' },
  rootRot:       { type: mongoose.Schema.Types.Mixed, default: '-' },
  rust:          { type: mongoose.Schema.Types.Mixed, default: '-' },
  cls:           { type: mongoose.Schema.Types.Mixed, default: '-' },
  als:           { type: mongoose.Schema.Types.Mixed, default: '-' },
  downyMildew:   { type: mongoose.Schema.Types.Mixed, default: '-' },
  leafCurl:      { type: mongoose.Schema.Types.Mixed, default: '-' },
  stemRot:       { type: mongoose.Schema.Types.Mixed, default: '-' },
  powderyMildew: { type: mongoose.Schema.Types.Mixed, default: '-' },

  // ── Insect pest fields ───────────────────────────────────────────────────
  capsuleBorer: { type: mongoose.Schema.Types.Mixed, default: '-' },
  semiLooper:   { type: mongoose.Schema.Types.Mixed, default: '-' },
  jassids:      { type: mongoose.Schema.Types.Mixed, default: '-' },
  whitefly:     { type: mongoose.Schema.Types.Mixed, default: '-' },
  thrips:       { type: mongoose.Schema.Types.Mixed, default: '-' },
  aphids:       { type: mongoose.Schema.Types.Mixed, default: '-' },

  remarks: { type: String, default: '' },
  otherVariety: { type: String, default: '' },
  cropDamage: { type: mongoose.Schema.Types.Mixed, default: '-' },
  images: [{ type: String }],
}, { _id: true, strict: false });

// ── Workflow history log ────────────────────────────────────────────────────
const workflowEventSchema = new mongoose.Schema({
  fromStatus: String,
  toStatus:   String,
  actorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorName:  String,
  comments:   String,
  timestamp:  { type: Date, default: Date.now },
});

// ── Main crop entry schema ─────────────────────────────────────────────────
const cropEntrySchema = new mongoose.Schema({
  // Header
  crop:       { type: String, enum: CROPS, required: true },
  discipline: { type: String, enum: DISCIPLINES, required: true, default: 'Pathology' },
  season:     { type: String, required: true },
  year:       { type: Number, required: true },

  // Survey info
  state:      { type: String, required: true, trim: true },
  district:   { type: String, required: true, trim: true },
  taluka:     { type: String, trim: true, default: '' },
  surveyDate: { type: Date, required: true },
  surveyorName:   { type: String, trim: true, default: '' },
  surveyorDesig:  { type: String, trim: true, default: '' },

  // Center info (copied from user at time of entry)
  centerName:  { type: String, required: true, trim: true },
  centerState: { type: String, trim: true, default: '' },
  centerDistrict: { type: String, trim: true, default: '' },

  // Submitted by
  submittedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submittedByName: { type: String },

  // Observation rows
  observations: [observationSchema],

  // ── Workflow status ──────────────────────────────────────────────────────
  status: {
    type: String,
    enum: Object.values(STATUS),
    default: STATUS.DRAFT,
  },
  submittedAt:  { type: Date },
  reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedByName: { type: String },
  reviewedAt:   { type: Date },
  reviewComments: { type: String, default: '' },

  correctionRequested: { type: Boolean, default: false },
  correctionNote:      { type: String, default: '' },

  approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedByName: { type: String },
  approvedAt:   { type: Date },

  rejectedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt:   { type: Date },
  rejectionReason: { type: String, default: '' },

  // Workflow history
  workflowHistory: [workflowEventSchema],

  // ── Computed summary stats ───────────────────────────────────────────────
  totalLocations: { type: Number, default: 0 },
  avgWilt:        { type: Number, default: 0 },
  avgRootRot:     { type: Number, default: 0 },
  maxWilt:        { type: Number, default: 0 },
  maxRootRot:     { type: Number, default: 0 },

  // Version (increments on each correction/resubmit)
  version: { type: Number, default: 1 },

}, { timestamps: true });

// ── Pre-save: compute summary stats ───────────────────────────────────────
cropEntrySchema.pre('save', function (next) {
  if (this.observations && this.observations.length > 0) {
    const obs = this.observations;
    this.totalLocations = obs.length;

    // Only compute if discipline is Pathology or Both
    if (this.discipline !== 'Entomology') {
      const wilts   = obs.map(o => Number(o.wilt)    || 0);
      const roots   = obs.map(o => Number(o.rootRot) || 0);

      this.avgWilt    = +(wilts.reduce((a, b) => a + b, 0) / wilts.length).toFixed(2);
      this.avgRootRot = +(roots.reduce((a, b) => a + b, 0) / roots.length).toFixed(2);
      this.maxWilt    = Math.max(...wilts);
      this.maxRootRot = Math.max(...roots);
    } else {
      this.avgWilt = this.avgRootRot = this.maxWilt = this.maxRootRot = 0;
    }
  } else {
    this.totalLocations = 0;
    this.avgWilt = this.avgRootRot = this.maxWilt = this.maxRootRot = 0;
  }
  next();
});

// ── Indexes ────────────────────────────────────────────────────────────────
cropEntrySchema.index({ crop: 1, season: 1 });
cropEntrySchema.index({ discipline: 1 });
cropEntrySchema.index({ status: 1 });
cropEntrySchema.index({ submittedBy: 1 });
cropEntrySchema.index({ crop: 1, status: 1 });
cropEntrySchema.index({ year: 1, crop: 1 });

module.exports = mongoose.model('CropEntry', cropEntrySchema);
