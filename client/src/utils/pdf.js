import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Generates a formatted PDF report (title + table) and triggers a download.
// Mirrors downloadCsv's signature (columns: [{label, value(row)}], rows)
// so each report section can offer both exports from the same data shape.
export function downloadPdf(filename, title, columns, rows, { subtitle } = {}) {
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });

  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('S Prince Hightech', 14, 16);

  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(title, 14, 24);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(subtitle, 14, 30);
    doc.setTextColor(0);
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated ${new Date().toLocaleString('en-IN')}`, 14, subtitle ? 36 : 30);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: subtitle ? 40 : 34,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => {
      const v = c.value(row);
      return v === null || v === undefined ? '' : String(v);
    })),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229] }, // indigo-600, matches the Reports module accent
    alternateRowStyles: { fillColor: [245, 245, 250] },
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
