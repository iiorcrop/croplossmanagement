/**
 * Resolves a single report column for one observation row.
 *
 * Why this exists: an entry stores its survey context (lat/long, soil, previous
 * crop, variety, irrigation, sowing, stage) once at the entry level — the
 * observation rows never carry those values, so reading them straight off the
 * observation always yields the blank-row defaults. The crop-specific forms
 * (castor entomology, sunflower entomology/pathology) go further and keep their
 * readings inside nested arrays (`defoliators`, `suckingPests`, `sunflowerPests`,
 * `sunflowerPathology.diseases`) instead of the flat disease/insect columns.
 * Legacy rows also use older key names (`wilt` vs `fusariumWilt`, `cls` vs
 * `cercosporaLeafSpot`, `jassids` vs `leafhopper`).
 *
 * Every export therefore has to look in observation → nested → entry before a
 * column can be called empty.
 *
 * Mirrored in frontend/src/utils/observationFields.js — keep both in sync.
 */

const BLANK_STRINGS = ['', '-', '--'];

const isBlank = (v) => {
  if (v === null || v === undefined) return true;
  if (typeof v === 'number') return Number.isNaN(v);
  if (Array.isArray(v)) return v.length === 0;
  return BLANK_STRINGS.includes(String(v).trim());
};

const firstFilled = (...vals) => vals.find(v => !isBlank(v));

// "> 50% (Specify)" stores the real number in `<key>_specify`.
const applySpecify = (value, source, key) => {
  if (typeof value !== 'string' || !/specify/i.test(value)) return value;
  const detail = source ? source[`${key}_specify`] : undefined;
  if (isBlank(detail)) return value.replace(/\s*\(specify\)/i, '');
  const s = String(detail).trim();
  return /%\s*$/.test(s) ? s : `${s}%`;
};

// ── Survey-context columns ────────────────────────────────────────────────────
// `defaults` are the blank-row placeholders the observation carries when the
// user never edited them — the entry-level value wins over those.
const CONTEXT_FIELDS = {
  location: {
    obs: ['location'],
    nested: o => o.sunflowerPathology && o.sunflowerPathology.village,
    entry: ['village', 'taluka', 'district'],
  },
  latitude:  { obs: ['latitude'],  entry: ['latitude'] },
  longitude: { obs: ['longitude'], entry: ['longitude'] },
  soilType: {
    obs: ['soilType'],
    entry: ['soilTypeField', 'soilType'],
    defaults: ['Black'],
  },
  previousCrop: {
    obs: ['previousCrop'],
    nested: o => o.sunflowerPathology && o.sunflowerPathology.previousCrop,
    entry: ['previousCrop'],
    defaults: ['Castor'],
  },
  variety: {
    obs: ['variety', 'otherVariety'],
    nested: o => o.sunflowerPathology && o.sunflowerPathology.varietyHybrid,
    entry: ['variety', 'cultivar'],
  },
  irrigatedRainfed: { obs: ['irrigatedRainfed'], entry: ['irrigatedRainfed'], defaults: ['Irrigated'] },
  dateOfSowing:     { obs: ['dateOfSowing'],     entry: ['dateOfSowing'],     defaults: ['1st Wk Aug'] },
  stageOfCrop: {
    obs: ['stageOfCrop'],
    nested: o => {
      const d = o.sunflowerPathology && o.sunflowerPathology.diseases;
      return Array.isArray(d) ? firstFilled(...d.map(x => x.cropStage)) : undefined;
    },
    entry: ['stageOfCrop'],
  },
  farmerName: {
    obs: ['farmerName'],
    nested: o => o.sunflowerPathology && o.sunflowerPathology.farmerName,
    entry: [],
  },
};

// ── Measurement columns ───────────────────────────────────────────────────────
// Canonical key → every key that may hold the same reading (own key first).
const MEASURE_ALIASES = {
  wilt:                ['wilt', 'fusariumWilt'],
  fusariumWilt:        ['fusariumWilt', 'wilt'],
  rootRot:             ['rootRot'],
  stemRot:             ['stemRot'],
  cls:                 ['cls', 'cercosporaLeafSpot'],
  cercosporaLeafSpot:  ['cercosporaLeafSpot', 'cls'],
  als:                 ['als', 'alternariaLeafSpot'],
  alternariaLeafSpot:  ['alternariaLeafSpot', 'als'],
  capsuleBorer:        ['capsuleBorer', 'capsuleDamage'],
  capsuleDamage:       ['capsuleDamage', 'capsuleBorer'],
  jassids:             ['jassids', 'leafhopper'],
  leafhopper:          ['leafhopper', 'jassids'],
  whitefly:            ['whitefly', 'whiteflies'],
};

const aliasesFor = key => MEASURE_ALIASES[key] || [key];

