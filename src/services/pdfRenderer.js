import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Configure PDF.js worker locally using Vite asset URL
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  } catch (err) {
    console.warn('Falling back to unpkg PDF.js worker', err);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
}

/**
 * Loads a PDF document from an ArrayBuffer or Uint8Array
 * @param {ArrayBuffer|Uint8Array} data 
 * @returns {Promise<pdfjsLib.PDFDocumentProxy>}
 */
export async function loadPdfDocument(data) {
  // Always make a defensive copy so caller's buffer is never detached by PDF.js worker
  const copy = data instanceof Uint8Array ? data.slice() : new Uint8Array(data.slice ? data.slice(0) : data);
  const loadingTask = pdfjsLib.getDocument({
    data: copy,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  });

  return await loadingTask.promise;
}

/**
 * Renders a PDF page to a canvas element with devicePixelRatio scaling for crisp text
 * @param {pdfjsLib.PDFPageProxy} page 
 * @param {HTMLCanvasElement} canvas 
 * @param {number} scale 
 * @param {number} rotation 
 * @returns {Promise<{ width: number, height: number, viewport: any }>}
 */
export async function renderPdfPageToCanvas(page, canvas, scale = 1.0, rotation = 0) {
  if (!page || !canvas) return null;

  const totalRotation = (page.rotate + rotation) % 360;
  const viewport = page.getViewport({ scale, rotation: totalRotation });

  const dpr = window.devicePixelRatio || 1;
  const ctx = canvas.getContext('2d', { alpha: false });

  // Backing store canvas size adjusted for device pixel ratio
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);

  // CSS display size matches viewport exactly
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  ctx.save();
  ctx.scale(dpr, dpr);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
    intent: 'display',
  };

  const renderTask = page.render(renderContext);
  await renderTask.promise;
  ctx.restore();

  return {
    width: viewport.width,
    height: viewport.height,
    viewport,
  };
}

/**
 * Renders a small preview thumbnail of a page
 * @param {pdfjsLib.PDFDocumentProxy} pdfDoc 
 * @param {number} pageNumber 1-indexed
 * @param {number} targetWidth px
 * @param {number} extraRotation deg
 * @returns {Promise<string>} Data URL of thumbnail image
 */
export async function renderPageThumbnail(pdfDoc, pageNumber, targetWidth = 140, extraRotation = 0) {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const unscaledViewport = page.getViewport({ scale: 1.0, rotation: (page.rotate + extraRotation) % 360 });
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale, rotation: (page.rotate + extraRotation) % 360 });

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = viewport.width;
    offscreenCanvas.height = viewport.height;
    const ctx = offscreenCanvas.getContext('2d');

    const renderTask = page.render({
      canvasContext: ctx,
      viewport: viewport,
    });

    await renderTask.promise;
    return offscreenCanvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.error('Error generating thumbnail for page ' + pageNumber, err);
    return null;
  }
}
