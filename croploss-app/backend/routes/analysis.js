const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');
const { protect, authorize } = require('../middleware/auth');

// Apply auth middleware
router.use(protect);
router.use(authorize('super_admin'));

// @desc    Get analysis data
// @route   GET /api/analysis
// @access  Private/SuperAdmin
router.get('/', async (req, res) => {
  try {
    const { year, instituteName } = req.query;
    
    const query = {};
    if (year) query.year = year;
    if (instituteName) query.instituteName = instituteName;

    const data = await Analysis.find(query);
    
    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (err) {
    console.error('Error fetching analysis data:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Save/Update analysis data for a specific year and institute
// @route   POST /api/analysis
// @access  Private/SuperAdmin
router.post('/', async (req, res) => {
  try {
    const { 
      year, instituteName, stateDistrict, agroEcologicalZone, majorCrops,
      croppingSystem, soilType, weather, cropLosses
    } = req.body;

    if (!year || !instituteName) {
      return res.status(400).json({ success: false, message: 'Please provide year and instituteName' });
    }

    const payload = {
      stateDistrict,
      agroEcologicalZone,
      majorCrops,
      croppingSystem,
      soilType,
      weather,
      cropLosses
    };

    // Upsert the entry
    const updatedData = await Analysis.findOneAndUpdate(
      { year, instituteName },
      { $set: payload },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedData
    });
  } catch (err) {
    console.error('Error saving analysis data:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
