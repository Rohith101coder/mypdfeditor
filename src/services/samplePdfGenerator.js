import { PDFDocument, StandardFonts, rgb, PDFString } from 'pdf-lib';

/**
 * Generates a clean 2-page sample PDF locally in browser memory for instant testing
 * @returns {Promise<Uint8Array>}
 */
export async function generateSamplePdfBytes() {
  const doc = await PDFDocument.create();

  // Embed standard fonts
  const fontHelveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontHelvetica = await doc.embedFont(StandardFonts.Helvetica);
  const fontCourier = await doc.embedFont(StandardFonts.Courier);

  // --- PAGE 1 ---
  const page1 = doc.addPage([612, 792]); // Standard US Letter
  const { width: p1Width, height: p1Height } = page1.getSize();

  // Top Decorative Banner
  page1.drawRectangle({
    x: 40,
    y: p1Height - 100,
    width: p1Width - 80,
    height: 60,
    color: rgb(0.93, 0.95, 0.99),
    borderColor: rgb(0.23, 0.51, 0.96),
    borderWidth: 1.5,
  });

  page1.drawText('PaperEdit Sample Document', {
    x: 60,
    y: p1Height - 65,
    size: 22,
    font: fontHelveticaBold,
    color: rgb(0.09, 0.18, 0.36),
  });

  page1.drawText('Professional 100% In-Browser PDF Editing Platform', {
    x: 60,
    y: p1Height - 85,
    size: 11,
    font: fontHelvetica,
    color: rgb(0.35, 0.45, 0.6),
  });

  // Section 1: Existing Text Editing
  let y = p1Height - 140;
  page1.drawText('1. Existing Text Modification & Replacement', {
    x: 50,
    y,
    size: 15,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.16, 0.23),
  });

  y -= 24;
  page1.drawText(
    'Click on any sentence in this document to test direct visual text replacement.',
    {
      x: 50,
      y,
      size: 11,
      font: fontHelvetica,
      color: rgb(0.2, 0.25, 0.3),
    }
  );

  y -= 20;
  page1.drawText(
    'Original Amount: $4,500.00 USD (Try editing this number or changing its color)',
    {
      x: 50,
      y,
      size: 12,
      font: fontCourier,
      color: rgb(0.85, 0.15, 0.15),
    }
  );

  y -= 20;
  page1.drawText(
    'Status: Pending Approval by Engineering Committee',
    {
      x: 50,
      y,
      size: 11,
      font: fontHelvetica,
      color: rgb(0.25, 0.3, 0.35),
    }
  );

  // Section 2: Hyperlinks
  y -= 40;
  page1.drawText('2. Interactive Hyperlink Management', {
    x: 50,
    y,
    size: 15,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.16, 0.23),
  });

  y -= 24;
  page1.drawText(
    'Below are real PDF link annotations. You can inspect, modify, or add new links:',
    {
      x: 50,
      y,
      size: 11,
      font: fontHelvetica,
      color: rgb(0.2, 0.25, 0.3),
    }
  );

  y -= 24;
  // Link 1: GitHub
  const link1Text = 'Visit GitHub Open Source Repository';
  page1.drawText(link1Text, {
    x: 50,
    y,
    size: 11,
    font: fontHelveticaBold,
    color: rgb(0.15, 0.4, 0.9),
  });
  // Underline
  page1.drawLine({
    start: { x: 50, y: y - 2 },
    end: { x: 260, y: y - 2 },
    thickness: 1,
    color: rgb(0.15, 0.4, 0.9),
  });

  // Attach Link 1 annotation
  const link1Annot = doc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [50, y - 4, 260, y + 14],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of('https://github.com'),
    },
  });
  page1.node.addAnnot(doc.context.register(link1Annot));

  y -= 26;
  // Link 2: PDF-lib
  const link2Text = 'Explore PDF-Lib Documentation';
  page1.drawText(link2Text, {
    x: 50,
    y,
    size: 11,
    font: fontHelveticaBold,
    color: rgb(0.15, 0.4, 0.9),
  });
  page1.drawLine({
    start: { x: 50, y: y - 2 },
    end: { x: 235, y: y - 2 },
    thickness: 1,
    color: rgb(0.15, 0.4, 0.9),
  });

  const link2Annot = doc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [50, y - 4, 235, y + 14],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of('https://pdf-lib.js.org'),
    },
  });
  page1.node.addAnnot(doc.context.register(link2Annot));

  // Section 3: Visual modification area
  y -= 45;
  page1.drawText('3. Visual Annotations & Shapes Showcase', {
    x: 50,
    y,
    size: 15,
    font: fontHelveticaBold,
    color: rgb(0.12, 0.16, 0.23),
  });

  y -= 24;
  page1.drawText(
    'Use the left toolbar to draw rectangles, arrows, freehand signatures, or insert images.',
    {
      x: 50,
      y,
      size: 11,
      font: fontHelvetica,
      color: rgb(0.2, 0.25, 0.3),
    }
  );

  // Sample card with border
  y -= 90;
  page1.drawRectangle({
    x: 50,
    y,
    width: p1Width - 100,
    height: 75,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page1.drawText('CONFIDENTIAL REVIEW', {
    x: 70,
    y: y + 50,
    size: 10,
    font: fontHelveticaBold,
    color: rgb(0.7, 0.2, 0.2),
  });

  page1.drawText('All edits made in PaperEdit run 100% on your device.', {
    x: 70,
    y: y + 32,
    size: 11,
    font: fontHelvetica,
    color: rgb(0.2, 0.25, 0.3),
  });

  page1.drawText('Zero server uploads. 100% private, client-side browser memory processing.', {
    x: 70,
    y: y + 16,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Footer
  page1.drawText('Page 1 of 2 — PaperEdit Sample Document', {
    x: 50,
    y: 35,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.5, 0.55, 0.6),
  });

  // --- PAGE 2 ---
  const page2 = doc.addPage([612, 792]);
  const { width: p2Width, height: p2Height } = page2.getSize();

  page2.drawText('Page 2: Page Management & Multi-Page Testing', {
    x: 50,
    y: p2Height - 65,
    size: 20,
    font: fontHelveticaBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  page2.drawText(
    'Test page reordering, page rotation (90° CW/CCW), page duplication, and deletion.',
    {
      x: 50,
      y: p2Height - 90,
      size: 11,
      font: fontHelvetica,
      color: rgb(0.3, 0.35, 0.4),
    }
  );

  // Feature summary grid
  const boxY = p2Height - 250;
  page2.drawRectangle({
    x: 50,
    y: boxY,
    width: p2Width - 100,
    height: 140,
    color: rgb(0.95, 0.97, 1.0),
    borderColor: rgb(0.75, 0.85, 0.98),
    borderWidth: 1,
  });

  page2.drawText('Supported Capabilities in this Editor:', {
    x: 70,
    y: boxY + 110,
    size: 13,
    font: fontHelveticaBold,
    color: rgb(0.15, 0.35, 0.8),
  });

  const bullets = [
    '• Hybrid Existing Text Editing (background whiteout matching + sharp vector text)',
    '• Clickable Link Annotation creation, URL updates, and positioning',
    '• Rectangles, Circles, Arrows, Lines, Freehand Highlighter, and Eraser',
    '• Device Image insertion (PNG/JPEG) with aspect-ratio preserving scaling',
    '• Page reordering, page rotation, duplicate page, add blank page, delete page',
    '• Full Undo / Redo history stack and high-fidelity PDF-Lib vector export',
  ];

  bullets.forEach((b, idx) => {
    page2.drawText(b, {
      x: 70,
      y: boxY + 86 - idx * 16,
      size: 10,
      font: fontHelvetica,
      color: rgb(0.2, 0.25, 0.3),
    });
  });

  // Footer
  page2.drawText('Page 2 of 2 — PaperEdit Sample Document', {
    x: 50,
    y: 35,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.5, 0.55, 0.6),
  });

  return await doc.save();
}
