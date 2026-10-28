import React, { useRef, useEffect } from 'react';
import PDFPage from './PDFPage';

export default function PDFViewer({
  pdfDocProxy,
  pages,
  activePageIndex,
  onActivatePage,
  zoom,
  isEditTextMode,
  activeDrawingTool,
  onSelectObject,
  onSelectLink,
  selectedLinkId,
  onOpenTextEditor,
  selectedTextItem,
  onSelectTextItem,
  onDeleteTextItem,
  pageEdits,
  pageLinks,
  onUpdatePageEdits,
  onUpdatePageLinks,
}) {
  const workspaceRef = useRef(null);

  // Scroll active page into view when activePageIndex changes from thumbnails or navigation
  useEffect(() => {
    if (!workspaceRef.current) return;
    const pageEl = workspaceRef.current.querySelector(
      `[data-page-index="${activePageIndex}"]`
    );
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activePageIndex]);

  // Handle scroll to detect which page is most visible
  const handleScroll = () => {
    if (!workspaceRef.current) return;
    const container = workspaceRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerCenterY = containerRect.top + containerRect.height / 2;

    const pageElements = container.querySelectorAll('.pdf-page-container');
    let closestIndex = activePageIndex;
    let minDistance = Infinity;

    pageElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const pageCenterY = rect.top + rect.height / 2;
      const distance = Math.abs(containerCenterY - pageCenterY);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = parseInt(el.getAttribute('data-page-index'), 10);
      }
    });

    if (closestIndex !== activePageIndex && !isNaN(closestIndex)) {
      onActivatePage(closestIndex);
    }
  };

  return (
    <main
      ref={workspaceRef}
      className="central-workspace"
      onScroll={handleScroll}
    >
      {pages.map((pageMeta, index) => (
        <PDFPage
          key={pageMeta.id}
          pageMeta={pageMeta}
          pageIndex={index}
          pdfDocProxy={pdfDocProxy}
          zoom={zoom}
          isActive={index === activePageIndex}
          onActivate={onActivatePage}
          isEditTextMode={isEditTextMode}
          activeDrawingTool={activeDrawingTool}
          onSelectObject={onSelectObject}
          onSelectLink={onSelectLink}
          selectedLinkId={selectedLinkId}
          onOpenTextEditor={onOpenTextEditor}
          selectedTextItem={selectedTextItem}
          onSelectTextItem={onSelectTextItem}
          onDeleteTextItem={onDeleteTextItem}
          pageEdits={pageEdits[pageMeta.id] || []}
          pageLinks={pageLinks[pageMeta.id] || []}
          onUpdatePageEdits={onUpdatePageEdits}
          onUpdatePageLinks={onUpdatePageLinks}
        />
      ))}
    </main>
  );
}
