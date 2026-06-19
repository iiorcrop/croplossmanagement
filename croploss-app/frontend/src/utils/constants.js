export const CROPS = ['castor','sunflower','safflower','sesame','niger','linseed'];
export const DISCIPLINES = ['Pathology', 'Entomology', 'Both'];

export const CROP_EMOJI = {
  castor:'🌿', sunflower:'🌻', safflower:'🌼', sesame:'🌱', niger:'🍃', linseed:'🌾'
};

export const CROP_LABEL = c => c ? c.charAt(0).toUpperCase()+c.slice(1) : '';

export const SOIL_TYPES = ['Black','Red','Sandy loam','Alluvial','Clay','Loam','Sandy clay loam'];

export const PREVIOUS_CROPS = ['Castor','Cotton','Maize','Pigeon Pea','Groundnut',
  'Sorghum','Wheat','Rice','Soybean','Fallow','Others'];

export const IRRIGATION_TYPES = ['Irrigated','Rainfed'];

export const SOWING_DATES = [
  '1st Wk Jun','2nd Wk Jun','3rd Wk Jun','4th Wk Jun',
  '1st Wk Jul','2nd Wk Jul','3rd Wk Jul','4th Wk Jul',
  '1st Wk Aug','2nd Wk Aug','Mid Aug','3rd Wk Aug','4th Wk Aug',
  '1st Wk Sep','2nd Wk Sep','3rd Wk Sep','4th Wk Sep',
  '1st Wk Oct','2nd Wk Oct','3rd Wk Oct','4th Wk Oct',
  '1st Wk Nov','2nd Wk Nov','3rd Wk Nov','4th Wk Nov',
];

export const CROP_STAGES = [
  '','Germination','Vegetative','Flowering','Pod/Capsule formation',
  'Seed filling','Harvesting','Secondary spike','Post-harvest',
];

export const PCT_OPTS = ['-','0%','1-10%','11-20%','21-30%','31-40%','41-50%','>50% (Specify)'];

export const VARIETIES = {
  castor:    ['','GCH-4','GCH-7','GAUCH-1','48-1','Jwala','Aruna','Kiran','Jyoti','Navbharat-22','Srestha','DCS-9','DCH-177','Others'],
  sunflower: ['','KBSH-1','KBSH-44','CO-4','Morden','SH-3322','Sungold','PAC-36','G-101','Others'],
  safflower: ['','PBNS-12','A-1','K-65','JSF-1','Sharda','NARI-H-15','Others'],
  sesame:    ['','RT-46','RT-127','GT-10','JT-21','Swetha','Gouri','TMV-3','Others'],
  niger:     ['','IGP-76','No.71','Birsa Niger-1','Deomali','GAU Niger-1','Others'],
  linseed:   ['','T-397','Neelam','Sharda','Gaurav','Himalini','NL-260','Others'],
};

