const CROPS = ['castor', 'sunflower', 'safflower', 'sesame', 'niger', 'linseed'];
const ROLES = ['super_admin', 'crop_head', 'center_user'];
const DISCIPLINES = ['Pathology', 'Entomology', 'Both'];

const SOIL_TYPES = ['Black', 'Red', 'Sandy loam', 'Alluvial', 'Clay', 'Loam', 'Sandy clay loam'];

const PREVIOUS_CROPS = ['Castor', 'Cotton', 'Maize', 'Pigeon Pea', 'Groundnut',
  'Sorghum', 'Wheat', 'Rice', 'Soybean', 'Fallow', 'Others'];

const IRRIGATION_TYPES = ['Irrigated', 'Rainfed'];

const SOWING_DATES = [
  '1st Wk Jun', '2nd Wk Jun', '3rd Wk Jun', '4th Wk Jun',
  '1st Wk Jul', '2nd Wk Jul', '3rd Wk Jul', '4th Wk Jul',
  '1st Wk Aug', '2nd Wk Aug', 'Mid Aug', '3rd Wk Aug', '4th Wk Aug',
  '1st Wk Sep', '2nd Wk Sep', '3rd Wk Sep', '4th Wk Sep',
  '1st Wk Oct', '2nd Wk Oct', '3rd Wk Oct', '4th Wk Oct',
  '1st Wk Nov', '2nd Wk Nov', '3rd Wk Nov', '4th Wk Nov',
];

const CROP_STAGES = [
  'Germination', 'Vegetative', 'Flowering', 'Pod/Capsule formation',
  'Seed filling', 'Harvesting', 'Secondary spike', 'Post-harvest',
];

const PERCENT_OPTIONS = ['-', '1-10', '11-20', '21-30', '31-40', '41-50',
  '51-60', '61-70', '71-80', '81-90', '91-100'];

const VARIETIES = {
  castor:    ['GCH-4','GCH-7','GAUCH-1','48-1','Jwala','Aruna','Kiran','Jyoti','Navbharat-22','Srestha','DCS-9','DCH-177','Others'],
  sunflower: ['KBSH-1','KBSH-44','CO-4','Morden','SH-3322','Sungold','PAC-36','G-101','Others'],
  safflower: ['PBNS-12','A-1','K-65','JSF-1','Sharda','NARI-H-15','Others'],
  sesame:    ['RT-46','RT-127','GT-10','JT-21','Swetha','Gouri','TMV-3','Others'],
  niger:     ['IGP-76','No.71','Birsa Niger-1','Deomali','GAU Niger-1','Others'],
  linseed:   ['T-397','Neelam','Sharda','Gaurav','Himalini','NL-260','Others'],
};

