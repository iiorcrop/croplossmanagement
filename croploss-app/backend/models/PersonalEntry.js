const mongoose = require('mongoose');

const personalEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous/unauthenticated if necessary, though it should be tied to token
  },
  // Use a flat, flexible schema to accept whatever the HTML standalone app sends
  // This matches { strict: false } behavior
}, { 
  timestamps: true,
  strict: false 
});

module.exports = mongoose.model('PersonalEntry', personalEntrySchema);
