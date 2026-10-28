/**
 * PDF Link Annotation Manager
 * Extracts, creates, modifies, and deletes hyperlinks on PDF pages
 */

/**
 * Extracts all link annotations from a PDF page
 * @param {any} page PDF.js page proxy
 * @param {number} scale Current zoom scale
 * @param {number} rotation Page rotation
 * @returns {Promise<Array<{ id: string, url: string, left: number, top: number, width: number, height: number, pageIndex: number, isOriginal: boolean }>>}
 */
export async function extractPageLinks(page, scale = 1.0, rotation = 0) {
  if (!page) return [];

  const totalRotation = (page.rotate + rotation) % 360;
  const viewport = page.getViewport({ scale, rotation: totalRotation });

  try {
    const annotations = await page.getAnnotations({ intent: 'display' });
    const links = [];

    annotations.forEach((annot, index) => {
      if (annot.subtype === 'Link' && (annot.url || annot.dest)) {
        let url = annot.url || '';
        if (!url && typeof annot.dest === 'string') {
          url = `#${annot.dest}`;
        }

        if (annot.rect && annot.rect.length === 4) {
          // Convert PDF points rect [x1, y1, x2, y2] to viewport coordinates
          const viewRect = viewport.convertToViewportRectangle(annot.rect);
          const left = Math.min(viewRect[0], viewRect[2]);
          const top = Math.min(viewRect[1], viewRect[3]);
          const width = Math.abs(viewRect[2] - viewRect[0]);
          const height = Math.abs(viewRect[3] - viewRect[1]);

          links.push({
            id: `link-orig-${page.pageNumber}-${index}`,
            url,
            left: Math.round(left),
            top: Math.round(top),
            width: Math.max(16, Math.round(width)),
            height: Math.max(12, Math.round(height)),
            pageIndex: page.pageNumber - 1,
            isOriginal: true,
            isDeleted: false,
          });
        }
      }
    });

    return links;
  } catch (err) {
    console.warn('Error reading annotations for page ' + page.pageNumber, err);
    return [];
  }
}

/**
 * Validates whether a string is a valid HTTP or HTTPS URL
 * @param {string} urlString 
 * @returns {boolean}
 */
export function isValidUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:';
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL input (adds https:// if missing)
 */
export function normalizeUrl(urlString) {
  if (!urlString) return '';
  const trimmed = urlString.trim();
  if (/^[a-zA-Z]+:\/\//.test(trimmed) || trimmed.startsWith('mailto:')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
