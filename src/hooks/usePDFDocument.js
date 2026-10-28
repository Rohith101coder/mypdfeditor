import { useState, useCallback } from 'react';
import { loadPdfDocument } from '../services/pdfRenderer';
import { generateSamplePdfBytes } from '../services/samplePdfGenerator';
import { validatePdfFile } from '../utils/fileValidation';

/**
 * Hook to manage PDF document state, loading, page structures, and metadata
 */
export function usePDFDocument() {
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pdfDocProxy, setPdfDocProxy] = useState(null);
  const [filename, setFilename] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [metadata, setMetadata] = useState(null);
  const [pages, setPages] = useState([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);

  /**
   * Initializes page list and metadata from a loaded PDF.js proxy
   */
  const initFromDocProxy = useCallback(async (docProxy, bytes, name, size) => {
    const numPages = docProxy.numPages;
    const initialPages = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await docProxy.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      initialPages.push({
        id: `page-orig-${i}-${Date.now()}`,
        pageIndex: i - 1,
        originalPageIndex: i - 1,
        rotation: page.rotate || 0,
        width: viewport.width,
        height: viewport.height,
        isBlank: false,
      });
    }

    let docMeta = {};
    try {
      const meta = await docProxy.getMetadata();
      docMeta = {
        title: meta?.info?.Title || name.replace(/\.pdf$/i, ''),
        author: meta?.info?.Author || 'Unknown',
        creator: meta?.info?.Creator || 'PaperEdit',
        producer: meta?.info?.Producer || '',
        creationDate: meta?.info?.CreationDate || '',
      };
    } catch {
      docMeta = { title: name };
    }

    setPdfBytes(bytes);
    setPdfDocProxy(docProxy);
    setFilename(name);
    setFileSize(size);
    setMetadata(docMeta);
    setPages(initialPages);
    setActivePageIndex(0);
    setError(null);
  }, []);

  /**
   * Loads a user-uploaded PDF file
   */
  const loadFile = useCallback(async (file) => {
    setIsLoading(true);
    setLoadingMessage('Validating PDF file...');
    setError(null);

    try {
      const validation = await validatePdfFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setLoadingMessage('Reading document into browser memory...');
      const buffer = await file.arrayBuffer();
      // Keep a clean copy of original bytes that is never transferred or modified
      const originalBytes = new Uint8Array(buffer.slice(0));
      const workerBytes = new Uint8Array(buffer.slice(0));

      setLoadingMessage('Parsing document pages...');
      const docProxy = await loadPdfDocument(workerBytes);

      await initFromDocProxy(docProxy, originalBytes, file.name, file.size);
    } catch (err) {
      console.error('PDF load error:', err);
      setError(err.message || 'Failed to parse the PDF document.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [initFromDocProxy]);

  /**
   * Loads the pre-built sample PDF for instant testing
   */
  const loadSamplePdf = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage('Generating sample PDF...');
    setError(null);

    try {
      const sampleBytes = await generateSamplePdfBytes();
      const originalBytes = new Uint8Array(sampleBytes.slice(0));
      const workerBytes = new Uint8Array(sampleBytes.slice(0));
      const docProxy = await loadPdfDocument(workerBytes);
      await initFromDocProxy(docProxy, originalBytes, 'PaperEdit-Sample-Document.pdf', originalBytes.byteLength);
    } catch (err) {
      console.error('Failed to generate sample PDF:', err);
      setError('Failed to generate sample PDF: ' + err.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [initFromDocProxy]);

  /**
   * Closes current document and returns to upload screen
   */
  const closeDocument = useCallback(() => {
    if (pdfDocProxy) {
      try {
        pdfDocProxy.destroy();
      } catch (e) {
        // ignore
      }
    }
    setPdfBytes(null);
    setPdfDocProxy(null);
    setFilename('');
    setFileSize(0);
    setMetadata(null);
    setPages([]);
    setActivePageIndex(0);
    setError(null);
  }, [pdfDocProxy]);

  /**
   * Adds a blank page after the specified index
   */
  const addBlankPage = useCallback((afterIndex) => {
    setPages((prevPages) => {
      const targetIdx = afterIndex != null ? afterIndex : prevPages.length - 1;
      const refPage = prevPages[targetIdx] || prevPages[0] || { width: 612, height: 792 };

      const newPage = {
        id: `page-blank-${Date.now()}`,
        pageIndex: targetIdx + 1,
        originalPageIndex: null,
        rotation: 0,
        width: refPage.width,
        height: refPage.height,
        isBlank: true,
      };

      const updated = [...prevPages];
      updated.splice(targetIdx + 1, 0, newPage);
      return updated;
    });

    if (afterIndex != null) {
      setActivePageIndex(afterIndex + 1);
    }
  }, []);

  /**
   * Duplicates an existing page
   */
  const duplicatePage = useCallback((index) => {
    setPages((prevPages) => {
      if (index < 0 || index >= prevPages.length) return prevPages;
      const pageToDuplicate = prevPages[index];
      const duplicated = {
        ...pageToDuplicate,
        id: `page-dup-${Date.now()}`,
      };
      const updated = [...prevPages];
      updated.splice(index + 1, 0, duplicated);
      return updated;
    });
    setActivePageIndex(index + 1);
  }, []);

  /**
   * Deletes a page
   */
  const deletePage = useCallback((index) => {
    setPages((prevPages) => {
      if (prevPages.length <= 1) {
        alert('Cannot delete the last remaining page of the document.');
        return prevPages;
      }
      const updated = prevPages.filter((_, idx) => idx !== index);
      return updated;
    });

    setActivePageIndex((prevActive) => {
      if (prevActive >= index && prevActive > 0) {
        return prevActive - 1;
      }
      return prevActive;
    });
  }, []);

  /**
   * Rotates a page by 90 degrees (+90 CW, -90 CCW)
   */
  const rotatePage = useCallback((index, deltaDegrees = 90) => {
    setPages((prevPages) => {
      return prevPages.map((page, idx) => {
        if (idx !== index) return page;
        const newRot = (((page.rotation + deltaDegrees) % 360) + 360) % 360;
        return {
          ...page,
          rotation: newRot,
        };
      });
    });
  }, []);

  /**
   * Reorders pages
   */
  const reorderPages = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setPages((prevPages) => {
      const updated = [...prevPages];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
    setActivePageIndex(toIndex);
  }, []);

  return {
    pdfBytes,
    pdfDocProxy,
    filename,
    fileSize,
    metadata,
    pages,
    setPages,
    activePageIndex,
    setActivePageIndex,
    isLoading,
    loadingMessage,
    error,
    loadFile,
    loadSamplePdf,
    closeDocument,
    addBlankPage,
    duplicatePage,
    deletePage,
    rotatePage,
    reorderPages,
  };
}
