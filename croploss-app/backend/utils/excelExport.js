const ExcelJS = require('exceljs');
const { RAW_COLUMNS } = require('../config/constants');
const { cellValue, mergeColumns } = require('./observationFields');

// Survey-context columns — resolved per observation, falling back to the
// entry-level values the form actually collects (see utils/observationFields).
const CONTEXT_COLUMNS = [
  { key: 'location',         label: 'Location' },
  { key: 'latitude',         label: 'Latitude' },
  { key: 'longitude',        label: 'Longitude' },
  { key: 'soilType',         label: 'Soil Type' },
  { key: 'previousCrop',     label: 'Previous Crop' },
  { key: 'variety',          label: 'Variety' },
  { key: 'irrigatedRainfed', label: 'Irrigated/Rainfed' },
  { key: 'dateOfSowing',     label: 'Date of Sowing' },
  { key: 'stageOfCrop',      label: 'Stage of Crop' },
];

const TRAILING_COLUMNS = [
  { key: 'cropDamage',         label: 'Crop Damage %' },
  { key: 'newDiseaseReported', label: 'New Disease?' },
  { key: 'remarks',            label: 'Remarks' },
];

async function generateExcelReport(entries, filters = {}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CropLoss Portal – ICAR-IIOR';
  wb.created = new Date();

  // ── Sheet 1: Complete Detail (one row per observation/village) ─────────────
  const detailSheet = wb.addWorksheet('All Observations', {
    pageSetup: { orientation: 'landscape', fitToPage: true },
  });

  // Fixed headers that apply to every row
  const fixedHeaders = [
    '#', 'Entry ID', 'Crop', 'Discipline', 'Season',
    'State', 'District', 'Taluka', 'Center',
    'Survey Date', 'Surveyor Name', 'Designation', 'Status',
    // Observation-level columns
    ...CONTEXT_COLUMNS.map(c => c.label),
  ];

  // Collect the disease/insect columns of every crop present, collapsing keys
  // that mean the same thing across crop schemas (wilt/fusariumWilt, cls/…)
  const cropColumns = [];
  entries.forEach(entry => {
    const cols = RAW_COLUMNS[entry.crop] || RAW_COLUMNS.castor;
    cropColumns.push(...(cols.disease || []), ...(cols.insect || []));
  });
  const measureColumns = mergeColumns(cropColumns);
  const diseaseHeaders = measureColumns.map(c => c.label);
  const diseaseKeys    = measureColumns.map(c => c.key);

  const allHeaders = [...fixedHeaders, ...diseaseHeaders, ...TRAILING_COLUMNS.map(c => c.label)];

  // Title rows — merged across the full (crop-dependent) header width
  detailSheet.mergeCells(1, 1, 1, allHeaders.length);
  const titleCell = detailSheet.getCell('A1');
  titleCell.value = 'CropLoss Management Portal – Detailed Observation Report';
  titleCell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } };
  titleCell.alignment = { horizontal: 'center' };
  detailSheet.getRow(1).height = 25;

  detailSheet.mergeCells(2, 1, 2, allHeaders.length);
  const subTitle = detailSheet.getCell('A2');
  subTitle.value = `Generated: ${new Date().toLocaleString('en-IN')} | Filters: ${JSON.stringify(filters)}`;
  subTitle.font = { size: 9, color: { argb: 'FF666666' } };

  const headerRow = detailSheet.addRow(allHeaders);
  headerRow.height = 22;
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} };
  });

  // Columns holding a wilt reading — highlighted when severe
  const wiltCellIndexes = allHeaders
    .map((label, i) => (/wilt/i.test(label) ? i : -1))
    .filter(i => i > -1);

  const entryCells = (entry) => [
    entry._id.toString().slice(-6).toUpperCase(),
    (entry.crop || '').charAt(0).toUpperCase() + (entry.crop || '').slice(1),
    entry.discipline || '--',
    entry.season || '--',
    entry.state || '--',
    entry.district || '--',
    entry.taluka || '--',
    entry.centerName || '--',
    entry.surveyDate ? new Date(entry.surveyDate).toLocaleDateString('en-IN') : '--',
    entry.surveyorName || '--',
    entry.surveyorDesig || '--',
    entry.status || '--',
  ];

  let rowNum = 1;
  entries.forEach(entry => {
    const obs = entry.observations || [];
    // Entries without observation rows still export their survey context.
    const rows = obs.length ? obs : [{}];

    rows.forEach(o => {
      const row = detailSheet.addRow([
        rowNum++,
        ...entryCells(entry),
        // Survey context: observation row first, then the entry-level values
        ...CONTEXT_COLUMNS.map(c => cellValue(entry, o, c.key)),
        // Dynamic disease/insect columns (incl. nested pest/disease records)
        ...diseaseKeys.map(k => cellValue(entry, o, k)),
        ...TRAILING_COLUMNS.map(c => cellValue(entry, o, c.key)),
      ]);
      styleDataRow(row, rowNum);

      wiltCellIndexes.forEach(idx => {
        const wiltCell = row.getCell(idx + 1);
        if (parseFloat(wiltCell.value) >= 20) {
          wiltCell.font = { bold: true, color: { argb: 'FFDC2626' } };
          wiltCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        }
      });
    });
  });

  // Auto-width
  detailSheet.columns.forEach((col, i) => {
    col.width = i < 13 ? 16 : 14;
  });
  detailSheet.getColumn(14).width = 20; // Location
  detailSheet.getColumn(1).width = 5;
  detailSheet.getColumn(2).width = 10;
  detailSheet.getColumn(allHeaders.length).width = 40; // Remarks

  // ── Sheet 2: Summary (one row per survey entry) ────────────────────────────
  const summarySheet = wb.addWorksheet('Summary');
  summarySheet.mergeCells('A1:O1');
  const sTitle = summarySheet.getCell('A1');
  sTitle.value = 'CropLoss Management Portal – Survey Summary Report';
  sTitle.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  sTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } };
  sTitle.alignment = { horizontal: 'center' };
  summarySheet.getRow(1).height = 25;

  summarySheet.mergeCells('A2:O2');
  const sSubTitle = summarySheet.getCell('A2');
  sSubTitle.value = `Generated: ${new Date().toLocaleString('en-IN')} | Filters: ${JSON.stringify(filters)}`;
  sSubTitle.font = { size: 9, color: { argb: 'FF666666' } };

  const summaryHeaders = [
    '#', 'Crop', 'Discipline', 'Season', 'State', 'District', 'Taluka', 'Center',
    'Survey Date', 'Locations', 'Avg Wilt %', 'Max Wilt %', 'Status',
    'Submitted By', 'Approved At'
  ];
  const sh = summarySheet.addRow(summaryHeaders);
  sh.height = 20;
  sh.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top:{style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} };
  });

  entries.forEach((entry, i) => {
    const row = summarySheet.addRow([
      i + 1,
      (entry.crop || '').charAt(0).toUpperCase() + (entry.crop || '').slice(1),
      entry.discipline || '--',
      entry.season || '--',
      entry.state || '--',
      entry.district || '--',
      entry.taluka || '--',
      entry.centerName || '--',
      entry.surveyDate ? new Date(entry.surveyDate).toLocaleDateString('en-IN') : '--',
      entry.totalLocations || 0,
      (entry.avgWilt || 0).toFixed(2),
      (entry.maxWilt || 0).toFixed(2),
      entry.status || '--',
      entry.submittedByName || '--',
      entry.approvedAt ? new Date(entry.approvedAt).toLocaleDateString('en-IN') : '--',
    ]);
    styleDataRow(row, i);

    const statusCell = row.getCell(13);
    const statusColors = { approved:'FF1B5E20', rejected:'FFDC2626', needs_correction:'FFD97706', submitted:'FF1D4ED8', under_review:'FFD97706' };
    if (statusColors[entry.status]) statusCell.font = { bold: true, color: { argb: statusColors[entry.status] } };
  });

  [5,14,12,14,12,14,12,20,12,10,10,10,14,18,14].forEach((w, i) => {
    summarySheet.getColumn(i + 1).width = w;
  });

  return wb;
}

function styleDataRow(row, idx) {
  const isEven = idx % 2 === 0;
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? 'FFF1F8F1' : 'FFFFFFFF' } };
    cell.border = { top:{style:'hair'}, bottom:{style:'hair'}, left:{style:'hair'}, right:{style:'hair'} };
    cell.alignment = { vertical: 'middle', wrapText: false };
  });
}

module.exports = { generateExcelReport };
