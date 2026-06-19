const mongoose = require('mongoose');

const masterDataSchema = new mongoose.Schema({
  crops: [{ type: mongoose.Schema.Types.Mixed }],
  seasons: [{ type: mongoose.Schema.Types.Mixed }],
  disciplines: [{ type: mongoose.Schema.Types.Mixed }],
  soilTypes: [{ type: mongoose.Schema.Types.Mixed }],
  previousCrops: [{ type: mongoose.Schema.Types.Mixed }],
  irrigationTypes: [{ type: mongoose.Schema.Types.Mixed }],
  sowingDates: [{ type: mongoose.Schema.Types.Mixed }],
  cropStages: [{ type: mongoose.Schema.Types.Mixed }],
  percentOptions: [{ type: mongoose.Schema.Types.Mixed }],
  varieties: { type: mongoose.Schema.Types.Mixed },
  agroEcologicalZones: [{ type: mongoose.Schema.Types.Mixed }],
  analysisMajorCrops: [{ type: mongoose.Schema.Types.Mixed }],
  analysisCroppingSystems: [{ type: mongoose.Schema.Types.Mixed }],
  analysisSoilTypes: [{ type: mongoose.Schema.Types.Mixed }],
  centers: [{ type: mongoose.Schema.Types.Mixed }],
  states: [{ type: mongoose.Schema.Types.Mixed }],
  locations: [{ type: mongoose.Schema.Types.Mixed }],
  cultivars: [{ type: mongoose.Schema.Types.Mixed }],
  zonesList: [{ type: mongoose.Schema.Types.Mixed }],
  years: [{ type: mongoose.Schema.Types.Mixed }],
  pests: [{ type: mongoose.Schema.Types.Mixed }],
  diseases: [{ type: mongoose.Schema.Types.Mixed }],
}, { timestamps: true });

module.exports = mongoose.model('MasterData', masterDataSchema);
