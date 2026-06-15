const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { CROPS, ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: [true, 'Name is required'], trim: true },
  email:    { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  phone:    { type: String, required: [true, 'Phone is required'], trim: true },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  role:     { type: String, enum: ROLES, required: [true, 'Role is required'] },

  // For center_user: center info
  centerName:     { type: String, trim: true, default: '' },
  centerState:    { type: String, trim: true, default: '' },
  centerDistrict: { type: String, trim: true, default: '' },
  centerPI:       { type: String, trim: true, default: '' }, // Principal Investigator

  // Crops this center_user can enter data for
  assignedCrops: [{ type: String }],

  // Crops this crop_head reviews (receives alerts for)
  reviewCrops: [{ type: String }],

  isActive:      { type: Boolean, default: true },
  lastLogin:     { type: Date },
  passwordChangedAt: { type: Date },

  // Notification preferences
  notifyWhatsApp: { type: Boolean, default: true },
  notifyEmail:    { type: Boolean, default: true },

  // Profile
  designation: { type: String, trim: true, default: '' },
  profilePic:  { type: String, default: '' },

}, { timestamps: true });

// ── Hash password before save ──────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ── Instance methods ───────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// ── Virtual: all crops user can see ───────────────────────────────────────
userSchema.virtual('allCrops').get(function () {
  if (this.role === 'super_admin') return CROPS;
  return [...new Set([...(this.assignedCrops || []), ...(this.reviewCrops || [])])];
});

// ── Indexes ────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ reviewCrops: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
