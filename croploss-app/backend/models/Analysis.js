const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  year: {
    type: String,
    required: true,
    index: true
  },
  instituteName: {
    type: String,
    required: true,
    index: true
  },
  stateDistrict: { type: String, default: '' },
  agroEcologicalZone: { type: String, default: '' },
  majorCrops: { type: String, default: '' },
  croppingSystem: { type: String, default: '' },
  soilType: { type: String, default: '' },
  weather: {
    tempMaxMin: { type: String, default: '' },
    rhMorningEvening: { type: String, default: '' },
    rainfall: { type: String, default: '' }
  },
  cropLosses: [{
    crop: { type: String, default: '' },
    cultivars: { type: String, default: '' },
    areaAffected: { type: String, default: '' },
    location: { type: String, default: '' },
    insectPests: { type: String, default: '' },
    diseases: { type: String, default: '' },
    nematodes: { type: String, default: '' },
    weeds: { type: String, default: '' },
    mites: { type: String, default: '' },
    rodents: { type: String, default: '' },
    monetaryLoss: { type: String, default: '' },
    mgtPractices: { type: String, default: '' }
  }]
}, { timestamps: true });

// Ensure unique entry per year and institute
analysisSchema.index({ year: 1, instituteName: 1 }, { unique: true });

module.exports = mongoose.model('Analysis', analysisSchema);
