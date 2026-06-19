const express = require('express');
const router = express.Router();
const { INDIA_GEOGRAPHY } = require('../data/indiaGeoData');

// GET /api/locations/states
// Returns list of all states
router.get('/states', (req, res) => {
  try {
    const states = Object.keys(INDIA_GEOGRAPHY).sort();
    res.json({ success: true, data: states });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch states' });
  }
});

// GET /api/locations/districts/:state
// Returns list of districts for a given state (case-insensitive)
router.get('/districts/:state', (req, res) => {
  try {
    const { state } = req.params;
    // Find matching state key ignoring case
    const stateKey = Object.keys(INDIA_GEOGRAPHY).find(k => k.toLowerCase() === state.toLowerCase());
    if (!stateKey) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    const stateData = INDIA_GEOGRAPHY[stateKey];
    const districts = Object.keys(stateData).sort();
    res.json({ success: true, data: districts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch districts' });
  }
});

// GET /api/locations/talukas/:state/:district
// Returns list of talukas for a given district (case-insensitive)
router.get('/talukas/:state/:district', (req, res) => {
  try {
    const { state, district } = req.params;
    const stateKey = Object.keys(INDIA_GEOGRAPHY).find(k => k.toLowerCase() === state.toLowerCase());
    if (!stateKey) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    const stateData = INDIA_GEOGRAPHY[stateKey];
    const districtKey = Object.keys(stateData).find(k => k.toLowerCase() === district.toLowerCase());
    if (!districtKey) {
      return res.status(404).json({ success: false, message: 'District not found' });
    }
    const talukas = stateData[districtKey];
    res.json({ success: true, data: talukas.sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch talukas' });
  }
});

// GET /api/locations/villages/:state/:district/:taluka
// Returns list of villages for a given taluka
router.get('/villages/:state/:district/:taluka', (req, res) => {
  try {
    const { state, district, taluka } = req.params;
    
    // We are mocking a small subset of actual Govt data here (Huzurnagar / Suryapet)
    // To use full Govt data, a master CSV from data.gov.in should be parsed here.
    const govtVillages = {
      "Huzurnagar": ["Huzurnagar", "Karakkayala Gudem", "Burugadda", "Macharam", "Lingagiri", "Lakkavaram", "Amravaram", "Yepala Singaram"],
      "Suryapet": ["Suryapet City", "Imampet", "Kesaram", "Pinna Palem", "Yerkaram", "Kudakuda"],
      "Kodad": ["Kodad", "Ganapavaram", "Gudi Banda", "Kapugallu", "Redlakunta", "Togarrai"]
    };

    // Find matching taluka key ignoring case
    const talukaKey = Object.keys(govtVillages).find(k => k.toLowerCase() === taluka.toLowerCase());
    let villages = govtVillages[talukaKey || taluka];
    
    if (!villages) {
      // Fallback generator for other talukas until official CSV is loaded
      villages = [`${taluka} Hq`, `${taluka} East`, `${taluka} West`, `${taluka} Rural`];
    }
    
    res.json({ success: true, data: villages.sort() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch villages' });
  }
});

module.exports = router;
