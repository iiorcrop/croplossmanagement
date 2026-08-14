import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // v5: standalone function, NOT doc.autoTable()
import { CROP_LABEL, CROP_COLS, getColsByDiscipline } from './constants';
import { resolveField, mergeColumns } from './observationFields';

// Safe value: handles Mixed types (strings like '1-10%', numbers, null, undefined)
const sv = (v) => {
  if (v === null || v === undefined || v === '' || v === '-') return '--';
  return String(v);
};

// Resolve one report column for one observation row: the row itself, then its
// nested pest/disease records, then the entry-level survey context.
const cell = (entry, obs, key) => sv(resolveField(entry, obs, key));

// Survey-context columns shared by the detailed exports
const CONTEXT_COLUMNS = [
  { key: 'location',         label: 'Location' },
  { key: 'latitude',         label: 'Latitude' },
  { key: 'longitude',        label: 'Longitude' },
  { key: 'soilType',         label: 'Soil Type' },
  { key: 'previousCrop',     label: 'Previous Crops' },
  { key: 'variety',          label: 'Variety' },
  { key: 'irrigatedRainfed', label: 'Irrigated/Rainfed' },
  { key: 'dateOfSowing',     label: 'Date of Sowing' },
  { key: 'stageOfCrop',      label: 'Stage of Crop' },
];

// Safe filename string
const safeName = (s) => (s || 'All').replace(/[^a-zA-Z0-9]/g, '_');

const MARGIN = 14;

/**
 * Renders a table that is wider than the page by splitting its columns into
 * blocks stacked down the page, repeating the identity columns (Location …) on
 * each one. Squeezing 30+ columns into A4 landscape shreds the headers into a
 * letter-per-line smear, so we cap how narrow a column may get instead.
 *
 * @returns {number} y position below the last block
 */
const renderWideTable = (doc, {
  head, body, startY,
  identityWidths = [30],   // fixed width of each repeated leading column
  minColWidth = 16,        // narrowest a data column may become
  headStyles = {},
  continuedLabel,
}) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const identityCols = Math.min(identityWidths.length, head.length);
  const identityWidth = identityWidths.reduce((a, b) => a + b, 0);

  const usable = pageWidth - MARGIN * 2;
  const slots = Math.max(1, Math.floor((usable - identityWidth) / minColWidth));
  const slotWidth = (usable - identityWidth) / slots;

  // Free-text columns get a double slot; everything else is a fixed grid, so
  // columns line up across blocks.
  const weightOf = (label) => (/remark|detail|note/i.test(String(label)) ? 2 : 1);

  // Pack the data columns into blocks of at most `slots` weight
  const blocks = [];
  let current = [];
  let used = 0;
  for (let i = identityCols; i < head.length; i++) {
    const w = Math.min(weightOf(head[i]), slots);
    if (used + w > slots && current.length) {
      blocks.push(current);
      current = [];
      used = 0;
    }
    current.push(i);
    used += w;
  }
  if (current.length) blocks.push(current);
  if (!blocks.length) blocks.push([]);

  const fontSize = slots > 16 ? 6.5 : slots > 12 ? 7 : 8;

  let y = startY;
  for (let b = 0; b < blocks.length; b++) {
    const idx = [];
    for (let i = 0; i < identityCols; i++) idx.push(i);
    idx.push(...blocks[b]);

    if (b > 0) {
      // Continuation blocks need room for a heading plus a couple of rows
      if (y > pageHeight - 45) {
        doc.addPage();
        y = 20;
      }
      if (continuedLabel) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(90);
        doc.text(`${continuedLabel} (columns continued)`, MARGIN, y);
        y += 4;
      }
    }

    const columnStyles = {};
    identityWidths.slice(0, identityCols).forEach((w, i) => {
      columnStyles[i] = { cellWidth: w, halign: i === identityCols - 1 ? 'left' : 'center' };
    });
    idx.slice(identityCols).forEach((srcIdx, i) => {
      columnStyles[identityCols + i] = { cellWidth: slotWidth * weightOf(head[srcIdx]) };
    });

    autoTable(doc, {
      startY: y,
      head: [idx.map(i => head[i])],
      body: body.map(row => idx.map(i => row[i])),
      theme: 'grid',
      styles: { fontSize, cellPadding: 1.6, halign: 'center', valign: 'middle', overflow: 'linebreak' },
      headStyles: { fontSize: fontSize + 0.5, valign: 'middle', ...headStyles },
      columnStyles,
      tableWidth: 'wrap', // short blocks stay compact instead of stretching
      margin: { left: MARGIN, right: MARGIN },
    });

    y = ((doc.lastAutoTable && doc.lastAutoTable.finalY) || y) + 8;
  }

  return y;
};