// Raw definitions for columns
const RAW_COLUMNS = {
  castor: {
    disease: [
      { key: 'wilt',       label: 'Wilt %',      type: 'percent' },
      { key: 'rootRot',    label: 'Root Rot %',   type: 'percent' },
      { key: 'cls',        label: 'CLS',           type: 'scale'   },
      { key: 'als',        label: 'ALS',           type: 'scale'   },
    ],
    insect: [
      { key: 'leafhopper', label: 'Leafhopper (No./3 leaves/plant)', type: 'scale' },
      { key: 'thrips', label: 'Thrips (No./spike)', type: 'scale' },
      { key: 'semiLooper', label: 'Semi looper', type: 'scale' },
      { key: 'spodopteraLitura', label: 'Spodoptera litura', type: 'scale' },
      { key: 'hairyCaterpillar', label: 'Euproctis hairy caterpillar', type: 'scale' },
      { key: 'capsuleDamage', label: 'Capsules damaged by capsule borer (%)', type: 'percent' },
      { key: 'parasitization', label: 'Parasitization of semilooper by S. maculipennis (%)', type: 'percent' },
      { key: 'spinyCaterpillar', label: 'Spiny caterpillar (Ariadne merione)', type: 'scale' },
      { key: 'visualScore', label: 'Visual score damage due to defoliators', type: 'scale' },
      { key: 'whitefly', label: 'Whitefly', type: 'scale' },
    ],
  },
  sunflower: {
    disease: [
      { key: 'wilt',        label: 'Wilt %',       type: 'percent' },
      { key: 'rootRot',     label: 'Root Rot %',   type: 'percent' },
      { key: 'downyMildew', label: 'Downy Mildew', type: 'scale'   },
      { key: 'leafCurl',    label: 'Leaf Curl',    type: 'scale'   },
      { key: 'als',         label: 'ALS',          type: 'scale'   },
    ],
    insect: [
      { key: 'jassids',  label: 'Jassids',  type: 'scale' },
      { key: 'whitefly', label: 'Whitefly', type: 'scale' },
      { key: 'thrips',   label: 'Thrips',   type: 'scale' },
      { key: 'aphids',   label: 'Aphids',   type: 'scale' },
    ],
  },
  safflower: {
    disease: [
      { key: 'wilt',         label: 'Wilt %',          type: 'percent' },
      { key: 'rootRot',      label: 'Root Rot %',      type: 'percent' },
      { key: 'powderyMildew',label: 'Powdery Mildew',  type: 'scale'   },
      { key: 'cls',          label: 'CLS',             type: 'scale'   },
      { key: 'rust',         label: 'Rust %',          type: 'percent' },
    ],
    insect: [
      { key: 'aphids',  label: 'Aphids',  type: 'scale' },
      { key: 'thrips',  label: 'Thrips',  type: 'scale' },
      { key: 'jassids', label: 'Jassids', type: 'scale' },
    ],
  },
  sesame: {
    disease: [
      { key: 'wilt',         label: 'Wilt %',         type: 'percent' },
      { key: 'rootRot',      label: 'Root Rot %',     type: 'percent' },
      { key: 'stemRot',      label: 'Stem Rot',       type: 'scale'   },
      { key: 'powderyMildew',label: 'Powdery Mildew', type: 'scale'   },
      { key: 'als',          label: 'ALS',            type: 'scale'   },
    ],
    insect: [
      { key: 'whitefly', label: 'Whitefly', type: 'scale' },
      { key: 'thrips',   label: 'Thrips',   type: 'scale' },
      { key: 'jassids',  label: 'Jassids',  type: 'scale' },
      { key: 'aphids',   label: 'Aphids',   type: 'scale' },
    ],
  },
  niger: {
    disease: [
      { key: 'wilt',    label: 'Wilt %',    type: 'percent' },
      { key: 'rootRot', label: 'Root Rot %', type: 'percent' },
      { key: 'stemRot', label: 'Stem Rot',  type: 'scale'   },
      { key: 'als',     label: 'ALS',       type: 'scale'   },
    ],
    insect: [
      { key: 'thrips',  label: 'Thrips',  type: 'scale' },
      { key: 'aphids',  label: 'Aphids',  type: 'scale' },
      { key: 'jassids', label: 'Jassids', type: 'scale' },
    ],
  },
  linseed: {
    disease: [
      { key: 'wilt',         label: 'Wilt %',         type: 'percent' },
      { key: 'rootRot',      label: 'Root Rot %',     type: 'percent' },
      { key: 'rust',         label: 'Rust %',         type: 'percent' },
      { key: 'powderyMildew',label: 'Powdery Mildew', type: 'scale'   },
      { key: 'als',          label: 'ALS',            type: 'scale'   },
    ],
    insect: [
      { key: 'aphids',  label: 'Aphids',  type: 'scale' },
      { key: 'thrips',  label: 'Thrips',  type: 'scale' },
      { key: 'jassids', label: 'Jassids', type: 'scale' },
    ],
  },
};

// Dynamically generate CROP_COLUMNS based on discipline
const { INDIA_GEOGRAPHY } = require('./indiaGeoData');
const INDIA_STATES_DISTRICTS = INDIA_GEOGRAPHY;

const getColumns = (crop, discipline) => {
  const data = RAW_COLUMNS[crop] || RAW_COLUMNS.castor;
  if (discipline === 'Pathology') return { disease: data.disease, insect: [] };
  if (discipline === 'Entomology') return { disease: [], insect: data.insect };
  return data; // 'Both'
};

const STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  NEEDS_CORRECTION: 'needs_correction',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

module.exports = {
  CROPS, ROLES, DISCIPLINES, SOIL_TYPES, PREVIOUS_CROPS, IRRIGATION_TYPES,
  SOWING_DATES, CROP_STAGES, PERCENT_OPTIONS, VARIETIES, RAW_COLUMNS, getColumns, STATUS,
  INDIA_STATES_DISTRICTS,
};
