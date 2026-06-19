const mongoose = require('mongoose');

const MspSchema = new mongoose.Schema({
  year: {
    type: String,
    required: true,
    unique: true
  },
  castor: { type: Number, default: 0 },
  sunflower: { type: Number, default: 0 },
  safflower: { type: Number, default: 0 },
  sesame: { type: Number, default: 0 },
  niger: { type: Number, default: 0 },
  linseed: { type: Number, default: 0 },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Msp', MspSchema);
