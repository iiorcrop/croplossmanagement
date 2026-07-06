const express = require('express');
const router = express.Router();
const CropEntry = require('../models/CropEntry');
const MasterData = require('../models/MasterData');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Super‑admin only
const adminOnly = [protect, authorize('super_admin')];

/**
 * Utility: parse a fiscal year string like "2021-22" -> start year number 2021
 */
function parseFiscalYear(str) {
  const match = String(str).match(/^(\d{4})-\d{2}$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Utility: parse a loss string (e.g., "1-10", "11-20", "-", "\u003e50%")
 * Returns { min: number, avg: number }
 */
function parseLoss(value) {
  if (!value || value === '-' || typeof value !== 'string') return { min: 0, avg: 0 };
  // Remove any non‑digit characters except dash
  const clean = value.replace(/[^\d\-]/g, '');
  if (clean.includes('-')) {
    const [minStr, maxStr] = clean.split('-');
    const min = parseFloat(minStr) || 0;
    const max = parseFloat(maxStr) || 0;
    const avg = (min + max) / 2;
    return { min, avg };
  }
  const num = parseFloat(clean) || 0;
  return { min: num, avg: num };
}

/**
 * GET /api/reports/crop-loss?year=2021-22
 * Returns year‑wise aggregated monetary loss report for all crops.
 */
router.get('/crop-loss', adminOnly, async (req, res, next) => {
  try {
    const { year } = req.query;
    const startYear = parseFiscalYear(year);
    if (!startYear) {
      return res.status(400).json({ success: false, message: 'Invalid year format. Use YYYY-YY (e.g., 2021-22).' });
    }

    // 1️⃣ Load master data (production & MSP values). Assume first doc contains an array `crops` with { name, production, msp }.
    const master = await MasterData.findOne();
    const cropProdMap = {};
    if (master && Array.isArray(master.crops)) {
      master.crops.forEach(c => {
        cropProdMap[c.name] = { production: Number(c.production) || 0, msp: Number(c.msp) || 0 };
      });
    }

    // 2️⃣ Aggregate loss percentages per crop, pest/disease.
    const pipeline = [
      { $match: { year: startYear, status: { $ne: 'draft' } } },
      { $unwind: '$observations' },
      {
        $project: {
          crop: 1,
          discipline: 1,
          // disease fields (percent strings)
          wilt: '$observations.wilt',
          rootRot: '$observations.rootRot',
          rust: '$observations.rust',
          cls: '$observations.cls',
          als: '$observations.als',
          downyMildew: '$observations.downyMildew',
          leafCurl: '$observations.leafCurl',
          stemRot: '$observations.stemRot',
          powderyMildew: '$observations.powderyMildew',
          // insect percent fields – many are not pure percentages, so we treat missing for now.
        },
      },
      {
        $group: {
          _id: { crop: '$crop', discipline: '$discipline' },
          diseaseLosses: {
            $push: {
              wilt: '$wilt', rootRot: '$rootRot', rust: '$rust', cls: '$cls', als: '$als',
              downyMildew: '$downyMildew', leafCurl: '$leafCurl', stemRot: '$stemRot', powderyMildew: '$powderyMildew'
            },
          },
        },
      },
    ];

    const agg = await CropEntry.aggregate(pipeline);

    const report = [];

    agg.forEach(group => {
      const { crop, discipline } = group._id;
      // Flatten all disease loss strings
      const allLosses = [];
      group.diseaseLosses.forEach(row => {
        Object.values(row).forEach(v => allLosses.push(v));
      });
      // Compute min and average per‑record loss for diseases
      let diseaseMinTotal = 0;
      let diseaseAvgTotal = 0;
      let diseaseCount = 0;
      allLosses.forEach(val => {
        const { min, avg } = parseLoss(val);
        diseaseMinTotal += min;
        diseaseAvgTotal += avg;
        diseaseCount++;
      });
      const diseaseMinPercent = diseaseCount ? diseaseMinTotal / diseaseCount : 0;
      const diseaseAvgPercent = diseaseCount ? diseaseAvgTotal / diseaseCount : 0;

      // For insect pests – not stored as pure percentages, default to 0 for now.
      const insectMinPercent = 0;
      const insectAvgPercent = 0;

      const prodInfo = cropProdMap[crop] || { production: 0, msp: 0 };
      const valueCrores = prodInfo.production * prodInfo.msp; // Production (Lakh Tonnes) * MSP (Rs./Tonnes) = Rs. crores (approx)

      const lossInsMin = (valueCrores * insectMinPercent) / 100;
      const lossInsAvg = (valueCrores * insectAvgPercent) / 100;
      const lossDisMin = (valueCrores * diseaseMinPercent) / 100;
      const lossDisAvg = (valueCrores * diseaseAvgPercent) / 100;

      const combinedMin = lossInsMin + lossDisMin;
      const combinedAvg = lossInsAvg + lossDisAvg;

      report.push({
        crop,
        discipline,
        year: startYear,
        productionLakhTonnes: prodInfo.production,
        mspRsPerTonnes: prodInfo.msp,
        valueCrores,
        insect: {
          minPercent: insectMinPercent,
          avgPercent: insectAvgPercent,
          monetaryMin: lossInsMin,
          monetaryAvg: lossInsAvg,
        },
        disease: {
          minPercent: diseaseMinPercent,
          avgPercent: diseaseAvgPercent,
          monetaryMin: lossDisMin,
          monetaryAvg: lossDisAvg,
        },
        combined: {
          monetaryMin: combinedMin,
          monetaryAvg: combinedAvg,
        },
      });
    });

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reports/submission-status
 * Returns submission status matrix for centers and crops by year/season.
 */
router.get('/submission-status', [protect, authorize('super_admin', 'crop_head')], async (req, res, next) => {
  try {
    const { year, season } = req.query;

    // 1. Get all unique years and seasons from CropEntry for filtering
    const distinctYears = await CropEntry.distinct('year');
    const distinctSeasons = await CropEntry.distinct('season');

    // 2. Determine filter. If year or season are not specified, we can try to use the latest from CropEntry
    let filterYear = year ? parseInt(year, 10) : null;
    let filterSeason = season || '';

    if (!filterYear && distinctYears.length > 0) {
      filterYear = Math.max(...distinctYears);
    }
    if (!filterSeason && distinctSeasons.length > 0) {
      const matchingSeason = distinctSeasons.find(s => s.includes(String(filterYear)));
      filterSeason = matchingSeason || distinctSeasons[0];
    }

    // 3. Find all active center users and group them by centerName
    const centerUsers = await User.find({ role: 'center_user', isActive: true });
    
    // We construct a map of centerName -> set of assigned crops
    const centerExpectedCrops = {};
    centerUsers.forEach(u => {
      if (!u.centerName) return;
      if (!centerExpectedCrops[u.centerName]) {
        centerExpectedCrops[u.centerName] = new Set();
      }
      if (Array.isArray(u.assignedCrops)) {
        u.assignedCrops.forEach(c => centerExpectedCrops[u.centerName].add(c.toLowerCase()));
      }
    });

    // 4. Get active crops from MasterData
    const master = await MasterData.findOne();
    let allCrops = [];
    if (master && Array.isArray(master.crops)) {
      allCrops = master.crops.map(c => (typeof c === 'string' ? c : c.name).toLowerCase());
    } else {
      allCrops = ['castor', 'sunflower', 'safflower', 'sesame', 'niger', 'linseed'];
    }

    // Display all crops in reports
    let visibleCrops = allCrops;

    // 5. Query actual submissions for the selected year and season
    const matchFilter = {};
    if (filterYear) matchFilter.year = filterYear;
    if (filterSeason) matchFilter.season = filterSeason;

    const entries = await CropEntry.find(matchFilter).select('crop centerName status submittedAt updatedAt submittedByName');

    // Group actual entries by centerName -> crop -> entry detail
    const actualSubmissions = {};
    entries.forEach(e => {
      if (!e.centerName) return;
      if (!actualSubmissions[e.centerName]) {
        actualSubmissions[e.centerName] = {};
      }
      const cropKey = e.crop.toLowerCase();
      actualSubmissions[e.centerName][cropKey] = {
        id: e._id,
        status: e.status,
        submittedAt: e.submittedAt,
        updatedAt: e.updatedAt,
        submittedByName: e.submittedByName
      };
    });

    // 6. Build the final matrix
    const allCenterNames = new Set([
      ...Object.keys(centerExpectedCrops),
      ...Object.keys(actualSubmissions)
    ]);

    const matrix = [];
    allCenterNames.forEach(center => {
      const cropStatuses = {};
      const expectedCropsForCenter = centerExpectedCrops[center] || new Set();

      visibleCrops.forEach(crop => {
        const actual = actualSubmissions[center] && actualSubmissions[center][crop];
        if (actual) {
          cropStatuses[crop] = {
            status: actual.status,
            entryId: actual.id,
            submittedAt: actual.submittedAt,
            submittedByName: actual.submittedByName
          };
        } else {
          if (expectedCropsForCenter.has(crop)) {
            cropStatuses[crop] = {
              status: 'not_submitted',
            };
          } else {
            cropStatuses[crop] = {
              status: 'not_assigned',
            };
          }
        }
      });

      matrix.push({
        centerName: center,
        crops: cropStatuses
      });
    });

    matrix.sort((a, b) => a.centerName.localeCompare(b.centerName));

    res.json({
      success: true,
      data: {
        year: filterYear,
        season: filterSeason,
        availableYears: distinctYears.sort((a, b) => b - a),
        availableSeasons: distinctSeasons,
        crops: visibleCrops,
        matrix
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
