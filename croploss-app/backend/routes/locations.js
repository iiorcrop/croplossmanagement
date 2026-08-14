const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { INDIA_GEOGRAPHY } = require('../data/indiaGeoData');

// Utility helper to normalize search queries
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/locations/states
// Returns list of all states dynamically from MongoDB, with fallback to static dataset
router.get('/states', async (req, res) => {
  try {
    let states = await Location.distinct('state');
    if (!states || states.length === 0) {
      states = Object.keys(INDIA_GEOGRAPHY);
    }
    states.sort((a, b) => a.localeCompare(b));
    res.json({ success: true, data: states });
  } catch (error) {
    console.error('Error fetching states:', error);
    const fallbackStates = Object.keys(INDIA_GEOGRAPHY).sort();
    res.json({ success: true, data: fallbackStates });
  }
});

// GET /api/locations/districts/:state
// Returns list of districts for a given state (case-insensitive)
router.get('/districts/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const regex = new RegExp(`^${escapeRegex(state)}$`, 'i');
    
    let districts = await Location.distinct('district', { state: regex });
    
    if (!districts || districts.length === 0) {
      const stateKey = Object.keys(INDIA_GEOGRAPHY).find(k => k.toLowerCase() === state.toLowerCase());
      if (stateKey) {
        districts = Object.keys(INDIA_GEOGRAPHY[stateKey]);
      }
    }
    
    districts.sort((a, b) => a.localeCompare(b));
    res.json({ success: true, data: districts });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch districts' });
  }
});

// GET /api/locations/talukas/:state/:district
// Returns list of talukas/sub-districts for a given district
router.get('/talukas/:state/:district', async (req, res) => {
  try {
    const { state, district } = req.params;
    const stateRegex = new RegExp(`^${escapeRegex(state)}$`, 'i');
    const distRegex = new RegExp(`^${escapeRegex(district)}$`, 'i');

    let talukas = await Location.distinct('taluka', { state: stateRegex, district: distRegex });

    if (!talukas || talukas.length === 0) {
      const stateKey = Object.keys(INDIA_GEOGRAPHY).find(k => k.toLowerCase() === state.toLowerCase());
      if (stateKey) {
        const stateData = INDIA_GEOGRAPHY[stateKey];
        const distKey = Object.keys(stateData).find(k => k.toLowerCase() === district.toLowerCase());
        if (distKey) {
          talukas = stateData[distKey];
        }
      }
    }

    // Default fallback if taluka list is empty
    if (!talukas || talukas.length === 0) {
      talukas = [district];
    }

    talukas.sort((a, b) => a.localeCompare(b));
    res.json({ success: true, data: talukas });
  } catch (error) {
    console.error('Error fetching talukas:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch talukas' });
  }
});

// GET /api/locations/villages/:state/:district/:taluka
// Returns list of villages for a given taluka with optional search filter
router.get('/villages/:state/:district/:taluka', async (req, res) => {
  try {
    const { state, district, taluka } = req.params;
    const { q } = req.query; // optional query string

    const query = {
      state: new RegExp(`^${escapeRegex(state)}$`, 'i'),
      district: new RegExp(`^${escapeRegex(district)}$`, 'i'),
      taluka: new RegExp(`^${escapeRegex(taluka)}$`, 'i'),
    };

    if (q) {
      query.village = new RegExp(escapeRegex(q), 'i');
    }

    let villages = await Location.distinct('village', query);

    // Default fallback generator if no village entries are found in DB
    if (!villages || villages.length === 0) {
      villages = [
        `${taluka} Town`,
        `${taluka} Village 1`,
        `${taluka} Village 2`,
        `${taluka} Rural`,
        `${taluka} Colony`
      ];
    }

    villages.sort((a, b) => a.localeCompare(b));
    res.json({ success: true, data: villages });
  } catch (error) {
    console.error('Error fetching villages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch villages' });
  }
});

// POST /api/locations/add-village
// Dynamically add a user-created village to the database
router.post('/add-village', async (req, res) => {
  try {
    const { state, district, taluka, village } = req.body;
    if (!state || !district || !taluka || !village) {
      return res.status(400).json({ success: false, message: 'State, district, taluka, and village are required' });
    }

    const doc = await Location.findOneAndUpdate(
      { state, district, taluka, village },
      { $setOnInsert: { state, district, taluka, village } },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Error adding new village:', error);
    res.status(500).json({ success: false, message: 'Failed to add village' });
  }
});

module.exports = router;

