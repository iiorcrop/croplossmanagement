const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  state: { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  taluka: { type: String, required: true, index: true },
  village: { type: String, required: true, index: true },
  lgdCode: { type: String, default: '' },
}, { timestamps: true });

// Composite indexes for fast hierarchical queries
locationSchema.index({ state: 1, district: 1 });
locationSchema.index({ state: 1, district: 1, taluka: 1 });
locationSchema.index({ state: 1, district: 1, taluka: 1, village: 1 }, { unique: true });

module.exports = mongoose.model('Location', locationSchema);
