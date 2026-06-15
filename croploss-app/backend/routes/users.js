const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const MasterData = require('../models/MasterData');

const adminOnly = [protect, authorize('super_admin')];

// GET /api/users  – list all (with filters)
router.get('/', ...adminOnly, async (req, res, next) => {
  try {
    const { role, crop, status, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (crop) filter.$or = [{ assignedCrops: crop }, { reviewCrops: crop }];
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { centerName: { $regex: search, $options: 'i' } },
    ];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Summary stats
    const stats = {
      total: await User.countDocuments(),
      superAdmins: await User.countDocuments({ role: 'super_admin' }),
      cropHeads: await User.countDocuments({ role: 'crop_head' }),
      centerUsers: await User.countDocuments({ role: 'center_user' }),
      active: await User.countDocuments({ isActive: true }),
    };

    res.json({ success: true, data: users, total, stats, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// POST /api/users  – create user
router.post('/', ...adminOnly, async (req, res, next) => {
  try {
    const { name, email, phone, password, role, assignedCrops, reviewCrops,
      centerName, centerState, centerDistrict, centerPI,
      notifyWhatsApp, notifyEmail, designation } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, password, and role are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });

    if (role === 'crop_head' && (!reviewCrops || reviewCrops.length === 0)) {
      return res.status(400).json({ success: false, message: 'Crop Head must have at least one assigned review crop.' });
    }
    if (role === 'center_user' && (!assignedCrops || assignedCrops.length === 0)) {
      return res.status(400).json({ success: false, message: 'Center User must have at least one assigned crop.' });
    }

    const md = await MasterData.findOne();
    const allCrops = md ? md.crops : [];

    const user = await User.create({
      name, email, phone, password, role, designation: designation || '',
      assignedCrops: role === 'super_admin' ? allCrops : (assignedCrops || []),
      reviewCrops: role === 'crop_head' ? reviewCrops : (role === 'super_admin' ? allCrops : []),
      centerName: centerName || '',
      centerState: centerState || '',
      centerDistrict: centerDistrict || '',
      centerPI: centerPI || '',
      notifyWhatsApp: notifyWhatsApp !== false,
      notifyEmail: notifyEmail !== false,
    });

    res.status(201).json({ success: true, data: user.toSafeObject(), message: 'User created successfully.' });
  } catch (err) { next(err); }
});

// GET /api/users/stats  – stats for dashboard
router.get('/stats', ...adminOnly, async (req, res, next) => {
  try {
    const stats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }
    ]);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// GET /api/users/crop-heads/:crop  – get crop heads for a specific crop
router.get('/crop-heads/:crop', protect, async (req, res, next) => {
  try {
    const heads = await User.find({
      role: 'crop_head',
      reviewCrops: req.params.crop,
      isActive: true,
    }).select('-password');
    res.json({ success: true, data: heads });
  } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/:id', ...adminOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PUT /api/users/:id  – update user
router.put('/:id', ...adminOnly, async (req, res, next) => {
  try {
    const { name, phone, role, assignedCrops, reviewCrops, centerName, centerState,
      centerDistrict, centerPI, isActive, notifyWhatsApp, notifyEmail, designation, password } = req.body;

    const md = await MasterData.findOne();
    const allCrops = md ? md.crops : [];

    const updates = {
      name, phone, role, centerName, centerState, centerDistrict, centerPI,
      isActive, notifyWhatsApp, notifyEmail, designation,
      assignedCrops: role === 'super_admin' ? allCrops : (assignedCrops || []),
      reviewCrops: role === 'crop_head' ? reviewCrops : (role === 'super_admin' ? allCrops : []),
    };

    // Remove undefined
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    if (password) updates.password = await bcrypt.hash(password, 12);

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, data: user, message: 'User updated successfully.' });
  } catch (err) { next(err); }
});

// DELETE /api/users/:id  – deactivate (soft delete)
router.delete('/:id', ...adminOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'super_admin') return res.status(400).json({ success: false, message: 'Cannot deactivate Super Admin.' });
    user.isActive = false;
    await user.save();
    res.json({ success: true, message: 'User deactivated.' });
  } catch (err) { next(err); }
});

module.exports = router;
