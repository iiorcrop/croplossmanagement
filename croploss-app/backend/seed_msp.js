const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Msp = require('./models/Msp');

dotenv.config();

// Realistic approximate data for MSP (Rs per quintal) from 1998 to 2024
// Based on typical oilseed growth trends in India.
const generateData = () => {
  const records = [];
  const startYear = 1998;
  const currentYear = new Date().getFullYear();

  // Base prices in 1998
  let currentPrices = {
    castor: 1000,
    sunflower: 1150,
    safflower: 990,
    sesame: 1200,
    niger: 1050,
    linseed: 1000
  };

  // Target prices in 2024
  const targetPrices = {
    castor: 6000,
    sunflower: 6760,
    safflower: 5800,
    sesame: 8717,
    niger: 7734,
    linseed: 5800
  };

  const totalYears = currentYear - startYear;

  for (let y = startYear; y <= currentYear; y++) {
    const y2 = (y + 1).toString().slice(2);
    const yearStr = `${y}-${y2}`;

    // Calculate progression percentage (0 to 1)
    const progress = (y - startYear) / totalYears;
    
    // Add some realistic non-linear growth (exponential-like curve common in inflation)
    const growthFactor = Math.pow(progress, 1.5);

    const record = { year: yearStr };
    
    for (const crop in currentPrices) {
      const priceDiff = targetPrices[crop] - currentPrices[crop];
      // Calculate price and round to nearest 50
      let price = currentPrices[crop] + (priceDiff * growthFactor);
      record[crop] = Math.round(price / 50) * 50;
    }
    
    records.push(record);
  }
  return records;
};

const seedMsp = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const data = generateData();
    
    const bulkOps = data.map(record => ({
      updateOne: {
        filter: { year: record.year },
        update: { $set: record },
        upsert: true
      }
    }));

    const result = await Msp.bulkWrite(bulkOps);
    console.log(`Successfully seeded ${data.length} MSP records.`);
    console.log(`Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);

    process.exit(0);
  } catch (err) {
    console.error('Failed to seed MSP data:', err);
    process.exit(1);
  }
};

seedMsp();
