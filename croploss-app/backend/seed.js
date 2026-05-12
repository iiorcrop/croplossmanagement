/**
 * CropLoss Portal - Complete Data Seeder
 * Run: node seed.js
 * Seeds: users, crop entries with full observations matching the image template
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const CropEntry = require('./models/CropEntry');
const { CROPS } = require('./config/constants');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');

  // ── Clear existing data ────────────────────────────────────────────────
  await User.deleteMany({});
  await CropEntry.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // ── Users ──────────────────────────────────────────────────────────────
  const usersData = [
    {
      name: 'P. Madhuri', email: 'admin@icar.gov.in', phone: '+919876543210',
      password: 'Admin@2025', role: 'super_admin', designation: 'Director',
      assignedCrops: CROPS, reviewCrops: CROPS,
      centerName: 'ICAR-IIOR HQ', centerState: 'Telangana', centerDistrict: 'Hyderabad',
      notifyWhatsApp: true, notifyEmail: true,
    },
    {
      name: 'Dr. S. Kumar', email: 'head@icar.gov.in', phone: '+918765432109',
      password: 'Head@2025', role: 'crop_head', designation: 'Senior Scientist',
      assignedCrops: ['castor','sunflower'], reviewCrops: ['castor','sunflower'],
      notifyWhatsApp: true, notifyEmail: true,
    },
    {
      name: 'Dr. M. Reddy', email: 'mreddy@icar.gov.in', phone: '+917654321098',
      password: 'Head@2025', role: 'crop_head', designation: 'Principal Scientist',
      assignedCrops: ['sesame','niger','linseed'], reviewCrops: ['sesame','niger','linseed'],
      notifyWhatsApp: true, notifyEmail: true,
    },
    {
      name: 'Dr. P. Joshi', email: 'pjoshi@icar.gov.in', phone: '+916543210987',
      password: 'Head@2025', role: 'crop_head', designation: 'Scientist',
      assignedCrops: ['safflower'], reviewCrops: ['safflower'],
      notifyWhatsApp: true, notifyEmail: true,
    },
    {
      name: 'Mr. A. Shah', email: 'user@center.in', phone: '+915432109876',
      password: 'User@2025', role: 'center_user', designation: 'Research Associate',
      centerName: 'RARS Junagadh', centerState: 'Gujarat', centerDistrict: 'Junagadh',
      assignedCrops: ['castor'], notifyWhatsApp: true, notifyEmail: true,
    },
    {
      name: 'Ms. P. Sharma', email: 'psharma@center.in', phone: '+914321098765',
      password: 'User@2025', role: 'center_user', designation: 'Research Associate',
      centerName: 'RARS Hyderabad', centerState: 'Telangana', centerDistrict: 'Hyderabad',
      assignedCrops: ['sunflower','safflower'], notifyWhatsApp: true, notifyEmail: true,
    },
    {
      name: 'Dr. K. Singh', email: 'ksingh@center.in', phone: '+913210987654',
      password: 'User@2025', role: 'center_user', designation: 'Scientist',
      centerName: 'RARS Bhubaneswar', centerState: 'Odisha', centerDistrict: 'Khordha',
      assignedCrops: ['sesame','niger','linseed'], notifyWhatsApp: true, notifyEmail: true,
    },
    {
      name: 'Mr. R. Verma', email: 'rverma@center.in', phone: '+912109876543',
      password: 'User@2025', role: 'center_user', designation: 'Technical Officer',
      centerName: 'RARS Rajkot', centerState: 'Gujarat', centerDistrict: 'Rajkot',
      assignedCrops: ['castor'], notifyWhatsApp: true, notifyEmail: true,
    },
  ];

  const users = [];
  for (const u of usersData) {
    users.push(await User.create(u));
  }

  console.log(`✅ Created ${users.length} users (hashed)`);

  const adminUser   = users.find(u => u.role === 'super_admin');
  const shah        = users.find(u => u.email === 'user@center.in');
  const sharma      = users.find(u => u.email === 'psharma@center.in');
  const singh       = users.find(u => u.email === 'ksingh@center.in');
  const verma       = users.find(u => u.email === 'rverma@center.in');
  const kumarHead   = users.find(u => u.email === 'head@icar.gov.in');
  const reddyHead   = users.find(u => u.email === 'mreddy@icar.gov.in');

  // ── Crop Entries ───────────────────────────────────────────────────────
  const entries = [];

  // 1. CASTOR - Junagadh - APPROVED (full observation data from image)
  entries.push({
    crop: 'castor', discipline: 'Both', season: 'Kharif 2024-25', year: 2024,
    state: 'Gujarat', district: 'Junagadh', taluka: 'Mangrol', surveyDate: new Date('2024-08-15'),
    surveyorName: 'Mr. A. Shah', surveyorDesig: 'Research Associate',
    centerName: 'RARS Junagadh', centerState: 'Gujarat', centerDistrict: 'Junagadh',
    submittedBy: shah._id, submittedByName: shah.name,
    status: 'approved',
    submittedAt: new Date('2024-08-20'),
    reviewedBy: kumarHead._id, reviewedByName: kumarHead.name, reviewedAt: new Date('2024-08-22'),
    approvedBy: kumarHead._id, approvedByName: kumarHead.name, approvedAt: new Date('2024-08-22'),
    reviewComments: 'Good data quality and coverage across all locations.',
    workflowHistory: [
      { fromStatus:'draft', toStatus:'submitted', actorId:shah._id, actorName:shah.name, timestamp:new Date('2024-08-20') },
      { fromStatus:'submitted', toStatus:'under_review', actorId:kumarHead._id, actorName:kumarHead.name, timestamp:new Date('2024-08-21') },
      { fromStatus:'under_review', toStatus:'approved', actorId:kumarHead._id, actorName:kumarHead.name, comments:'Good data quality.', timestamp:new Date('2024-08-22') },
    ],
    observations: [
      { location:'Bhala',     latitude:22.4966,longitude:71.3177,soilType:'Black',previousCrop:'Castor',variety:'',         irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'',           wilt:0,rootRot:0,  cls:'-',als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Pipaliya',  latitude:21.6925,longitude:70.8964,soilType:'Black',previousCrop:'Cotton',variety:'',          irrigatedRainfed:'Rainfed',  dateOfSowing:'1st Wk Aug',stageOfCrop:'Vegetative',  wilt:2,rootRot:0,  cls:'-',als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Kolki',     latitude:21.7818,longitude:70.2376,soilType:'Black',previousCrop:'Maize', variety:'GCH-7',     irrigatedRainfed:'Rainfed',  dateOfSowing:'1st Wk Aug',stageOfCrop:'',           wilt:0,rootRot:0,  cls:'-',als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Bhayavadar',latitude:21.7997,longitude:70.2042,soilType:'Black',previousCrop:'Pigeon Pea',variety:'',      irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'',           wilt:0,rootRot:0,  cls:'-',als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Dumiyani',  latitude:21.7570,longitude:70.3494,soilType:'Black',previousCrop:'Castor',variety:'',          irrigatedRainfed:'Rainfed',  dateOfSowing:'1st Wk Aug',stageOfCrop:'',           wilt:0,rootRot:0,  cls:'-',als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Chanpa',    latitude:22.4188,longitude:71.1682,soilType:'Black',previousCrop:'Cotton',variety:'GCH-9',     irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Harvesting', wilt:0,rootRot:0,  cls:'-',als:'1-10',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Chepuki',   latitude:22.5045,longitude:71.3362,soilType:'Red',  previousCrop:'Cotton',variety:'',          irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'',           wilt:0,rootRot:5,  cls:'1-10',als:'1-10',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Doliya',    latitude:22.5346,longitude:71.3874,soilType:'Sandy loam',previousCrop:'Cotton',variety:'Tejas',irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Harvesting', wilt:0,rootRot:5,  cls:'1-10',als:'1-10',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Samsar',    latitude:22.5792,longitude:71.4152,soilType:'Black',previousCrop:'Groundnut',variety:'',       irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'',           wilt:0,rootRot:0,  cls:'-',als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Sayala',    latitude:22.6265,longitude:71.4609,soilType:'Alluvial',previousCrop:'Castor',variety:'Muli',   irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Harvesting', wilt:0,rootRot:5,  cls:'1-10',als:'-', capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Sidsar',    latitude:22.602, longitude:71.4713,soilType:'Black',previousCrop:'Castor',variety:'',          irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Harvesting', wilt:0,rootRot:0,  cls:'1-10',als:'1-10',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Khambhadiya',latitude:22.602,longitude:71.4713,soilType:'Sandy loam',previousCrop:'Castor',variety:'',    irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Harvesting', wilt:0,rootRot:0,  cls:'1-10',als:'1-10',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Nava Sudamda',latitude:22.5402,longitude:71.4385,soilType:'Sandy loam',previousCrop:'Cotton',variety:'',  irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Harvesting', wilt:0,rootRot:0,  cls:'1-10',als:'1-10',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Vakhatapar', latitude:22.5244,longitude:71.3767,soilType:'Sandy loam',previousCrop:'Castor',variety:'',   irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Harvesting', wilt:0,rootRot:0,  cls:'-',als:'1-10', capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Samatpar',   latitude:22.5082,longitude:71.3398,soilType:'Sandy loam',previousCrop:'Castor',variety:'',   irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Harvesting', wilt:0,rootRot:20, cls:'-',als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'Root rot severe at this location' },
      { location:'Nandana',    latitude:22.1119,longitude:69.2693,soilType:'Black',previousCrop:'Castor',variety:'',         irrigatedRainfed:'Irrigated',dateOfSowing:'Mid Aug',   stageOfCrop:'',           wilt:0,rootRot:0,  cls:'-',als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Limbadi',    latitude:22.1556,longitude:69.3384,soilType:'Black',previousCrop:'Castor',variety:'',         irrigatedRainfed:'Irrigated',dateOfSowing:'Mid Aug',   stageOfCrop:'',           wilt:0,rootRot:0,  cls:'-',als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Ghatrana',   latitude:22.1793,longitude:69.4056,soilType:'Black',previousCrop:'Castor',variety:'',         irrigatedRainfed:'Irrigated',dateOfSowing:'Mid Aug',   stageOfCrop:'',           wilt:0,rootRot:0,  cls:'-',als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Arthan (Chana)',latitude:22.2156,longitude:69.5449,soilType:'Sandy loam',previousCrop:'Castor',variety:'', irrigatedRainfed:'Irrigated',dateOfSowing:'Mid Aug',   stageOfCrop:'',           wilt:0,rootRot:0,  cls:'-',als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Kuvadiya',   latitude:22.2034,longitude:69.5993,soilType:'Sandy loam',previousCrop:'Castor',variety:'Navbharat-22',irrigatedRainfed:'Irrigated',dateOfSowing:'Mid Aug',stageOfCrop:'Vegetative',wilt:0,rootRot:0,cls:'1-10',als:'1-10',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Fol',        latitude:22.0324,longitude:69.6635,soilType:'Black',previousCrop:'Castor',variety:'',         irrigatedRainfed:'Irrigated',dateOfSowing:'Mid Aug',   stageOfCrop:'Secondary spike',wilt:0,rootRot:0,cls:'-',als:'-', capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Gundala',    latitude:22.0031,longitude:69.6840,soilType:'Black',previousCrop:'Castor',variety:'',         irrigatedRainfed:'Irrigated',dateOfSowing:'Mid Aug',   stageOfCrop:'Secondary spike',wilt:0,rootRot:0,cls:'-',als:'-', capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Dhoraji',    latitude:21.9252,longitude:69.8055,soilType:'Black',previousCrop:'Castor',variety:'',         irrigatedRainfed:'Irrigated',dateOfSowing:'Mid Aug',   stageOfCrop:'',           wilt:0,rootRot:0,  cls:'-',als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Upleta',     latitude:21.9184,longitude:69.9176,soilType:'Black',previousCrop:'Groundnut',variety:'',      irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Harvesting', wilt:0,rootRot:0,  cls:'1-10',als:'1-10',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Jamjodhpur', latitude:21.9184,longitude:69.9176,soilType:'Black',previousCrop:'Groundnut',variety:'Avani-11',irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Secondary spike',wilt:0,rootRot:0,cls:'-',als:'-',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
    ],
  });

  // 2. CASTOR - Rajkot - SUBMITTED (pending review)
  entries.push({
    crop: 'castor', discipline: 'Pathology', season: 'Kharif 2024-25', year: 2024,
    state: 'Gujarat', district: 'Rajkot', taluka: 'Jasdan', surveyDate: new Date('2024-08-18'),
    surveyorName: 'Mr. A. Shah', surveyorDesig: 'Research Associate',
    centerName: 'RARS Junagadh', centerState: 'Gujarat', centerDistrict: 'Junagadh',
    submittedBy: shah._id, submittedByName: shah.name,
    status: 'submitted', submittedAt: new Date('2024-08-19'),
    workflowHistory: [{ fromStatus:'draft', toStatus:'submitted', actorId:shah._id, actorName:shah.name, timestamp:new Date('2024-08-19') }],
    observations: [
      { location:'Nandana',   latitude:22.1119,longitude:69.2693,soilType:'Black',     previousCrop:'Castor',variety:'',         irrigatedRainfed:'Irrigated',dateOfSowing:'Mid Aug',   stageOfCrop:'',         wilt:0,rootRot:0,  cls:'-',   als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Limbadi',   latitude:22.1556,longitude:69.3384,soilType:'Black',     previousCrop:'Castor',variety:'',         irrigatedRainfed:'Irrigated',dateOfSowing:'Mid Aug',   stageOfCrop:'',         wilt:0,rootRot:0,  cls:'-',   als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Kuvadiya-B',latitude:22.2034,longitude:69.5993,soilType:'Sandy loam',previousCrop:'Castor',variety:'Navbharat-22',irrigatedRainfed:'Irrigated',dateOfSowing:'Mid Aug',stageOfCrop:'Vegetative',wilt:0,rootRot:0, cls:'1-10',als:'1-10',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Samatpar',  latitude:22.5082,longitude:71.3398,soilType:'Sandy loam',previousCrop:'Castor',variety:'',         irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Harvesting',wilt:2,rootRot:20,cls:'-',   als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'Root rot severe' },
      { location:'Kotda',     latitude:22.3500,longitude:70.8700,soilType:'Black',     previousCrop:'Cotton',variety:'GCH-4',    irrigatedRainfed:'Rainfed',  dateOfSowing:'1st Wk Aug',stageOfCrop:'',         wilt:1,rootRot:0,  cls:'-',   als:'1-10',capsuleBorer:'-',semiLooper:'-',jassids:'1-10',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Gondal',    latitude:21.9610,longitude:70.7900,soilType:'Black',     previousCrop:'Castor',variety:'GCH-7',    irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'',         wilt:0,rootRot:2,  cls:'1-10',als:'-',   capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'1-10',thrips:'-',remarks:'' },
    ],
  });

  // 3. CASTOR - Rajkot - NEEDS CORRECTION
  entries.push({
    crop: 'castor', discipline: 'Both', season: 'Kharif 2024-25', year: 2024,
    state: 'Gujarat', district: 'Amreli', taluka: 'Rajula', surveyDate: new Date('2024-08-12'),
    surveyorName: 'Mr. R. Verma', surveyorDesig: 'Technical Officer',
    centerName: 'RARS Rajkot', centerState: 'Gujarat', centerDistrict: 'Rajkot',
    submittedBy: verma._id, submittedByName: verma.name,
    status: 'needs_correction',
    submittedAt: new Date('2024-08-13'),
    reviewedBy: kumarHead._id, reviewedByName: kumarHead.name, reviewedAt: new Date('2024-08-14'),
    correctionRequested: true,
    correctionNote: 'Root rot percentage at Jafrabad (45%) seems very high compared to neighboring locations. Please re-verify field readings or add supporting remarks. Also, latitude/longitude for two locations appear to be missing.',
    workflowHistory: [
      { fromStatus:'draft', toStatus:'submitted', actorId:verma._id, actorName:verma.name, timestamp:new Date('2024-08-13') },
      { fromStatus:'submitted', toStatus:'needs_correction', actorId:kumarHead._id, actorName:kumarHead.name, comments:'Root rot at Jafrabad needs verification.', timestamp:new Date('2024-08-14') },
    ],
    observations: [
      { location:'Rajula',   latitude:21.0420,longitude:71.4380,soilType:'Black',     previousCrop:'Castor',variety:'GCH-4',irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Vegetative',wilt:0,rootRot:2, cls:'-',   als:'-',  capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Jafrabad', latitude:20.8620,longitude:71.3780,soilType:'Sandy loam',previousCrop:'Castor',variety:'',    irrigatedRainfed:'Rainfed',  dateOfSowing:'1st Wk Aug',stageOfCrop:'Vegetative',wilt:3,rootRot:45,cls:'-',   als:'-',  capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'Heavy root rot observed' },
      { location:'Khijadiya',latitude:21.1100,longitude:71.5200,soilType:'Black',     previousCrop:'Cotton',variety:'',    irrigatedRainfed:'Irrigated',dateOfSowing:'2nd Wk Aug',stageOfCrop:'',         wilt:0,rootRot:1, cls:'1-10',als:'-',  capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
    ],
  });

  // 4. SUNFLOWER - Hyderabad - NEEDS CORRECTION
  entries.push({
    crop: 'sunflower', discipline: 'Pathology', season: 'Kharif 2024-25', year: 2024,
    state: 'Telangana', district: 'Nalgonda', taluka: 'Miryalaguda', surveyDate: new Date('2024-08-10'),
    surveyorName: 'Ms. P. Sharma', surveyorDesig: 'Research Associate',
    centerName: 'RARS Hyderabad', centerState: 'Telangana', centerDistrict: 'Hyderabad',
    submittedBy: sharma._id, submittedByName: sharma.name,
    status: 'needs_correction', submittedAt: new Date('2024-08-12'),
    reviewedBy: kumarHead._id, reviewedByName: kumarHead.name, reviewedAt: new Date('2024-08-13'),
    correctionRequested: true,
    correctionNote: 'Wilt percentage at Huzurnagar location (12%) appears unusually high compared to other survey points. Please re-verify field observation and resubmit with corrected values or additional supporting notes.',
    workflowHistory: [
      { fromStatus:'draft', toStatus:'submitted', actorId:sharma._id, actorName:sharma.name, timestamp:new Date('2024-08-12') },
      { fromStatus:'submitted', toStatus:'needs_correction', actorId:kumarHead._id, actorName:kumarHead.name, comments:'Verify wilt at Huzurnagar.', timestamp:new Date('2024-08-13') },
    ],
    observations: [
      { location:'Miryalaguda-1',latitude:16.8706,longitude:79.5647,soilType:'Black',     previousCrop:'Sorghum',variety:'KBSH-44',irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Flowering',   wilt:2,rootRot:1,downyMildew:'-',leafCurl:'-',als:'-',jassids:'-',whitefly:'-',thrips:'-',aphids:'-',remarks:'' },
      { location:'Huzurnagar',    latitude:16.8958,longitude:79.8887,soilType:'Sandy loam',previousCrop:'Cotton', variety:'',        irrigatedRainfed:'Rainfed',  dateOfSowing:'1st Wk Aug',stageOfCrop:'Vegetative',  wilt:12,rootRot:0,downyMildew:'-',leafCurl:'-',als:'1-10',jassids:'-',whitefly:'-',thrips:'-',aphids:'-',remarks:'Verify reading' },
      { location:'Kodad',         latitude:16.9960,longitude:79.9697,soilType:'Black',     previousCrop:'Rice',   variety:'KBSH-1', irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Seed filling', wilt:4,rootRot:3,downyMildew:'1-10',leafCurl:'-',als:'-',jassids:'-',whitefly:'1-10',thrips:'-',aphids:'-',remarks:'' },
    ],
  });

  // 5. SESAME - Bhubaneswar - UNDER REVIEW
  entries.push({
    crop: 'sesame', discipline: 'Entomology', season: 'Kharif 2024-25', year: 2024,
    state: 'Odisha', district: 'Guntur', taluka: 'Narasaraopet', surveyDate: new Date('2024-08-05'),
    surveyorName: 'Dr. K. Singh', surveyorDesig: 'Scientist',
    centerName: 'RARS Bhubaneswar', centerState: 'Odisha', centerDistrict: 'Khordha',
    submittedBy: singh._id, submittedByName: singh.name,
    status: 'under_review', submittedAt: new Date('2024-08-07'),
    reviewedBy: reddyHead._id, reviewedByName: reddyHead.name, reviewedAt: new Date('2024-08-08'),
    workflowHistory: [
      { fromStatus:'draft', toStatus:'submitted', actorId:singh._id, actorName:singh.name, timestamp:new Date('2024-08-07') },
      { fromStatus:'submitted', toStatus:'under_review', actorId:reddyHead._id, actorName:reddyHead.name, timestamp:new Date('2024-08-08') },
    ],
    observations: [
      { location:'Narasaraopet',latitude:16.2330,longitude:80.0490,soilType:'Black',previousCrop:'Sorghum',variety:'RT-46',irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Aug',stageOfCrop:'Flowering',wilt:1,rootRot:0,stemRot:'-',powderyMildew:'-',als:'-',whitefly:'-',thrips:'-',jassids:'-',aphids:'-',remarks:'' },
      { location:'Macherla',    latitude:16.4775,longitude:79.4315,soilType:'Sandy loam',previousCrop:'Cotton',variety:'',   irrigatedRainfed:'Rainfed',  dateOfSowing:'1st Wk Aug',stageOfCrop:'Vegetative',wilt:3,rootRot:1,stemRot:'1-10',powderyMildew:'-',als:'-',whitefly:'1-10',thrips:'-',jassids:'-',aphids:'-',remarks:'' },
      { location:'Piduguralla', latitude:16.4730,longitude:79.9030,soilType:'Black',previousCrop:'Rice',variety:'GT-10', irrigatedRainfed:'Irrigated',dateOfSowing:'2nd Wk Aug',stageOfCrop:'',         wilt:0,rootRot:0,stemRot:'-',powderyMildew:'-',als:'1-10',whitefly:'-',thrips:'1-10',jassids:'-',aphids:'-',remarks:'' },
    ],
  });

  // 6. SUNFLOWER - Draft
  entries.push({
    crop: 'sunflower', discipline: 'Both', season: 'Kharif 2024-25', year: 2024,
    state: 'Telangana', district: 'Kurnool', taluka: 'Adoni', surveyDate: new Date('2024-08-22'),
    surveyorName: 'Ms. P. Sharma', surveyorDesig: 'Research Associate',
    centerName: 'RARS Hyderabad', centerState: 'Telangana', centerDistrict: 'Hyderabad',
    submittedBy: sharma._id, submittedByName: sharma.name,
    status: 'draft', observations: [],
  });

  // 7. NIGER - Rejected
  entries.push({
    crop: 'niger', discipline: 'Pathology', season: 'Kharif 2024-25', year: 2024,
    state: 'Odisha', district: 'Rayagada', taluka: 'Gunupur', surveyDate: new Date('2024-08-12'),
    surveyorName: 'Dr. K. Singh', surveyorDesig: 'Scientist',
    centerName: 'RARS Bhubaneswar', centerState: 'Odisha', centerDistrict: 'Khordha',
    submittedBy: singh._id, submittedByName: singh.name,
    status: 'rejected', submittedAt: new Date('2024-08-13'),
    reviewedBy: reddyHead._id, reviewedByName: reddyHead.name, reviewedAt: new Date('2024-08-14'),
    rejectedBy: reddyHead._id, rejectedAt: new Date('2024-08-14'),
    rejectionReason: 'Insufficient location coverage. District survey requires minimum 8 village observations. Only 2 locations submitted. Please complete the survey with full coverage and resubmit.',
    reviewComments: 'Insufficient coverage.',
    workflowHistory: [
      { fromStatus:'draft', toStatus:'submitted', actorId:singh._id, actorName:singh.name, timestamp:new Date('2024-08-13') },
      { fromStatus:'submitted', toStatus:'rejected', actorId:reddyHead._id, actorName:reddyHead.name, comments:'Insufficient location coverage.', timestamp:new Date('2024-08-14') },
    ],
    observations: [
      { location:'Gunupur',latitude:19.0860,longitude:83.8150,soilType:'Red',previousCrop:'Sorghum',variety:'IGP-76',irrigatedRainfed:'Rainfed',dateOfSowing:'1st Wk Aug',stageOfCrop:'Vegetative',wilt:0,rootRot:0,stemRot:'-',als:'-',thrips:'-',aphids:'-',jassids:'-',remarks:'' },
      { location:'Rayagada',latitude:19.1700,longitude:83.4160,soilType:'Red',previousCrop:'Sorghum',variety:'',    irrigatedRainfed:'Rainfed',dateOfSowing:'1st Wk Aug',stageOfCrop:'Vegetative',wilt:0,rootRot:0,stemRot:'-',als:'-',thrips:'-',aphids:'-',jassids:'-',remarks:'' },
    ],
  });

  // 8. CASTOR - Previous season - APPROVED
  entries.push({
    crop: 'castor', discipline: 'Both', season: 'Rabi 2023-24', year: 2023,
    state: 'Gujarat', district: 'Surat', taluka: 'Olpad', surveyDate: new Date('2024-01-10'),
    surveyorName: 'Mr. A. Shah', surveyorDesig: 'Research Associate',
    centerName: 'RARS Junagadh', centerState: 'Gujarat', centerDistrict: 'Junagadh',
    submittedBy: shah._id, submittedByName: shah.name,
    status: 'approved', submittedAt: new Date('2024-01-15'),
    reviewedBy: kumarHead._id, reviewedByName: kumarHead.name, reviewedAt: new Date('2024-01-18'),
    approvedBy: kumarHead._id, approvedByName: kumarHead.name, approvedAt: new Date('2024-01-20'),
    reviewComments: 'Clean data. Good seasonal coverage.',
    workflowHistory: [
      { fromStatus:'draft', toStatus:'submitted', actorId:shah._id, actorName:shah.name, timestamp:new Date('2024-01-15') },
      { fromStatus:'submitted', toStatus:'approved', actorId:kumarHead._id, actorName:kumarHead.name, comments:'Clean data.', timestamp:new Date('2024-01-20') },
    ],
    observations: [
      { location:'Olpad',    latitude:21.3350,longitude:72.7510,soilType:'Sandy loam',previousCrop:'Rice', variety:'GCH-4',irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Sep',stageOfCrop:'Harvesting',wilt:0,rootRot:0,cls:'-',als:'-',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Palsana',  latitude:21.0770,longitude:72.9440,soilType:'Black',     previousCrop:'Cotton',variety:'GCH-7',irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Sep',stageOfCrop:'Harvesting',wilt:0,rootRot:2,cls:'-',als:'1-10',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Kamrej',   latitude:21.2560,longitude:72.9610,soilType:'Black',     previousCrop:'Castor',variety:'',    irrigatedRainfed:'Irrigated',dateOfSowing:'2nd Wk Sep',stageOfCrop:'Flowering', wilt:0,rootRot:0,cls:'-',als:'-',capsuleBorer:'-',semiLooper:'-',jassids:'1-10',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Bardoli',  latitude:21.1210,longitude:73.1110,soilType:'Sandy loam',previousCrop:'Castor',variety:'Jwala',irrigatedRainfed:'Rainfed',   dateOfSowing:'2nd Wk Sep',stageOfCrop:'Vegetative',wilt:0,rootRot:1,cls:'1-10',als:'-',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
      { location:'Mandvi',   latitude:21.1660,longitude:72.7380,soilType:'Alluvial', previousCrop:'Rice', variety:'GCH-4',irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Sep',stageOfCrop:'Seed filling',wilt:0,rootRot:0,cls:'-',als:'-',capsuleBorer:'-',semiLooper:'-',jassids:'-',whitefly:'-',thrips:'-',remarks:'' },
    ],
  });

  // 9. LINSEED - Bhubaneswar - APPROVED
  entries.push({
    crop: 'linseed', discipline: 'Pathology', season: 'Rabi 2023-24', year: 2023,
    state: 'Odisha', district: 'Khordha', taluka: 'Bhubaneswar', surveyDate: new Date('2024-02-05'),
    surveyorName: 'Dr. K. Singh', surveyorDesig: 'Scientist',
    centerName: 'RARS Bhubaneswar', centerState: 'Odisha', centerDistrict: 'Khordha',
    submittedBy: singh._id, submittedByName: singh.name,
    status: 'approved', submittedAt: new Date('2024-02-10'),
    reviewedBy: reddyHead._id, reviewedByName: reddyHead.name, reviewedAt: new Date('2024-02-12'),
    approvedBy: reddyHead._id, approvedByName: reddyHead.name, approvedAt: new Date('2024-02-14'),
    reviewComments: 'Complete and accurate. Rust incidence well documented.',
    workflowHistory: [
      { fromStatus:'draft', toStatus:'submitted', actorId:singh._id, actorName:singh.name, timestamp:new Date('2024-02-10') },
      { fromStatus:'submitted', toStatus:'approved', actorId:reddyHead._id, actorName:reddyHead.name, comments:'Complete and accurate.', timestamp:new Date('2024-02-14') },
    ],
    observations: [
      { location:'Jatni',    latitude:20.1680,longitude:85.7060,soilType:'Sandy loam',previousCrop:'Rice',variety:'T-397',   irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Nov',stageOfCrop:'Flowering',  rust:2,wilt:0,rootRot:0,powderyMildew:'-',als:'-',aphids:'-',thrips:'-',jassids:'-',remarks:'' },
      { location:'Bhubaneswar',latitude:20.2961,longitude:85.8245,soilType:'Sandy loam',previousCrop:'Rice',variety:'Neelam', irrigatedRainfed:'Irrigated',dateOfSowing:'1st Wk Nov',stageOfCrop:'Seed filling',rust:5,wilt:0,rootRot:1,powderyMildew:'1-10',als:'-',aphids:'-',thrips:'-',jassids:'-',remarks:'Rust increasing in second crop' },
      { location:'Khordha',  latitude:20.1820,longitude:85.6160,soilType:'Black',     previousCrop:'Sorghum',variety:'Sharda',irrigatedRainfed:'Rainfed',   dateOfSowing:'2nd Wk Nov',stageOfCrop:'Flowering',  rust:0,wilt:0,rootRot:0,powderyMildew:'-',als:'1-10',aphids:'1-10',thrips:'-',jassids:'-',remarks:'' },
    ],
  });

  // 10. SAFFLOWER - Draft by admin
  entries.push({
    crop: 'safflower', discipline: 'Both', season: 'Rabi 2024-25', year: 2024,
    state: 'Maharashtra', district: 'Solapur', taluka: 'Mohol', surveyDate: new Date('2024-11-10'),
    surveyorName: 'Dr. R. K. Patel', surveyorDesig: 'Director',
    centerName: 'ICAR-IIOR HQ', centerState: 'Telangana', centerDistrict: 'Hyderabad',
    submittedBy: adminUser._id, submittedByName: adminUser.name,
    status: 'draft', observations: [],
  });

  const inserted = await CropEntry.insertMany(entries);
  console.log(`✅ Created ${inserted.length} crop entries`);

  console.log('\n🎉 Seeding complete!');
  console.log('═══════════════════════════════════════');
  console.log('Login credentials:');
  console.log('  admin@icar.gov.in  / Admin@2025  → Super Admin');
  console.log('  head@icar.gov.in   / Head@2025   → Crop Head (Castor, Sunflower)');
  console.log('  mreddy@icar.gov.in / Head@2025   → Crop Head (Sesame, Niger, Linseed)');
  console.log('  pjoshi@icar.gov.in / Head@2025   → Crop Head (Safflower)');
  console.log('  user@center.in     / User@2025   → Center User (Castor) – RARS Junagadh');
  console.log('  psharma@center.in  / User@2025   → Center User (Sunflower, Safflower) – RARS Hyderabad');
  console.log('  ksingh@center.in   / User@2025   → Center User (Sesame, Niger, Linseed) – RARS Bhubaneswar');
  console.log('  rverma@center.in   / User@2025   → Center User (Castor) – RARS Rajkot');
  console.log('═══════════════════════════════════════');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