// Keys that describe the same reading under different crop schemas. Reports that
// merge several crops into one table collapse each group into a single column.
const ALIAS_GROUPS = [
  ['wilt', 'fusariumWilt'],
  ['cls', 'cercosporaLeafSpot'],
  ['als', 'alternariaLeafSpot'],
  ['capsuleBorer', 'capsuleDamage'],
  ['jassids', 'leafhopper'],
  ['whitefly', 'whiteflies'],
];

const GROUP_LABELS = {
  wilt:         'Wilt / Fusarium Wilt',
  cls:          'CLS (Cercospora Leaf Spot)',
  als:          'ALS (Alternaria Leaf Spot)',
  capsuleBorer: 'Capsule Borer Damage',
  jassids:      'Jassids / Leafhopper',
  whitefly:     'Whitefly',
};

/** Group id shared by every alias of a column key. */
const canonicalKey = (key) => {
  const group = ALIAS_GROUPS.find(g => g.includes(key));
  return group ? group[0] : key;
};

/**
 * Collapse per-crop column definitions into one de-duplicated list.
 * @param {Array<{key:string,label:string}>} columns
 */
const mergeColumns = (columns) => {
  const merged = new Map(); // group id -> { key, label }
  columns.forEach(c => {
    const id = canonicalKey(c.key);
    if (merged.has(id)) return;
    merged.set(id, { key: c.key, label: GROUP_LABELS[id] || c.label });
  });
  return [...merged.values()];
};

// Pest-name keywords used to pull a reading out of the nested pest arrays.
const PEST_KEYWORDS = {
  jassids:          ['jassid', 'leafhopper'],
  leafhopper:       ['leafhopper', 'jassid'],
  whitefly:         ['whitefly', 'whiteflies'],
  thrips:           ['thrips'],
  aphids:           ['aphid'],
  semiLooper:       ['semi looper', 'semilooper', 'thysanoplusia', 'looper'],
  spodopteraLitura: ['spodoptera'],
  hairyCaterpillar: ['euproctis', 'hairy caterpillar', 'spilosoma'],
  spinyCaterpillar: ['ariadne', 'spiny caterpillar'],
  capsuleBorer:     ['capsule borer', 'conogethes', 'helicoverpa', 'capsule'],
  capsuleDamage:    ['capsule borer', 'conogethes', 'helicoverpa', 'capsule'],
  parasitization:   ['maculipennis', 'parasit'],
};

const PEST_SOURCES = [
  { path: 'defoliators',        fields: ['percentDefoliation', 'leafAreaDamaged', 'larvaePerPlant', 'severityCategory'] },
  { path: 'capsuleSpikeBorers', fields: ['percentCapsuleDamage', 'capsulesDamaged', 'spikesDamaged'] },
  { path: 'suckingPests',       fields: ['percentAffectedPlants', 'insectCount'] },
  { path: 'rootPests',          fields: ['termiteCount', 'whiteGrubCount'] },
  { path: 'sunflowerPests',     fields: ['noOfInsects', 'defoliationPercent', 'sndPercent', 'yellowingDryingPercent'] },
  { path: 'otherPests',         nameField: 'name', fields: ['observation'] },
];

// Disease-name keywords for sunflower pathology's nested disease rows.
const DISEASE_KEYWORDS = {
  wilt:               ['wilt'],
  fusariumWilt:       ['fusarium wilt', 'wilt'],
  rootRot:            ['root rot'],
  stemRot:            ['stem rot', 'stem and root rot'],
  cls:                ['cercospora'],
  cercosporaLeafSpot: ['cercospora'],
  als:                ['alternaria'],
  alternariaLeafSpot: ['alternaria'],
  downyMildew:        ['downy'],
  powderyMildew:      ['powdery'],
  leafCurl:           ['leaf curl'],
  rust:               ['rust'],
  seedlingBlight:     ['seedling blight'],
  grayMold:           ['gray mold', 'grey mold', 'botrytis'],
  capsuleRot:         ['capsule rot', 'head rot'],
  bacterialLeafSpot:  ['bacterial leaf spot'],
  bacterialBlight:    ['bacterial blight'],
};

const fromPestArrays = (obs, key) => {
  // Sunflower entomology keeps leaf-curl damage on the pest row itself.
  if (key === 'leafCurl' && Array.isArray(obs.sunflowerPests)) {
    const v = firstFilled(...obs.sunflowerPests.map(p => p.leafCurlPercent));
    if (v !== undefined) return v;
  }

  const keywords = PEST_KEYWORDS[key];
  if (!keywords) return undefined;

  for (const src of PEST_SOURCES) {
    const rows = obs[src.path];
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (!row) continue;
      const name = String(row[src.nameField || 'pestName'] || '').toLowerCase();
      if (!keywords.some(k => name.includes(k))) continue;
      const v = firstFilled(...src.fields.map(f => row[f]));
      if (v !== undefined) return v;
    }
  }
  return undefined;
};

