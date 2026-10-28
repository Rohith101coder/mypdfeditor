import assert from 'node:assert';
import {
  fabricToPdfCoords,
  pdfToFabricCoords,
  getTextBaselineInPdf,
  pdfAnnotationRectToCanvas,
  canvasRectToPdfAnnotationRect,
} from '../src/utils/coordinateTransform.js';
import {
  isValidUrl,
  normalizeUrl,
} from '../src/services/pdfLinkManager.js';
import {
  getPdfStandardFontName,
  hexOrRgbToPdfColor,
} from '../src/utils/fontUtils.js';
import {
  exportModifiedPdf,
} from '../src/services/pdfExporter.js';
import {
  generateSamplePdfBytes,
} from '../src/services/samplePdfGenerator.js';
import {
  PDFDocument,
  StandardFonts,
} from 'pdf-lib';

async function runAllTests() {
  console.log('🧪 Starting PaperEdit Automated Test Suite...\n');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error('    Error:', err.message);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error('    Error:', err.message);
    }
  }

  // --- 1. Coordinate Transformations ---
  console.log('--- 1. Coordinate Transformation Tests ---');

  test('fabricToPdfCoords converts top-left pixels to bottom-left PDF points correctly', () => {
    const pageHeight = 792;
    const pageWidth = 612;
    const fabricObj = { left: 50, top: 100, width: 200, height: 40, scaleX: 1, scaleY: 1 };
    const scale = 1.0;

    const pdfCoords = fabricToPdfCoords(fabricObj, scale, pageHeight, pageWidth, 0);
    assert.strictEqual(pdfCoords.x, 50, 'x coordinate should match left');
    // y in PDF is bottom edge = 792 - (100 + 40) = 652
    assert.strictEqual(pdfCoords.y, 652, 'y coordinate should be inverted from bottom-left');
    assert.strictEqual(pdfCoords.width, 200, 'width should match');
    assert.strictEqual(pdfCoords.height, 40, 'height should match');
  });

  test('fabricToPdfCoords handles 90 degree clockwise rotation', () => {
    const pageHeight = 792;
    const pageWidth = 612;
    const fabricObj = { left: 50, top: 100, width: 200, height: 40, scaleX: 1, scaleY: 1 };

    const rotated = fabricToPdfCoords(fabricObj, 1.0, pageHeight, pageWidth, 90);
    assert.strictEqual(rotated.x, 100);
    assert.strictEqual(rotated.y, 50);
    assert.strictEqual(rotated.width, 40);
    assert.strictEqual(rotated.height, 200);
  });

  test('pdfToFabricCoords accurately inverts PDF coordinates back to screen pixels', () => {
    const pageHeight = 792;
    const pdfRect = { x: 50, y: 652, width: 200, height: 40 };
    const fabricCoords = pdfToFabricCoords(pdfRect, 1.0, pageHeight);

    assert.strictEqual(fabricCoords.left, 50);
    assert.strictEqual(fabricCoords.top, 100);
    assert.strictEqual(fabricCoords.width, 200);
    assert.strictEqual(fabricCoords.height, 40);
  });

  test('getTextBaselineInPdf calculates correct baseline for standard font size', () => {
    const pageHeight = 792;
    const top = 100;
    const fontSize = 16;
    const baseline = getTextBaselineInPdf(top, fontSize, 1.0, pageHeight);

    // baselineFromTop = 100 + 16 * 0.82 = 113.12
    // y = 792 - 113.12 = 678.88
    assert.ok(Math.abs(baseline - 678.88) < 0.1);
  });

  test('pdfAnnotationRectToCanvas converts [x1, y1, x2, y2] to viewport bounds', () => {
    const pageHeight = 792;
    const annotRect = [50, 700, 250, 750]; // bottom=700, top=750
    const canvasBounds = pdfAnnotationRectToCanvas(annotRect, 1.0, pageHeight);

    assert.strictEqual(canvasBounds.left, 50);
    assert.strictEqual(canvasBounds.top, 42); // 792 - 750 = 42
    assert.strictEqual(canvasBounds.width, 200);
    assert.strictEqual(canvasBounds.height, 50);
  });

  // --- 2. Hyperlink Manager Tests ---
  console.log('\n--- 2. Hyperlink Validation & Manager Tests ---');

  test('isValidUrl recognizes valid http and https URLs', () => {
    assert.strictEqual(isValidUrl('https://github.com'), true);
    assert.strictEqual(isValidUrl('http://example.org/path?q=1'), true);
    assert.strictEqual(isValidUrl('mailto:test@example.com'), true);
  });

  test('isValidUrl rejects invalid or non-URL strings', () => {
    assert.strictEqual(isValidUrl('not-a-url'), false);
    assert.strictEqual(isValidUrl('javascript:alert(1)'), false);
    assert.strictEqual(isValidUrl(''), false);
  });

  test('normalizeUrl appends https:// when missing protocol', () => {
    assert.strictEqual(normalizeUrl('github.com'), 'https://github.com');
    assert.strictEqual(normalizeUrl('https://test.com'), 'https://test.com');
  });

  // --- 3. Font & Color Mapping Tests ---
  console.log('\n--- 3. Font and Color Utility Tests ---');

  test('getPdfStandardFontName maps font families and styles correctly', () => {
    assert.strictEqual(getPdfStandardFontName('Helvetica', false, false), StandardFonts.Helvetica);
    assert.strictEqual(getPdfStandardFontName('Helvetica', true, false), StandardFonts.HelveticaBold);
    assert.strictEqual(getPdfStandardFontName('Helvetica', false, true), StandardFonts.HelveticaOblique);
    assert.strictEqual(getPdfStandardFontName('Times-Roman', false, false), StandardFonts.TimesRoman);
    assert.strictEqual(getPdfStandardFontName('Times New Roman', true, false), StandardFonts.TimesRomanBold);
    assert.strictEqual(getPdfStandardFontName('Courier', false, false), StandardFonts.Courier);
  });

  test('hexOrRgbToPdfColor parses hex and rgb strings accurately', () => {
    const black = hexOrRgbToPdfColor('#000000');
    assert.strictEqual(black.red, 0);
    assert.strictEqual(black.green, 0);
    assert.strictEqual(black.blue, 0);

    const white = hexOrRgbToPdfColor('#ffffff');
    assert.strictEqual(white.red, 1);
    assert.strictEqual(white.green, 1);
    assert.strictEqual(white.blue, 1);

    const blue = hexOrRgbToPdfColor('rgb(0, 102, 204)');
    assert.ok(Math.abs(blue.red - 0) < 0.01);
    assert.ok(Math.abs(blue.green - 0.4) < 0.01);
    assert.ok(Math.abs(blue.blue - 0.8) < 0.01);
  });

  // --- 4. Sample PDF Generator & Document Tests ---
  console.log('\n--- 4. Sample PDF Generator Tests ---');

  await testAsync('generateSamplePdfBytes creates valid multi-page PDF', async () => {
    const bytes = await generateSamplePdfBytes();
    assert.ok(bytes instanceof Uint8Array, 'Output must be Uint8Array');
    assert.ok(bytes.length > 1000, 'Sample PDF should contain valid bytes');

    // Verify PDF can be loaded back
    const doc = await PDFDocument.load(bytes);
    assert.strictEqual(doc.getPageCount(), 2, 'Sample PDF must have exactly 2 pages');
  });

  // --- 5. PDF Modification, Page Operations, and Exporter Tests ---
  console.log('\n--- 5. PDF Export & Modification Engine Tests ---');

  await testAsync('exportModifiedPdf applies text replacements, links, shapes, and page modifications', async () => {
    const initialBytes = await generateSamplePdfBytes();

    const pages = [
      { id: 'page-1', originalPageIndex: 0, rotation: 0, width: 612, height: 792, isBlank: false },
      { id: 'page-2', originalPageIndex: 1, rotation: 90, width: 612, height: 792, isBlank: false }, // rotated 90 deg
      { id: 'page-3', originalPageIndex: null, rotation: 0, width: 612, height: 792, isBlank: true }, // new blank page
    ];

    const pageEdits = {
      'page-1': [
        {
          type: 'text-replace',
          originalText: '$4,500.00 USD',
          text: '$9,950.00 USD',
          x: 50,
          y: 630,
          width: 120,
          height: 18,
          fontSize: 14,
          fontColor: '#16a34a',
          bgColor: '#ffffff',
          fontFamily: 'Helvetica',
          isBold: true,
        },
        {
          type: 'rect',
          left: 50,
          top: 200,
          width: 150,
          height: 80,
          fill: '#eff6ff',
          stroke: '#2563eb',
          strokeWidth: 2,
          opacity: 0.9,
        },
        {
          type: 'textbox',
          text: 'New Inserted Text Box\nLine 2',
          left: 60,
          top: 210,
          width: 130,
          height: 40,
          fontSize: 12,
          fill: '#1e3a8a',
          fontFamily: 'Helvetica',
          isBold: true,
        },
      ],
      'page-3': [
        {
          type: 'textbox',
          text: 'This is a brand new blank page!',
          left: 100,
          top: 100,
          fontSize: 18,
          fill: '#0f172a',
        },
      ],
    };

    const pageLinks = {
      'page-1': [
        {
          id: 'test-custom-link',
          url: 'https://deepmind.google',
          left: 50,
          top: 200,
          width: 150,
          height: 80,
          isDeleted: false,
        },
      ],
    };

    const exportedBytes = await exportModifiedPdf({
      originalPdfBytes: initialBytes,
      pages,
      pageEdits,
      pageLinks,
    });

    assert.ok(exportedBytes instanceof Uint8Array, 'Exported output must be Uint8Array');
    assert.ok(exportedBytes.length > 1000, 'Exported PDF must have valid content');

    // Reload and verify the exported document structure
    const reloadedDoc = await PDFDocument.load(exportedBytes);
    assert.strictEqual(reloadedDoc.getPageCount(), 3, 'Must have 3 pages (2 original + 1 blank)');

    const reloadedP1 = reloadedDoc.getPage(0);
    assert.strictEqual(reloadedP1.getRotation().angle, 0, 'Page 1 rotation should be 0');

    const reloadedP2 = reloadedDoc.getPage(1);
    assert.strictEqual(reloadedP2.getRotation().angle, 90, 'Page 2 rotation should be 90');

    const reloadedP3 = reloadedDoc.getPage(2);
    assert.strictEqual(reloadedP3.getRotation().angle, 0, 'Page 3 rotation should be 0');
  });

  await testAsync('exportModifiedPdf preserves all original text content when editing existing text and adding new text', async () => {
    const initialBytes = await generateSamplePdfBytes();

    const pages = [
      { id: 'page-1', originalPageIndex: 0, rotation: 0, width: 612, height: 792, isBlank: false },
      { id: 'page-2', originalPageIndex: 1, rotation: 0, width: 612, height: 792, isBlank: false },
    ];

    const pageEdits = {
      'page-1': [
        {
          type: 'text-replace',
          originalText: 'PaperEdit Sample Document',
          text: 'Edited Document Title',
          x: 60,
          y: 720,
          width: 300,
          height: 25,
          fontSize: 22,
          fontColor: '#000000',
          bgColor: '#ffffff',
          fontFamily: 'Helvetica',
          isBold: true,
        },
        {
          type: 'textbox',
          text: 'Brand New Custom Text Added',
          left: 60,
          top: 300,
          width: 200,
          height: 30,
          fontSize: 14,
          fill: '#2563eb',
        },
      ],
    };

    const exportedBytes = await exportModifiedPdf({
      originalPdfBytes: initialBytes.slice(0),
      pages,
      pageEdits,
    });

    assert.ok(exportedBytes.length > 2000, 'Exported PDF should be complete');

    // Reload with PDFDocument
    const doc = await PDFDocument.load(exportedBytes);
    assert.strictEqual(doc.getPageCount(), 2, 'Page count must remain 2');
  });

  await testAsync('exportModifiedPdf throws descriptive error if originalPdfBytes is empty for existing document', async () => {
    const pages = [
      { id: 'page-1', originalPageIndex: 0, rotation: 0, width: 612, height: 792, isBlank: false },
    ];

    let threw = false;
    try {
      await exportModifiedPdf({
        originalPdfBytes: new Uint8Array(0),
        pages,
        pageEdits: {},
      });
    } catch (err) {
      threw = true;
      assert.ok(err.message.includes('missing') || err.message.includes('structure'), 'Error message must explain missing data');
    }

    assert.strictEqual(threw, true, 'Must throw error when original bytes are empty');
  });

  // Final Summary
  console.log(`\n===========================================`);
  console.log(`🎉 TEST RESULTS: ${passed}/${total} TESTS PASSED!`);
  console.log(`===========================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
