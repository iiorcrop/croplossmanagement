const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const MasterData = require('../models/MasterData');

const MONGODB_URI = process.env.MONGODB_URI;

const dataToSeed = {
  centers: ["JAU Junagadh","CCSHAU,RRS Bawal","TCRS YETHAPUR","UAS Dharwad","MPKV SOLAPUR","VNMKV Parbhani","BAU Sabour","College of Agriculture Akola","Mauranipur JHANSI","Assam Agricultural University Shillongani","ICAR-NRIIPM","Bengaluru","TNAU Coimbatore","Lathur","PAU Ludhiana","RARS Nandyal","UAS RAICHUR","HISAR","RAKVK NIMPITH","RRTTS ODISHA","JNKVV Tikamgarh","RRS Vriddhachalam","ARS AMRELI"],
  rodents: ["other"],
  locations: ["Wanaparthy","Narayanpet","Nalgonda","S.K.Nagar","Lodhana","Jarthal","Tumkur","Ramanagar","chitradurga","Namakkal","Bidar","Kalaburgi","Vijayapura","Bagalkot","Gadag","Dhawarad","Parbhani","Rajpur","Birnaudh","Mokama","kulla sundarpur","Madhepura","Baluachak","Pannuchak-Ghogha","Nadiyama-Yogia","Agarpur-Machhipur","Nagpur","JHANSI","Assam","Delhi","Akola","Raghavapura","Taggaluru","TNAU","Ludhiana","KURNOOL","Raichur","Haryana","WEST BENGAL","odisha","Madyapradesh"],
  vertebrates: ["other"],
  previousCrops: [{"id":1,"name":"Cotton","description":"Commonly grown before castor in central India.","impact":"Neutral","status":"Active","color":"#e2e8f0"},{"id":2,"name":"Soybean","description":"Nitrogen-fixing crop that benefits subsequent oilseeds.","impact":"Positive","status":"Active","color":"#84cc16"},{"id":3,"name":"Maize","description":"Heavy feeder crop; needs soil replenishment.","impact":"Negative","status":"Active","color":"#fbbf24"},{"id":4,"name":"Sunflower","status":"Active","color":"#cbd5e1"}],
  diseases: ["Wilt","Graymold","Root rot","Fusarium Wilt","Seedling blight","Alternaria leaf spot","Alternaria Blight","Powdery mildew","Other"],
  weeds: ["Cyperus","Commelina","Parthenium","Euphorbia","Celosia","Many weed species","Other"],
  cultivars: ["ICH-66","Private Hybrids","GCH-7","GCH-8","DCH-177","ICH-5","DCH-519","YRCH-1","ISF-764","A1","SSF-13-71","SSF-708","PBNS-86","Local","SHUBHRA","Sabour-Tisi-2","Sabour Iisi-1","PKVNL-260","Mauazadalsi-1","Shardha","BUAT Alsi-4","T-397","Shekhar","RLC-153","KBSH-44","KBSH-78","CO2","COH3","PSH-2080","ITC-Advanta","Ganga Kaveri","GK-2002","Mahyco company","NDSH-1012","Kaveri","KSH-7032","Nuzuveedu","Arun","GHS4455","Super Raja","Swathi","Teja","Sunbred-275","Dhanya3389","ITC Advanta","Siri-Pro agro","Jwala","RSFH-1887","GK202","SN293","SB293","Pravite sector","LSFH-171","PAC-361","KBSH-53","PAC-334","Prachi&Smarak","Kalinga Sesame 3-1","TKG-308","VRI-2"],
  zonesList: ["Semi-arid","Eastern dry zone of Karnataka","ZONE-VIII","ZONE-III"],
  seasons: [{"id":1,"name":"Kharif 2026-27","status":"Active","startDate":"2024-06-01","endDate":"2024-10-30","color":"#f97316"},{"id":2,"name":"Rabi 2026-27","status":"Closed","startDate":"2023-11-01","endDate":"2024-03-31","color":"#64748b"}],
  mites: ["OTHER"],
  pests: ["Caplule borer","Thrips","White flies","Leaf hopper","Semilooper","Spodoptera","Hairy Caterpilar","Aphids","other","Bud fly","Helicoverpa armigera"],
  nematodes: ["Other"]
};

if (!MONGODB_URI) {
  console.error("No MONGODB_URI found in .env!");
  process.exit(1);
}

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to Atlas DB:', MONGODB_URI.split('@')[1]); // safe log
    let master = await MasterData.findOne();
    if (!master) {
      master = new MasterData();
    }
    for (const key in dataToSeed) {
      if (!master[key]) master[key] = [];
      if (Array.isArray(master[key])) {
        const existingStrs = master[key].map(i => typeof i === 'object' ? JSON.stringify(i) : String(i));
        dataToSeed[key].forEach(val => {
          const sVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
          if (!existingStrs.includes(sVal)) {
            master[key].push(val);
          }
        });
      } else {
        master[key] = dataToSeed[key];
      }
    }
    await master.save();
    console.log('Master data seeded successfully to Atlas.');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error("Connection error:", err);
    mongoose.connection.close();
  });
