import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  PDFString,
} from 'pdf-lib';
import { fabricToPdfCoords, getTextBaselineInPdf } from '../utils/coordinateTransform.js';
import { getPdfStandardFontName, hexOrRgbToPdfColor } from '../utils/fontUtils.js';

/**
 * Converts a Data URL or base64 string to a Uint8Array
 */
function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1] || dataUrl;
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Sanitizes Unicode characters for standard PDF WinAnsi fonts
 */
function sanitizeForPdf(text) {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\xFF]/g, ' ');
}

/**
 * Primary PDF Export Engine
 * Applies text modifications, new text, shapes, annotations, images, hyperlinks,
 * and page restructuring entirely client-side.
 * 
 * @param {Object} options
 * @param {ArrayBuffer|Uint8Array} options.originalPdfBytes
 * @param {Array<Object>} options.pages Ordered list of pages with rotations & metadata
 * @param {Object} options.pageEdits Map of pageId -> array of edit objects
 * @param {Object} options.pageLinks Map of pageId -> array of link objects
 * @returns {Promise<Uint8Array>}
 */
export async function exportModifiedPdf({
  originalPdfBytes,
  pages,
  pageEdits = {},
  pageLinks = {},
}) {
  let sourceDoc = null;
  if (originalPdfBytes && originalPdfBytes.byteLength > 0) {
    try {
      sourceDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
    } catch (loadErr) {
      console.error('Error loading original PDF in exportModifiedPdf:', loadErr);
      throw new Error('Failed to read original PDF document structure: ' + loadErr.message);
    }
  }

  const hasNonBlankOriginalPages = pages.some((p) => !p.isBlank && p.originalPageIndex != null);
  if (hasNonBlankOriginalPages && !sourceDoc) {
    throw new Error('Original PDF content is missing. Cannot export without source PDF data.');
  }

  // Check if original page structure is unchanged (no pages added/deleted/reordered)
  const isOriginalStructure =
    sourceDoc &&
    pages.length === sourceDoc.getPageCount() &&
    pages.every((p, idx) => !p.isBlank && p.originalPageIndex === idx);

  // If page structure is unchanged, we modify sourceDoc directly to preserve 100% of PDF features
  // Otherwise, create a clean target document and copy pages as needed
  const exportDoc = isOriginalStructure ? sourceDoc : await PDFDocument.create();

  // Cache embedded fonts
  const fontCache = {};
  async function getFont(family, bold, italic) {
    const fontName = getPdfStandardFontName(family, bold, italic);
    if (!fontCache[fontName]) {
      fontCache[fontName] = await exportDoc.embedFont(fontName);
    }
    return fontCache[fontName];
  }

  // Standard fallback font
  const defaultFont = await exportDoc.embedFont(StandardFonts.Helvetica);

  // Process pages in order
  for (let i = 0; i < pages.length; i++) {
    const pageMeta = pages[i];
    let page;

    if (isOriginalStructure) {
      page = exportDoc.getPage(i);
    } else if (pageMeta.isBlank || pageMeta.originalPageIndex == null || !sourceDoc) {
      // Add a fresh blank page
      page = exportDoc.addPage([pageMeta.width || 612, pageMeta.height || 792]);
    } else {
      // Copy page from source document to preserve original vector content & text
      const [copiedPage] = await exportDoc.copyPages(sourceDoc, [pageMeta.originalPageIndex]);
      page = exportDoc.addPage(copiedPage);
    }

    const { width: pageWidthPt, height: pageHeightPt } = page.getSize();

    // Apply Page Rotation
    if (pageMeta.rotation != null) {
      page.setRotation(degrees(pageMeta.rotation % 360));
    }

    // Apply Edits for this page
    const edits = pageEdits[pageMeta.id] || [];
    for (const edit of edits) {
      try {
        if (edit.type === 'text-replace') {
          // --- EXISTING TEXT REPLACEMENT ---
          const coverBgColor = hexOrRgbToPdfColor(edit.bgColor || '#ffffff');
          const padding = 1.5;
          const rectX = Math.max(0, edit.x - padding);
          const rectY = Math.max(0, edit.y - padding);
          const font = await getFont(edit.fontFamily, edit.isBold, edit.isItalic);
          const fontSize = Math.max(6, edit.fontSize || 12);
          const sanitizedText = sanitizeForPdf(edit.text || '');

          // 1. Draw whiteout/background rectangle to visually cover original text
          const textWidth = font && sanitizedText ? font.widthOfTextAtSize(sanitizedText, fontSize) : 0;
          const rectW = Math.max(edit.width, textWidth) + padding * 2;
          const rectH = Math.max(edit.height, fontSize * 1.15) + padding * 2;

          page.drawRectangle({
            x: rectX,
            y: rectY,
            width: rectW,
            height: rectH,
            color: coverBgColor,
            borderColor: coverBgColor,
            borderWidth: 0,
          });

          // 2. Draw replacement text
          if (sanitizedText && sanitizedText.trim()) {
            const textColor = hexOrRgbToPdfColor(edit.fontColor || '#000000');
            const baselineY = edit.pdfBaselineY != null
              ? edit.pdfBaselineY
              : edit.y + (edit.height * 0.18);

            page.drawText(sanitizedText, {
              x: edit.x,
              y: baselineY,
              size: fontSize,
              font: font || defaultFont,
              color: textColor,
            });
          }
        } else if (edit.type === 'textbox') {
          // --- INSERTED TEXT BOX ---
          const font = await getFont(edit.fontFamily, edit.isBold, edit.isItalic);
          const textColor = hexOrRgbToPdfColor(edit.fill || edit.fontColor || '#000000');
          const fontSize = Math.max(6, edit.fontSize || 14);

          // Convert canvas coordinates (scale 1.0) to PDF coordinates
          const coords = fabricToPdfCoords(
            { left: edit.left, top: edit.top, width: edit.width, height: edit.height },
            1.0,
            pageHeightPt,
            pageWidthPt,
            0
          );

          const rawText = sanitizeForPdf(edit.text || '');
          const lines = rawText.split('\n');
          const lineHeightPt = fontSize * (edit.lineHeight || 1.2);
          const startBaselineY = getTextBaselineInPdf(edit.top, fontSize, 1.0, pageHeightPt);

          lines.forEach((line, lineIdx) => {
            if (line) {
              page.drawText(line, {
                x: coords.x,
                y: startBaselineY - lineIdx * lineHeightPt,
                size: fontSize,
                font: font || defaultFont,
                color: textColor,
                rotate: edit.angle ? degrees(-edit.angle) : undefined,
              });
            }
          });
        } else if (edit.type === 'rect') {
          // --- RECTANGLE / HIGHLIGHTER ---
          const coords = fabricToPdfCoords(edit, 1.0, pageHeightPt, pageWidthPt, 0);
          const fillColor = edit.fill && edit.fill !== 'transparent' ? hexOrRgbToPdfColor(edit.fill) : undefined;
          const strokeColor = edit.stroke && edit.stroke !== 'transparent' ? hexOrRgbToPdfColor(edit.stroke) : undefined;

          page.drawRectangle({
            x: coords.x,
            y: coords.y,
            width: coords.width,
            height: coords.height,
            color: fillColor,
            borderColor: strokeColor,
            borderWidth: edit.strokeWidth || 0,
            opacity: edit.opacity != null ? edit.opacity : 1.0,
            borderOpacity: edit.opacity != null ? edit.opacity : 1.0,
            rotate: edit.angle ? degrees(-edit.angle) : undefined,
          });
        } else if (edit.type === 'circle' || edit.type === 'ellipse') {
          // --- CIRCLE / ELLIPSE ---
          const coords = fabricToPdfCoords(edit, 1.0, pageHeightPt, pageWidthPt, 0);
          const fillColor = edit.fill && edit.fill !== 'transparent' ? hexOrRgbToPdfColor(edit.fill) : undefined;
          const strokeColor = edit.stroke && edit.stroke !== 'transparent' ? hexOrRgbToPdfColor(edit.stroke) : undefined;

          page.drawEllipse({
            x: coords.x + coords.width / 2,
            y: coords.y + coords.height / 2,
            xScale: coords.width / 2,
            yScale: coords.height / 2,
            color: fillColor,
            borderColor: strokeColor,
            borderWidth: edit.strokeWidth || 0,
            opacity: edit.opacity != null ? edit.opacity : 1.0,
            borderOpacity: edit.opacity != null ? edit.opacity : 1.0,
          });
        } else if (edit.type === 'line' || edit.type === 'arrow') {
          // --- LINE / ARROW ---
          const x1Pt = edit.x1;
          const y1Pt = pageHeightPt - edit.y1;
          const x2Pt = edit.x2;
          const y2Pt = pageHeightPt - edit.y2;
          const strokeColor = hexOrRgbToPdfColor(edit.stroke || '#000000');
          const thickness = edit.strokeWidth || 2;

          page.drawLine({
            start: { x: x1Pt, y: y1Pt },
            end: { x: x2Pt, y: y2Pt },
            thickness: thickness,
            color: strokeColor,
            opacity: edit.opacity != null ? edit.opacity : 1.0,
          });

          // Draw arrowhead if arrow
          if (edit.type === 'arrow') {
            const angle = Math.atan2(y2Pt - y1Pt, x2Pt - x1Pt);
            const headLen = Math.max(10, thickness * 4);
            const arrowX1 = x2Pt - headLen * Math.cos(angle - Math.PI / 6);
            const arrowY1 = y2Pt - headLen * Math.sin(angle - Math.PI / 6);
            const arrowX2 = x2Pt - headLen * Math.cos(angle + Math.PI / 6);
            const arrowY2 = y2Pt - headLen * Math.sin(angle + Math.PI / 6);

            page.drawLine({
              start: { x: x2Pt, y: y2Pt },
              end: { x: arrowX1, y: arrowY1 },
              thickness: thickness,
              color: strokeColor,
            });
            page.drawLine({
              start: { x: x2Pt, y: y2Pt },
              end: { x: arrowX2, y: arrowY2 },
              thickness: thickness,
              color: strokeColor,
            });
          }
        } else if (edit.type === 'image') {
          // --- IMAGE INSERTION ---
          const coords = fabricToPdfCoords(edit, 1.0, pageHeightPt, pageWidthPt, 0);
          const imageBytes = dataUrlToUint8Array(edit.dataUrl);

          let embeddedImage;
          if (edit.dataUrl.includes('image/png')) {
            embeddedImage = await exportDoc.embedPng(imageBytes);
          } else {
            embeddedImage = await exportDoc.embedJpg(imageBytes);
          }

          page.drawImage(embeddedImage, {
            x: coords.x,
            y: coords.y,
            width: coords.width,
            height: coords.height,
            opacity: edit.opacity != null ? edit.opacity : 1.0,
            rotate: edit.angle ? degrees(-edit.angle) : undefined,
          });
        }
      } catch (err) {
        console.warn('Error applying edit object to page:', err);
      }
    }

    // Apply Hyperlinks for this page
    const links = pageLinks[pageMeta.id] || [];
    for (const link of links) {
      if (link.isDeleted || !link.url) continue;

      try {
        // Compute PDF points rectangle [x1, y1, x2, y2]
        const left = link.left;
        const width = link.width;
        const height = link.height;
        const top = link.top;

        const x1 = left;
        const x2 = left + width;
        const y2 = pageHeightPt - top;
        const y1 = pageHeightPt - (top + height);

        const linkAnnot = exportDoc.context.obj({
          Type: 'Annot',
          Subtype: 'Link',
          Rect: [x1, y1, x2, y2],
          Border: [0, 0, 0],
          A: {
            Type: 'Action',
            S: 'URI',
            URI: PDFString.of(link.url.trim()),
          },
        });

        const linkRef = exportDoc.context.register(linkAnnot);
        page.node.addAnnot(linkRef);
      } catch (linkErr) {
        console.warn('Error embedding link annotation:', linkErr);
      }
    }
  }

  return await exportDoc.save();
}

/**
 * Triggers a browser download of the generated PDF
 * @param {Uint8Array} pdfBytes 
 * @param {string} filename 
 */
export function downloadPdfBlob(pdfBytes, filename = 'document-edited.pdf') {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke object URL after delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 3000);
}
