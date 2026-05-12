const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');

// GET /api/settings/:key
router.get('/:key', protect, authorize('super_admin'), async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ key: req.params.key });
    res.json({
      success: true,
      data: settings ? settings.value : null
    });
  } catch (err) { next(err); }
});

// POST /api/settings/:key
router.post('/:key', protect, authorize('super_admin'), async (req, res, next) => {
  try {
    const { value } = req.body;
    let settings = await Settings.findOne({ key: req.params.key });
    
    if (settings) {
      settings.value = value;
      await settings.save();
    } else {
      settings = await Settings.create({ key: req.params.key, value });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings.value
    });
  } catch (err) { next(err); }
});

module.exports = router;
