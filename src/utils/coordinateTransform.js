/**
 * Coordinate Transformation Utilities for PaperEdit
 * 
 * Accurately translates between:
 * 1. Screen / Fabric Canvas coordinates (pixels, top-left origin, zoom-scaled)
 * 2. PDF Points (72 dpi, bottom-left origin in PDF-lib)
 * 3. Handles page rotations (0, 90, 180, 270 degrees)
 */

/**
 * Converts Fabric Canvas coordinates to PDF-lib coordinates (Points, bottom-left origin)
 * 
 * @param {Object} fabricObj - Fabric object bounds { left, top, width, height, scaleX, scaleY }
 * @param {number} scale - Current rendering zoom scale (e.g. 1.0, 1.5)
 * @param {number} pageHeightPt - Original unscaled PDF page height in points
 * @param {number} pageWidthPt - Original unscaled PDF page width in points
 * @param {number} rotation - Page rotation in degrees (0, 90, 180, 270)
 * @returns {Object} PDF coordinates { x, y, width, height }
 */
export function fabricToPdfCoords(fabricObj, scale, pageHeightPt, pageWidthPt, rotation = 0) {
  const objLeft = fabricObj.left || 0;
  const objTop = fabricObj.top || 0;
  const objWidth = (fabricObj.width || 0) * (fabricObj.scaleX || 1);
  const objHeight = (fabricObj.height || 0) * (fabricObj.scaleY || 1);

  // Unscaled pixel dimensions in points (1 canvas pixel at scale 1.0 = 1 PDF point)
  const xPt = objLeft / scale;
  const yPt = objTop / scale;
  const wPt = objWidth / scale;
  const hPt = objHeight / scale;

  // In PDF (pdf-lib):
  // Origin (0,0) is bottom-left of the page.
  // When drawing shapes/images/rects in pdf-lib:
  // x: left edge
  // y: bottom edge = pageHeight - (top + height)
  const normRot = ((rotation % 360) + 360) % 360;

  if (normRot === 0) {
    return {
      x: xPt,
      y: pageHeightPt - (yPt + hPt),
      width: wPt,
      height: hPt,
    };
  } else if (normRot === 90) {
    // 90 deg clockwise
    return {
      x: yPt,
      y: xPt,
      width: hPt,
      height: wPt,
    };
  } else if (normRot === 180) {
    return {
      x: pageWidthPt - (xPt + wPt),
      y: yPt,
      width: wPt,
      height: hPt,
    };
  } else if (normRot === 270) {
    return {
      x: pageHeightPt - (yPt + hPt),
      y: pageWidthPt - (xPt + wPt),
      width: hPt,
      height: wPt,
    };
  }

  return {
    x: xPt,
    y: pageHeightPt - (yPt + hPt),
    width: wPt,
    height: hPt,
  };
}

/**
 * Converts PDF points to Fabric Canvas pixels
 */
export function pdfToFabricCoords(pdfRect, scale, pageHeightPt) {
  // pdfRect: { x, y, width, height } where y is from bottom
  const left = pdfRect.x * scale;
  const top = (pageHeightPt - (pdfRect.y + pdfRect.height)) * scale;
  const width = pdfRect.width * scale;
  const height = pdfRect.height * scale;

  return { left, top, width, height };
}

/**
 * Computes text baseline Y in PDF coordinates given Fabric top-left position and font size
 */
export function getTextBaselineInPdf(fabricTop, fontSizePt, scale, pageHeightPt) {
  const yPt = fabricTop / scale;
  // In PDF-lib, drawText y position is the baseline of the text.
  // Standard fonts have an ascent of ~0.8 * fontSize.
  // So the baseline is at roughly yPt + (fontSizePt * 0.8) from the top edge.
  // From the bottom edge:
  const baselineFromTop = yPt + fontSizePt * 0.82;
  return pageHeightPt - baselineFromTop;
}

/**
 * Normalizes link annotation rectangle from PDF.js format [x1, y1, x2, y2]
 * to canvas pixel bounding box { left, top, width, height }
 */
export function pdfAnnotationRectToCanvas(rect, scale, pageHeightPt) {
  // rect is [x1, y1, x2, y2] in PDF points (bottom-left origin)
  const x1 = Math.min(rect[0], rect[2]);
  const x2 = Math.max(rect[0], rect[2]);
  const y1 = Math.min(rect[1], rect[3]);
  const y2 = Math.max(rect[1], rect[3]);

  const left = x1 * scale;
  const top = (pageHeightPt - y2) * scale;
  const width = (x2 - x1) * scale;
  const height = (y2 - y1) * scale;

  return { left, top, width, height };
}

/**
 * Converts canvas rect to PDF Annotation Rect [x1, y1, x2, y2] in points
 */
export function canvasRectToPdfAnnotationRect(canvasRect, scale, pageHeightPt) {
  const x1 = canvasRect.left / scale;
  const x2 = (canvasRect.left + canvasRect.width) / scale;
  const y2 = pageHeightPt - (canvasRect.top / scale);
  const y1 = pageHeightPt - ((canvasRect.top + canvasRect.height) / scale);

  return [x1, y1, x2, y2];
}
