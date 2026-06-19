const express = require('express');
const router = express.Router();
const MasterData = require('../models/MasterData');
const { protect, authorize } = require('../middleware/auth');

// GET all master data (read)
router.get('/', protect, async (req, res, next) => {
  try {
    let data = await MasterData.findOne();
    if (!data) {
      // Initialize with defaults from constants if not present
      const { CROPS, SEASONS, DISCIPLINES, SOIL_TYPES, PREVIOUS_CROPS, IRRIGATION_TYPES, SOWING_DATES, CROP_STAGES, PERCENT_OPTIONS, VARIETIES } = require('../config/constants');
      data = await MasterData.create({
        crops: CROPS,
        seasons: SEASONS,
        disciplines: DISCIPLINES,
        soilTypes: SOIL_TYPES,
        previousCrops: PREVIOUS_CROPS,
        irrigationTypes: IRRIGATION_TYPES,
        sowingDates: SOWING_DATES,
        cropStages: CROP_STAGES,
        percentOptions: PERCENT_OPTIONS,
        varieties: VARIETIES,
      });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST replace entire master data
router.post('/', protect, authorize('super_admin'), async (req, res, next) => {
  try {
    const update = req.body; // expect full structure
    let data = await MasterData.findOneAndUpdate({}, update, { new: true, upsert: true, setDefaultsOnInsert: true });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// PUT update a specific list (e.g., crops, disciplines)
router.put('/:key', protect, authorize('super_admin'), async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body; // expect array
    const allowedKeys = ['crops','seasons','disciplines','soilTypes','previousCrops','irrigationTypes','sowingDates','cropStages','percentOptions','varieties','agroEcologicalZones','analysisMajorCrops','analysisCroppingSystems','analysisSoilTypes','centers','states','locations','years','pests','diseases'];
    if (!allowedKeys.includes(key)) return res.status(400).json({ success: false, message: 'Invalid master data key' });
    let data = await MasterData.findOneAndUpdate({ }, { [key]: value }, { new: true, upsert: true });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// DELETE a single entry from a list
router.delete('/:key/:value', protect, authorize('super_admin'), async (req, res, next) => {
  try {
    const { key, value } = req.params;
    const allowedKeys = ['crops','seasons','disciplines','soilTypes','previousCrops','irrigationTypes','sowingDates','cropStages','percentOptions','agroEcologicalZones','analysisMajorCrops','analysisCroppingSystems','analysisSoilTypes','centers','states','locations','years','pests','diseases'];
    if (!allowedKeys.includes(key)) return res.status(400).json({ success: false, message: 'Invalid master data key' });
    const update = { $pull: { [key]: value } };
    let data = await MasterData.findOneAndUpdate({}, update, { new: true });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST append a single value to a list (allow normal users)
router.post('/:key/append', protect, async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const allowedKeys = ['centers','states','locations','cultivars','agroEcologicalZones','zonesList','crops','seasons','years','pests','diseases'];
    if (!allowedKeys.includes(key)) return res.status(400).json({ success: false, message: 'Invalid append key' });
    let data = await MasterData.findOneAndUpdate({}, { $addToSet: { [key]: value } }, { new: true, upsert: true });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
