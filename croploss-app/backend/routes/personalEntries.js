const express = require('express');
const router = express.Router();
const PersonalEntry = require('../models/PersonalEntry');
const { protect } = require('../middleware/auth');

// Optional protect middleware: if token exists, set req.user, else move on.
const optionalProtect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

// GET /api/personal-entries  – get all entries for user
router.get('/', optionalProtect, async (req, res, next) => {
  try {
    const filter = {};
    if (req.user) {
      filter.user = req.user._id;
    }
    const entries = await PersonalEntry.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: entries });
  } catch (err) { next(err); }
});

// POST /api/personal-entries/bulk  – replace all entries or sync
router.post('/bulk', optionalProtect, async (req, res, next) => {
  try {
    const { entries } = req.body; // Expecting an array of entries
    if (!Array.isArray(entries)) {
      return res.status(400).json({ success: false, message: 'Entries must be an array' });
    }

    // Attach user to each entry if logged in
    const entriesWithUser = entries.map(e => {
      const entryData = { ...e };
      if (req.user) entryData.user = req.user._id;
      return entryData;
    });

    // Delete existing entries for this user
    const filter = {};
    if (req.user) filter.user = req.user._id;
    await PersonalEntry.deleteMany(filter);

    const inserted = await PersonalEntry.insertMany(entriesWithUser);
    res.json({ success: true, data: inserted, message: 'Bulk synced successfully' });
  } catch (err) { next(err); }
});

// POST /api/personal-entries  – create one
router.post('/', optionalProtect, async (req, res, next) => {
  try {
    const entryData = { ...req.body };
    if (req.user) entryData.user = req.user._id;
    
    const entry = await PersonalEntry.create(entryData);
    res.status(201).json({ success: true, data: entry });
  } catch (err) { next(err); }
});

// PUT /api/personal-entries/:id  – update one
router.put('/:id', optionalProtect, async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user) filter.user = req.user._id;

    const entry = await PersonalEntry.findOneAndUpdate(filter, req.body, { new: true });
    if (!entry) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: entry });
  } catch (err) { next(err); }
});

// DELETE /api/personal-entries/:id  – delete one
router.delete('/:id', optionalProtect, async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    if (req.user) filter.user = req.user._id;

    const entry = await PersonalEntry.findOneAndDelete(filter);
    if (!entry) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) { next(err); }
});

// GET /api/personal-entries/params  – get crop params
const PersonalParam = require('../models/PersonalParam');
router.get('/params', optionalProtect, async (req, res, next) => {
  try {
    const filter = {};
    if (req.user) filter.user = req.user._id;

    let paramObj = await PersonalParam.findOne(filter);
    res.json({ success: true, data: paramObj ? paramObj.params : {} });
  } catch (err) { next(err); }
});

// PUT /api/personal-entries/params  – update crop params
router.put('/params', optionalProtect, async (req, res, next) => {
  try {
    const filter = {};
    if (req.user) filter.user = req.user._id;

    let paramObj = await PersonalParam.findOne(filter);
    if (!paramObj) {
      paramObj = new PersonalParam({ ...filter, params: req.body });
    } else {
      paramObj.params = { ...paramObj.params, ...req.body };
    }
    await paramObj.save();
    res.json({ success: true, data: paramObj.params });
  } catch (err) { next(err); }
});

module.exports = router;