/** Column indexes that hold at least one real value across all rows. */
const nonEmptyColumns = (body, skip = 0) => {
  const keep = new Set();
  body.forEach(row => row.forEach((v, i) => { if (i < skip || v !== '--') keep.add(i); }));
  return keep;
};

// ── Summary PDF ────────────────────────────────────────────────────────────────
export const generatePDFReport = (summaryData, label = 'All') => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const timestamp = new Date().toLocaleString();

  doc.setFontSize(18);
  doc.setTextColor(46, 125, 50);
  doc.text('CropLoss Management Portal \u2013 Analytical Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Filter: ${label} | Generated: ${timestamp}`, 14, 28);

  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text('Crop-wise Summary', 14, 40);

  const cropStats = summaryData.cropStats || [];
  const tableData = cropStats.map(cs => [
    CROP_LABEL(cs.crop),
    cs.totalEntries,
    cs.appEntries,
    cs.pendingEntries,
    cs.corrEntries,
    cs.rejEntries,
    `${(cs.avgWilt || 0).toFixed(1)}%`,
    `${(cs.maxWilt || 0).toFixed(1)}%`,
    cs.locs || 0,
    cs.centers || 0,
  ]);

  // v5 API: autoTable(doc, options)
  autoTable(doc, {
    startY: 45,
    head: [['Crop', 'Total', 'Approved', 'Pending', 'Correction', 'Rejected', 'Avg Wilt', 'Max Wilt', 'Locations', 'Centers']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2 },
  });

  const highLoss = cropStats.filter(cs => cs.maxWilt >= 20);
  if (highLoss.length > 0) {
    const prevFinalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 100;
    const nextY = prevFinalY + 15;
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text('High Loss Events (Wilt \u2265 20%)', 14, nextY);

    autoTable(doc, {
      startY: nextY + 5,
      head: [['Crop', 'Max Wilt', 'Avg Wilt', 'Total', 'Approved', 'Centers']],
      body: highLoss.map(cs => [
        CROP_LABEL(cs.crop),
        `${(cs.maxWilt || 0).toFixed(1)}%`,
        `${(cs.avgWilt || 0).toFixed(1)}%`,
        cs.totalEntries,
        cs.appEntries,
        cs.centers,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], fontSize: 9 },
      styles: { fontSize: 9 },
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('ICAR \u2013 Indian Institute of Oilseeds Research (IIOR)', 14, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 28, pageHeight - 10);
  }

  const fileName = `CropLoss_Summary_${safeName(label)}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// ── Single Entry PDF ───────────────────────────────────────────────────────────
export const generateEntryPDF = (entry) => {
  if (!entry) return;
  const doc = new jsPDF('l', 'mm', 'a4');
  const timestamp = new Date().toLocaleString();

  doc.setFontSize(18);
  doc.setTextColor(46, 125, 50);
  doc.text(`CropLoss Survey: ${CROP_LABEL(entry.crop)}`, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Center: ${entry.centerName || '--'} | District: ${entry.district || '--'} | Season: ${entry.season || '--'}`, 14, 27);
  doc.text(`Status: ${(entry.status || 'draft').toUpperCase()} | Exported: ${timestamp}`, 14, 32);

  autoTable(doc, {
    startY: 38,
    body: [
      ['State', entry.state || entry.centerState || '--', 'Survey Date', entry.surveyDate ? new Date(entry.surveyDate).toLocaleDateString() : '--'],
      ['Taluka', entry.taluka || '--', 'Submitted By', entry.submittedByName || '--'],
      ['Surveyor', entry.surveyorName || '--', 'Designation', entry.surveyorDesig || '--'],
      ['Avg Wilt', `${(entry.avgWilt || 0).toFixed(1)}%`, 'Max Wilt', `${(entry.maxWilt || 0).toFixed(1)}%`],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } },
  });

  const obs = entry.observations || [];

  // Columns follow the crop + discipline the entry was recorded against
  const entryCols = getColsByDiscipline(entry.crop, entry.discipline);
  const measureCols = [...(entryCols.disease || []), ...(entryCols.insect || [])];

  const obsBody = obs.map((row, i) => [
    i + 1,
    ...CONTEXT_COLUMNS.filter(c => c.key !== 'latitude' && c.key !== 'longitude')
      .map(c => cell(entry, row, c.key)),
    ...measureCols.map(c => cell(entry, row, c.key)),
    cell(entry, row, 'remarks'),
  ]);

  const obsY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 80;
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text('Observation Records', MARGIN, obsY);

  renderWideTable(doc, {
    head: [
      '#',
      ...CONTEXT_COLUMNS.filter(c => c.key !== 'latitude' && c.key !== 'longitude').map(c => c.label),
      ...measureCols.map(c => c.label),
      'Remarks',
    ],
    body: obsBody,
    startY: obsY + 5,
    identityWidths: [8, 28],
    headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255] },
    continuedLabel: 'Observation Records',
  });

  if (entry.workflowHistory && entry.workflowHistory.length > 0) {
    const histY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 160;
    doc.setFontSize(13);
    doc.text('Workflow History', 14, histY);
    autoTable(doc, {
      startY: histY + 5,
      head: [['Timestamp', 'Status Change', 'Actor', 'Comments']],
      body: entry.workflowHistory.map(h => [
        new Date(h.timestamp).toLocaleString(),
        `${h.fromStatus} \u2192 ${h.toStatus}`,
        h.actorName || '--',
        h.comments || '--',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [100, 100, 100], fontSize: 8 },
      styles: { fontSize: 8 },
    });
  }

  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('ICAR \u2013 IIOR CropLoss Portal', 14, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 28, pageHeight - 10);
  }

  const fileName = `Survey_${entry.district || 'Entry'}_${entry.crop}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// ── Detailed Master PDF (sample table format) ──────────────────────────────────
export const generateDetailedMasterPDF = (entries, label = 'All') => {
  if (!entries || !entries.length) return;
  const doc = new jsPDF('l', 'mm', 'a4');

  // Group by center
  const centers = [...new Set(entries.map(e => e.centerName || 'Unknown Center'))];

  centers.forEach((center, cIdx) => {
    if (cIdx > 0) doc.addPage();
    const centerEntries = entries.filter(e => (e.centerName || 'Unknown Center') === center);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(
      `Table 3.1.a. Disease situation in farmers' field in different agro climatic regions (${center}, ${label})`,
      14, 13
    );

    // Columns are scoped to the crops on this page — a union across every crop
    // would squeeze the table to an unreadable width.
    const cropColumns = [];
    centerEntries.forEach(entry => {
      const cols = CROP_COLS[entry.crop] || CROP_COLS.castor;
      cropColumns.push(...(cols.disease || []), ...(cols.insect || []));
    });
    const measureColumns = mergeColumns(cropColumns);

    const rowsPerEntry = centerEntries.map(entry => ({
      entry,
      // Entries with no observation rows still carry their survey context
      observations: (entry.observations || []).length ? entry.observations : [{}],
    }));

    // Drop measurements nobody recorded on this page
    const usedColumns = measureColumns.filter(col =>
      rowsPerEntry.some(({ entry, observations }) =>
        observations.some(obs => cell(entry, obs, col.key) !== '--')
      )
    );
    const diseaseHeaders = usedColumns.map(c => c.label);
    const diseaseKeys = usedColumns.map(c => c.key);

    const tableBody = [];
    rowsPerEntry.forEach(({ entry, observations }) => {
      observations.forEach(obs => {
        tableBody.push([
          ...CONTEXT_COLUMNS.map(c => cell(entry, obs, c.key)),
          ...diseaseKeys.map(k => cell(entry, obs, k)),
          cell(entry, obs, 'remarks'),
        ]);
      });
    });

    if (tableBody.length === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('No observation records found for this center.', 14, 22);
    } else {
      const finalY = renderWideTable(doc, {
        head: [...CONTEXT_COLUMNS.map(c => c.label), ...diseaseHeaders, 'Remarks'],
        body: tableBody,
        startY: 17,
        identityWidths: [26],
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.2 },
        continuedLabel: `${center}, ${label}`,
      });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(60);
      doc.text('CLS: Cercospora leaf spot; ALS: Alternaria leaf spot.', MARGIN, finalY - 3);
    }
  });

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `ICAR \u2013 IIOR CropLoss Portal  |  Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const fileName = `Detailed_Report_${safeName(label)}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// ── Custom Field-Selection PDF ────────────────────────────────────────────────
export const generateCustomPDF = (entries, selectedFields, label = 'Custom') => {
  if (!entries || !entries.length) return;
  const doc = new jsPDF('l', 'mm', 'a4');
  
  // Headers mapping with support for dynamic/crop-specific fields
  const fieldMap = {
    location: 'Location',
    latitude: 'Lat',
    longitude: 'Long',
    soilType: 'Soil Type',
    previousCrop: 'Prev Crop',
    variety: 'Variety',
    irrigatedRainfed: 'Irrig.',
    dateOfSowing: 'Sowing',
    stageOfCrop: 'Stage',
    // Aliases for common fields across crops
    wilt: 'Wilt',
    fusariumWilt: 'F. Wilt',
    rootRot: 'Root Rot',
    cls: 'CLS',
    als: 'ALS',
    rust: 'Rust',
    powderyMildew: 'P. Mildew',
    downyMildew: 'D. Mildew',
    leafCurl: 'Leaf Curl',
    stemRot: 'Stem Rot',
    seedlingBlight: 'Seedling Blight',
    grayMold: 'Gray Mold',
    bacterialLeafSpot: 'Bact. Leaf Spot',
    bacterialBlight: 'Bact. Blight',
    capsuleRot: 'Capsule Rot',
    capsuleBorer: 'Cap. Borer',
    semiLooper: 'Semi Looper',
    jassids: 'Jassids',
    whitefly: 'Whitefly',
    thrips: 'Thrips',
    aphids: 'Aphids',
    spodopteraLitura: 'Spodoptera',
    hairyCaterpillar: 'Hairy Cat.',
    spinyCaterpillar: 'Spiny Cat.',
    parasitization: 'Parasitization',
    visualScore: 'Visual Score',
    cropDamage: 'Crop Damage',
    newDiseaseReported: 'New Disease',
    remarks: 'Remarks'
  };

  const allRows = [];
  entries.forEach(entry => {
    // Entries with no observation rows still carry their survey context
    const obsList = (entry.observations || []).length ? entry.observations : [{}];
    obsList.forEach(obs => {
      allRows.push(selectedFields.map(f => cell(entry, obs, f)));
    });
  });

  // Selected columns that nobody recorded are dropped (and named below the
  // table) — carrying 20 empty columns is what made this report unreadable.
  const keep = nonEmptyColumns(allRows, 1);
  const shownFields = selectedFields.filter((f, i) => keep.has(i));
  const omittedFields = selectedFields.filter((f, i) => !keep.has(i));
  const headers = shownFields.map(f => fieldMap[f] || f.charAt(0).toUpperCase() + f.slice(1));
  const tableBody = allRows.map(row => row.filter((v, i) => keep.has(i)));

  doc.setFontSize(14);
  doc.setTextColor(46, 125, 50);
  doc.text(`Custom Observation Report (${label})`, MARGIN, 15);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${tableBody.length}`, MARGIN, 20);

  const endY = renderWideTable(doc, {
    head: headers,
    body: tableBody,
    startY: 25,
    identityWidths: [32],
    headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255] },
    continuedLabel: `Custom Observation Report (${label})`,
  });

  if (omittedFields.length) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120);
    doc.text(
      `No data recorded for: ${omittedFields.map(f => fieldMap[f] || f).join(', ')}`,
      MARGIN, Math.min(endY - 2, doc.internal.pageSize.height - 14),
      { maxWidth: doc.internal.pageSize.width - MARGIN * 2 }
    );
  }

  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `ICAR \u2013 IIOR CropLoss Portal  |  Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  doc.save(`Custom_Report_${new Date().getTime()}.pdf`);
};
