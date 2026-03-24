export function line(doc: PDFKit.PDFDocument) {
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').stroke();
}

export function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#111').text(title);
  doc.moveDown(0.2);
  line(doc);
  doc.moveDown(0.4);
}

export function kv(doc: PDFKit.PDFDocument, label: string, value: any) {
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#555')
    .text(`${label}:  `, { continued: true })
    .font('Helvetica')
    .fillColor('#111')
    .text(String(value ?? '...'));
}

export function table(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: (string | number)[][],
) {
  const colW = 495 / headers.length;
  const startX = 50;
  let y = doc.y + 4;

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#555');
  headers.forEach((h, i) =>
    doc.text(h, startX + i * colW, y, { width: colW - 4 }),
  );
  y += 16;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#dddddd').stroke();
  y += 6;

  doc.font('Helvetica').fillColor('#111');
  for (const row of rows) {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
    row.forEach((cell, i) => {
      doc
        .fontSize(9)
        .text(String(cell ?? '...'), startX + i * colW, y, { width: colW - 6 });
    });
    y += 16;
  }
  doc.y = y + 4;
}
