const express = require('express');
const router = express.Router();
const Msp = require('../models/Msp');
const { protect, authorize } = require('../middleware/auth');

// Apply auth middleware
router.use(protect);
router.use(authorize('super_admin'));

// Get all MSP records
router.get('/', async (req, res) => {
  try {
    const records = await Msp.find().sort({ year: 1 });
    res.json({ success: true, data: records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bulk upsert MSP records
router.post('/bulk', async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Records must be an array' });
    }

    const bulkOps = records.map(record => ({
      updateOne: {
        filter: { year: record.year },
        update: { 
          $set: {
            castor: record.castor || 0,
            sunflower: record.sunflower || 0,
            safflower: record.safflower || 0,
            sesame: record.sesame || 0,
            niger: record.niger || 0,
            linseed: record.linseed || 0,
            lastUpdatedBy: req.user.id
          }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await Msp.bulkWrite(bulkOps);
    }

    res.json({ success: true, message: 'MSP records updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
