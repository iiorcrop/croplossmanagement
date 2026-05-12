import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // v5: standalone function, NOT doc.autoTable()
import { CROP_LABEL, CROP_COLS } from './constants';

// Safe value: handles Mixed types (strings like '1-10%', numbers, null, undefined)
const sv = (v) => {
  if (v === null || v === undefined || v === '' || v === '-') return '--';
  return String(v);
};

// Safe filename string
const safeName = (s) => (s || 'All').replace(/[^a-zA-Z0-9]/g, '_');

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
      ['State', entry.centerState || '--', 'Survey Date', entry.surveyDate ? new Date(entry.surveyDate).toLocaleDateString() : '--'],
      ['Taluka', entry.taluka || '--', 'Submitted By', entry.submittedByName || '--'],
      ['Surveyor', entry.surveyorName || '--', 'Designation', entry.surveyorDesig || '--'],
      ['Avg Wilt', `${(entry.avgWilt || 0).toFixed(1)}%`, 'Max Wilt', `${(entry.maxWilt || 0).toFixed(1)}%`],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } },
  });

  const obs = entry.observations || [];
  const obsBody = obs.map((row, i) => [
    i + 1,
    sv(row.location), sv(row.soilType), sv(row.previousCrop), sv(row.variety),
    sv(row.irrigatedRainfed), sv(row.dateOfSowing), sv(row.stageOfCrop),
    sv(row.wilt), sv(row.rootRot), sv(row.cls), sv(row.als), sv(row.remarks),
  ]);

  const obsY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 80;
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text('Observation Records', 14, obsY);

  autoTable(doc, {
    startY: obsY + 5,
    head: [['#', 'Location', 'Soil', 'Prev Crop', 'Variety', 'Irrig.', 'Sowing', 'Stage', 'Wilt', 'Root Rot', 'CLS', 'ALS', 'Remarks']],
    body: obsBody,
    theme: 'grid',
    headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 1.5 },
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

  // Prepare dynamic disease/insect columns across all entries
  const allDiseaseMap = new Map(); // key -> label
  entries.forEach(entry => {
    const cols = CROP_COLS[entry.crop] || CROP_COLS.castor;
    [...(cols.disease || []), ...(cols.insect || [])].forEach(c => {
      if (!allDiseaseMap.has(c.key)) allDiseaseMap.set(c.key, c.label);
    });
  });
  const diseaseHeaders = [...allDiseaseMap.entries()].map(([k, l]) => l);
  const diseaseKeys = [...allDiseaseMap.keys()];

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

    const tableBody = [];
    centerEntries.forEach(entry => {
      (entry.observations || []).forEach(obs => {
        tableBody.push([
          sv(obs.location),
          sv(obs.latitude),
          sv(obs.longitude),
          sv(obs.soilType),
          sv(obs.previousCrop),
          sv(obs.variety),
          sv(obs.irrigatedRainfed),
          sv(obs.dateOfSowing),
          sv(obs.stageOfCrop),
          ...diseaseKeys.map(k => sv(obs[k]))
        ]);
      });
    });

    if (tableBody.length === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('No observation records found for this center.', 14, 22);
    } else {
      const result = autoTable(doc, {
        startY: 17,
        head: [['Location', 'Latitude', 'Longitude', 'Soil Type', 'Previous Crops', 'Variety',
          'Irrigated/Rainfed', 'Date of Sowing', 'Stage of Crop', ...diseaseHeaders]],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center', overflow: 'linebreak' },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.2, fontSize: 8 },
        columnStyles: {
          0: { halign: 'left', cellWidth: 22 },
          1: { cellWidth: 16 }, 2: { cellWidth: 16 },
          3: { cellWidth: 18 }, 4: { cellWidth: 22 },
          5: { cellWidth: 18 }, 6: { cellWidth: 18 },
          7: { cellWidth: 20 }, 8: { cellWidth: 20 },
          9: { cellWidth: 14 }, 10: { cellWidth: 16 },
          11: { cellWidth: 12 }, 12: { cellWidth: 12 },
        },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0);
            doc.text(`(Continued) ${center}, ${label}`, 14, 10);
          }
        },
      });

      const finalY = result.lastAutoTable.finalY || 200;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(60);
      doc.text('CLS: Cercospora leaf spot; ALS: Alternaria leaf spot.', 14, finalY + 5);
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
    capsuleBorer: 'Cap. Borer',
    semiLooper: 'Semi Looper',
    jassids: 'Jassids',
    whitefly: 'Whitefly',
    thrips: 'Thrips',
    aphids: 'Aphids',
    remarks: 'Remarks'
  };

  const headers = selectedFields.map(f => fieldMap[f] || f.charAt(0).toUpperCase() + f.slice(1));
  const tableBody = [];

  entries.forEach(entry => {
    (entry.observations || []).forEach(obs => {
      tableBody.push(selectedFields.map(f => {
        // Special logic: if 'wilt' is selected but missing, try 'fusariumWilt'
        if (f === 'wilt' && obs[f] === undefined && obs['fusariumWilt'] !== undefined) return sv(obs['fusariumWilt']);
        // If 'cls' is selected but missing, try 'cercosporaLeafSpot'
        if (f === 'cls' && obs[f] === undefined && obs['cercosporaLeafSpot'] !== undefined) return sv(obs['cercosporaLeafSpot']);
        // If 'als' is selected but missing, try 'alternariaLeafSpot'
        if (f === 'als' && obs[f] === undefined && obs['alternariaLeafSpot'] !== undefined) return sv(obs['alternariaLeafSpot']);
        
        return sv(obs[f]);
      }));
    });
  });

  doc.setFontSize(14);
  doc.setTextColor(46, 125, 50);
  doc.text(`Custom Observation Report (${label})`, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${tableBody.length}`, 14, 20);

  autoTable(doc, {
    startY: 25,
    head: [headers],
    body: tableBody,
    theme: 'grid',
    styles: { 
      fontSize: selectedFields.length > 10 ? 7 : 8, 
      cellPadding: 1.5, 
      halign: 'center',
      overflow: 'linebreak'
    },
    headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255] },
    columnStyles: {
      0: { halign: 'left' }
    }
  });

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
