import * as pdfjsLib from 'pdfjs-dist';

/**
 * Extracts all text items with precise bounding boxes and styling info from a PDF page
 * @param {pdfjsLib.PDFPageProxy} page 
 * @param {number} scale Zoom scale
 * @param {number} rotation Additional rotation in degrees
 * @returns {Promise<Array<{ id: string, str: string, left: number, top: number, width: number, height: number, fontSize: number, fontName: string, unscaledRect: { x: number, y: number, width: number, height: number } }>>}
 */
export async function extractPageText(page, scale = 1.0, rotation = 0) {
  if (!page) return [];

  const totalRotation = (page.rotate + rotation) % 360;
  const viewport = page.getViewport({ scale, rotation: totalRotation });
  const unscaledViewport = page.getViewport({ scale: 1.0, rotation: 0 });

  const textContent = await page.getTextContent({
    normalizeWhitespace: true,
    disableCombineTextItems: false,
  });

  const extractedItems = [];
  let itemIdCounter = 0;

  for (const item of textContent.items) {
    if (!item.str || item.str.trim() === '') continue;

    // item.transform is [scaleX, skewY, skewX, scaleY, tx, ty]
    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);

    // Font size in canvas pixels
    const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]) || item.height * scale || 14;

    // Viewport transform maps (0,0) to baseline
    const left = tx[4];
    // In viewport coords, y increases downwards, so baseline is tx[5], top is tx[5] - fontSize
    const top = tx[5] - fontSize;
    const width = item.width * scale;
    const height = fontSize * 1.15; // include ascent/descent margin

    // Unscaled coords (PDF points at scale 1.0)
    const unscaledLeft = left / scale;
    const unscaledTop = top / scale;
    const unscaledWidth = width / scale;
    const unscaledHeight = height / scale;

    extractedItems.push({
      id: `text-${page.pageNumber}-${itemIdCounter++}`,
      str: item.str,
      left: Math.round(left * 10) / 10,
      top: Math.round(top * 10) / 10,
      width: Math.max(12, Math.round(width * 10) / 10),
      height: Math.round(height * 10) / 10,
      fontSize: Math.round(fontSize / scale),
      fontName: item.fontName || 'Helvetica',
      pageNumber: page.pageNumber,
      pdfX: item.transform[4] != null ? item.transform[4] : unscaledLeft,
      pdfBaselineY: item.transform[5] != null ? item.transform[5] : (unscaledViewport.height - (unscaledTop + unscaledHeight) + (unscaledHeight * 0.18)),
      unscaledRect: {
        x: unscaledLeft,
        y: unscaledViewport.height - (unscaledTop + unscaledHeight),
        width: unscaledWidth,
        height: unscaledHeight,
        top: unscaledTop,
        pdfX: item.transform[4] != null ? item.transform[4] : unscaledLeft,
        pdfBaselineY: item.transform[5] != null ? item.transform[5] : (unscaledViewport.height - (unscaledTop + unscaledHeight) + (unscaledHeight * 0.18)),
      },
    });
  }

  return extractedItems;
}
