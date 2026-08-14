const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');
const Location = require('../models/Location');
const { INDIA_GEOGRAPHY } = require('../data/indiaGeoData');

// Remote fallback URLs for LGD JSON dumps
const REMOTE_GEO_URL = 'https://raw.githubusercontent.com/vertexaisearch/indian-states-districts-json/main/states-and-districts.json';

async function seedInitialLocations() {
  try {
    const existingCount = await Location.countDocuments();
    if (existingCount > 0) {
      console.log(`[Location Sync] Database already contains ${existingCount} locations.`);
      return;
    }

    console.log('[Location Sync] Seeding initial location hierarchy into MongoDB...');
    const bulkOps = [];

    // Seed from local INDIA_GEOGRAPHY base
    for (const [state, districts] of Object.entries(INDIA_GEOGRAPHY)) {
      for (const [district, talukas] of Object.entries(districts)) {
        for (const taluka of talukas) {
          // Add standard base villages for each taluka
          const baseVillages = [
            `${taluka} Town`,
            `${taluka} Rural`,
            `${taluka} North`,
            `${taluka} South`,
            `${taluka} East`,
            `${taluka} West`
          ];

          // Add specific known villages for Huzurnagar / Suryapet / Kodad
          if (taluka.toLowerCase() === 'huzurnagar') {
            baseVillages.push('Karakkayala Gudem', 'Burugadda', 'Macharam', 'Lingagiri', 'Lakkavaram', 'Amravaram', 'Yepala Singaram');
          } else if (taluka.toLowerCase() === 'suryapet') {
            baseVillages.push('Suryapet City', 'Imampet', 'Kesaram', 'Pinna Palem', 'Yerkaram', 'Kudakuda');
          } else if (taluka.toLowerCase() === 'kodad') {
            baseVillages.push('Ganapavaram', 'Gudi Banda', 'Kapugallu', 'Redlakunta', 'Togarrai');
          }

          for (const village of new Set(baseVillages)) {
            bulkOps.push({
              updateOne: {
                filter: { state, district, taluka, village },
                update: { $setOnInsert: { state, district, taluka, village } },
                upsert: true
              }
            });
          }
        }
      }
    }

    if (bulkOps.length > 0) {
      await Location.bulkWrite(bulkOps);
      console.log(`[Location Sync] Successfully seeded ${bulkOps.length} base locations.`);
    }

    // Attempt to enrich states/districts from open remote API asynchronously
    try {
      console.log('[Location Sync] Fetching updated state/district hierarchy from open data API...');
      const response = await axios.get(REMOTE_GEO_URL, { timeout: 10000 });
      if (response.data && response.data.states) {
        const remoteOps = [];
        for (const sObj of response.data.states) {
          const stateName = sObj.state;
          const dists = sObj.districts || [];
          for (const distName of dists) {
            remoteOps.push({
              updateOne: {
                filter: { state: stateName, district: distName, taluka: distName, village: `${distName} HQ` },
                update: { $setOnInsert: { state: stateName, district: distName, taluka: distName, village: `${distName} HQ` } },
                upsert: true
              }
            });
          }
        }
        if (remoteOps.length > 0) {
          await Location.bulkWrite(remoteOps);
          console.log(`[Location Sync] Enriched ${remoteOps.length} state-district records from open dataset.`);
        }
      }
    } catch (netErr) {
      console.warn('[Location Sync] Remote open data fetch skipped or timed out:', netErr.message);
    }

  } catch (err) {
    console.error('[Location Sync] Error during location sync:', err);
  }
}

// Allow CLI execution if called directly
if (require.main === module) {
  connectDB().then(async () => {
    await seedInitialLocations();
    mongoose.connection.close();
  });
}

module.exports = { seedInitialLocations };
