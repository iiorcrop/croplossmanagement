const mongoose = require('mongoose');

// Schema for storing the final aggregated report that the Super Admin manually enters.
// One document per fiscal year (e.g., "2021-22").
// Each document contains an array of crop-specific data with loss percentages and monetary values.
const finalReportSchema = new mongoose.Schema(
  {
    year: { type: String, required: true, unique: true }, // fiscal year string e.g., "2021-22"
    cropData: [
      {
        cropName: { type: String, required: true },
        insectLoss: {
          min: { type: Number, default: 0 },
          avg: { type: Number, default: 0 },
          max: { type: Number, default: 0 },
        },
        diseaseLoss: {
          min: { type: Number, default: 0 },
          avg: { type: Number, default: 0 },
          max: { type: Number, default: 0 },
        },
        avgMsp: { type: Number, default: 0 }, // Rs per tonne
        avgYield: { type: Number, default: 0 }, // Lakh Tonnes
        // Monetary fields are derived on the fly, but we store them for quick retrieval if needed
        valueCrores: { type: Number, default: 0 },
        insectMonetaryLoss: { type: Number, default: 0 },
        diseaseMonetaryLoss: { type: Number, default: 0 },
        totalMonetaryLoss: { type: Number, default: 0 },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FinalReport', finalReportSchema);