const fromPathologyDiseases = (obs, key) => {
  const keywords = DISEASE_KEYWORDS[key];
  const diseases = obs.sunflowerPathology && obs.sunflowerPathology.diseases;
  if (!keywords || !Array.isArray(diseases)) return undefined;

  for (const d of diseases) {
    if (!d) continue;
    const name = String(d.diseaseObserved || '').toLowerCase();
    if (!keywords.some(k => name.includes(k))) continue;
    const v = firstFilled(d.meanDiseaseIncidence, d.diseaseRange, d.maxDisScore);
    if (v !== undefined) return v;
  }
  return undefined;
};

const entryValue = (entry, keys) => {
  for (const k of keys) {
    const v = entry ? entry[k] : undefined;
    if (isBlank(v)) continue;
    return Array.isArray(v) ? v.join(', ') : v;
  }
  return undefined;
};

const resolveContext = (entry, obs, field) => {
  const spec = CONTEXT_FIELDS[field];
  const obsVal = firstFilled(...spec.obs.map(k => obs[k]));
  const isPlaceholder = obsVal !== undefined && (spec.defaults || []).includes(String(obsVal).trim());

  if (obsVal !== undefined && !isPlaceholder) return obsVal;

  const nestedVal = spec.nested ? spec.nested(obs) : undefined;
  if (!isBlank(nestedVal)) return nestedVal;

  const entryVal = entryValue(entry, spec.entry || []);
  if (entryVal !== undefined) return entryVal;

  return obsVal; // the placeholder default, when there is nothing better
};

const resolveMeasure = (entry, obs, key) => {
  for (const alias of aliasesFor(key)) {
    const v = obs[alias];
    if (!isBlank(v)) return applySpecify(v, obs, alias);
  }

  const nested = firstFilled(fromPathologyDiseases(obs, key), fromPestArrays(obs, key));
  if (nested !== undefined) return nested;

  for (const alias of aliasesFor(key)) {
    const v = entry ? entry[alias] : undefined;
    if (!isBlank(v)) return applySpecify(v, entry, alias);
  }

  if ((key === 'wilt' || key === 'fusariumWilt') && entry && entry.avgWilt > 0) return `${entry.avgWilt}%`;
  if (key === 'rootRot' && entry && entry.avgRootRot > 0) return `${entry.avgRootRot}%`;

  return undefined;
};

// Remarks are aggregated rather than picked: the crop-specific forms hang their
// notes off nested rows, so a row can hold several.
const resolveRemarks = (entry, obs) => {
  const parts = [];
  if (!isBlank(obs.remarks)) parts.push(String(obs.remarks).trim());

  const diseases = obs.sunflowerPathology && obs.sunflowerPathology.diseases;
  if (Array.isArray(diseases)) {
    diseases.forEach(d => {
      if (d && !isBlank(d.remarks)) parts.push(`${d.diseaseObserved || 'Disease'}: ${String(d.remarks).trim()}`);
    });
  }
  if (Array.isArray(obs.otherPests)) {
    obs.otherPests.forEach(p => {
      if (p && !isBlank(p.observation)) parts.push(`${p.name || 'Other pest'}: ${String(p.observation).trim()}`);
    });
  }
  if (!isBlank(obs.newDiseaseDetails)) parts.push(`New disease: ${String(obs.newDiseaseDetails).trim()}`);

  const yl = obs.yieldLoss;
  if (yl) {
    const methods = firstFilled(yl.method1, yl.method2, yl.method3);
    if (methods !== undefined) {
      const all = ['method1', 'method2', 'method3']
        .filter(m => !isBlank(yl[m]))
        .map(m => `${m.replace('method', 'M')}: ${yl[m]}`)
        .join(', ');
      parts.push(`Yield loss (${all})`);
    }
  }

  return parts.length ? parts.join('; ') : undefined;
};

/** Resolve one column key for one observation row of an entry. */
const resolveField = (entry, observation, key) => {
  const obs = observation || {};
  if (key === 'remarks') return resolveRemarks(entry, obs);
  if (CONTEXT_FIELDS[key]) return resolveContext(entry, obs, key);
  return resolveMeasure(entry, obs, key);
};

/** Resolved value ready for a report cell ('--' when genuinely empty). */
const cellValue = (entry, observation, key, placeholder = '--') => {
  const v = resolveField(entry, observation, key);
  return isBlank(v) ? placeholder : v;
};

module.exports = {
  isBlank,
  resolveField,
  cellValue,
  canonicalKey,
  mergeColumns,
  CONTEXT_FIELDS,
  MEASURE_ALIASES,
};