export const CROP_COLS = {
  castor: {
    disease: [
      {key:'seedlingBlight', label:'Seedling Blight', type:'percent'},
      {key:'fusariumWilt', label:'Fusarium Wilt', type:'percent'},
      {key:'grayMold', label:'Gray Mold', type:'percent'},
      {key:'rootRot', label:'Root Rot', type:'percent'},
      {key:'rust', label:'Rust', type:'percent'},
      {key:'alternariaLeafSpot', label:'Alternaria Leaf Spot', type:'percent'},
      {key:'cercosporaLeafSpot', label:'Cercospora Leaf Spot', type:'percent'},
      {key:'powderyMildew', label:'Powdery Mildew', type:'percent'},
      {key:'bacterialLeafSpot', label:'Bacterial Leaf Spot', type:'percent'},
      {key:'capsuleRot', label:'Capsule Rot', type:'percent'},
      {key:'bacterialBlight', label:'Bacterial Blight', type:'percent'},
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
      {key:'wilt',label:'Wilt %',type:'percent'},
      {key:'rootRot',label:'Root Rot %',type:'percent'},
      {key:'downyMildew',label:'Downy Mildew',type:'scale'},
      {key:'leafCurl',label:'Leaf Curl',type:'scale'},
      {key:'als',label:'ALS',type:'scale'},
    ],
    insect: [
      {key:'jassids',label:'Jassids',type:'scale'},
      {key:'whitefly',label:'Whitefly',type:'scale'},
      {key:'thrips',label:'Thrips',type:'scale'},
      {key:'aphids',label:'Aphids',type:'scale'},
    ],
  },
  safflower: {
    disease: [
      {key:'wilt',label:'Wilt %',type:'percent'},
      {key:'rootRot',label:'Root Rot %',type:'percent'},
      {key:'powderyMildew',label:'Powdery Mildew',type:'scale'},
      {key:'cls',label:'CLS',type:'scale'},
      {key:'rust',label:'Rust %',type:'percent'},
    ],
    insect: [
      {key:'aphids',label:'Aphids',type:'scale'},
      {key:'thrips',label:'Thrips',type:'scale'},
      {key:'jassids',label:'Jassids',type:'scale'},
    ],
  },
  sesame: {
    disease: [
      {key:'wilt',label:'Wilt %',type:'percent'},
      {key:'rootRot',label:'Root Rot %',type:'percent'},
      {key:'stemRot',label:'Stem Rot',type:'scale'},
      {key:'powderyMildew',label:'Powdery Mildew',type:'scale'},
      {key:'als',label:'ALS',type:'scale'},
    ],
    insect: [
      {key:'whitefly',label:'Whitefly',type:'scale'},
      {key:'thrips',label:'Thrips',type:'scale'},
      {key:'jassids',label:'Jassids',type:'scale'},
      {key:'aphids',label:'Aphids',type:'scale'},
    ],
  },
  niger: {
    disease: [
      {key:'wilt',label:'Wilt %',type:'percent'},
      {key:'rootRot',label:'Root Rot %',type:'percent'},
      {key:'stemRot',label:'Stem Rot',type:'scale'},
      {key:'als',label:'ALS',type:'scale'},
    ],
    insect: [
      {key:'thrips',label:'Thrips',type:'scale'},
      {key:'aphids',label:'Aphids',type:'scale'},
      {key:'jassids',label:'Jassids',type:'scale'},
    ],
  },
  linseed: {
    disease: [
      {key:'wilt',label:'Wilt %',type:'percent'},
      {key:'rootRot',label:'Root Rot %',type:'percent'},
      {key:'rust',label:'Rust %',type:'percent'},
      {key:'powderyMildew',label:'Powdery Mildew',type:'scale'},
      {key:'als',label:'ALS',type:'scale'},
    ],
    insect: [
      {key:'aphids',label:'Aphids',type:'scale'},
      {key:'thrips',label:'Thrips',type:'scale'},
      {key:'jassids',label:'Jassids',type:'scale'},
    ],
  },
};

export const getColsByDiscipline = (crop, discipline) => {
  const data = CROP_COLS[crop] || CROP_COLS.castor;
  if (discipline === 'Pathology') return { disease: data.disease, insect: [] };
  if (discipline === 'Entomology') return { disease: [], insect: data.insect };
  return data; // Both
};

import { INDIA_GEOGRAPHY } from './indiaGeoData';

export const INDIA_STATES_DISTRICTS = INDIA_GEOGRAPHY;

export const STATUS_LABELS = {
  draft:'Draft', submitted:'Submitted', under_review:'Under Review',
  needs_correction:'Needs Correction', approved:'Approved', rejected:'Rejected',
};

export const STATUS_BADGE_CLASS = {
  draft:'badge-draft', submitted:'badge-submitted', under_review:'badge-review',
  needs_correction:'badge-correction', approved:'badge-approved', rejected:'badge-rejected',
};

export const ROLE_LABELS = {
  super_admin:'Super Administrator', crop_head:'Crop Head', center_user:'Center User'
};

export const ROLE_BADGE_CLASS = {
  super_admin:'badge-admin', crop_head:'badge-crophead', center_user:'badge-center'
};

export const SEASONS = ['Kharif 2024-25','Rabi 2024-25','Kharif 2023-24','Rabi 2023-24','Kharif 2022-23','Rabi 2022-23'];

export const AV_COLORS = ['#1b5e20','#1565c0','#c62828','#6a1b9a','#d97706','#0d9488','#b45309','#0369a1'];

export const wiltColor = v => v>=20 ? 'var(--red)' : v>=10 ? 'var(--orange)' : v>=5 ? 'var(--amber-d)' : 'var(--g7)';
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CROPS, DISCIPLINES, getColsByDiscipline };
}
