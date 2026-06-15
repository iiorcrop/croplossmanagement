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
}, { timestamps: true });

module.exports = mongoose.model('MasterData', masterDataSchema);
