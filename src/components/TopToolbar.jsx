import React, { useState, useEffect } from 'react';
import {
  FileText,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
  HelpCircle,
  Info,
  FolderOpen,
  Loader2,
  Type,
  MousePointerClick,
} from 'lucide-react';

export default function TopToolbar({
  filename,
  onFilenameChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitWidth,
  onFitPage,
  currentPage,
  totalPages,
  onPageChange,
  onExport,
  isExporting,
  onOpenShortcuts,
  onOpenDocInfo,
  onCloseDocument,
  isEditTextMode,
  onToggleEditTextMode,
  onAddTextBox,
}) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [pageInputVal, setPageInputVal] = useState(currentPage.toString());

  // Keep input in sync with currentPage
  React.useEffect(() => {
    setPageInputVal(currentPage.toString());
  }, [currentPage]);

  const handlePageInputSubmit = (e) => {
    if (e.key === 'Enter') {
      const parsed = parseInt(pageInputVal, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
        onPageChange(parsed);
      } else {
        setPageInputVal(currentPage.toString());
      }
    }
  };

  return (
    <header className="top-toolbar">
      {/* Brand & Document Name */}
      <div className="toolbar-group">
        <div className="brand-section">
          <div className="brand-icon">
            <FileText size={18} />
          </div>
          <span className="brand-title">PaperEdit</span>
        </div>

        <div className="filename-input-container" title="Click to rename document">
          <input
            type="text"
            className="filename-input"
            value={filename}
            onChange={(e) => onFilenameChange(e.target.value)}
            placeholder="document.pdf"
          />
        </div>
      </div>

      {/* Undo / Redo & Zoom & Navigation */}
      <div className="toolbar-group">
        {/* Undo / Redo */}
        <button
          type="button"
          className="toolbar-btn icon-only"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>

        <button
          type="button"
          className="toolbar-btn icon-only"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z or Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>

        <div className="toolbar-divider" />

        {/* Quick Text Tools */}
        {onToggleEditTextMode && (
          <button
            type="button"
            className={`toolbar-btn ${isEditTextMode ? 'active' : ''}`}
            onClick={onToggleEditTextMode}
            title={isEditTextMode ? 'Click any text on PDF to edit (active)' : 'Enable Click-to-Edit existing text on PDF'}
            style={{
              backgroundColor: isEditTextMode ? '#eff6ff' : undefined,
              borderColor: isEditTextMode ? '#2563eb' : undefined,
              color: isEditTextMode ? '#1d4ed8' : undefined,
              fontWeight: isEditTextMode ? 600 : 500,
            }}
          >
            <MousePointerClick size={16} color={isEditTextMode ? '#2563eb' : 'currentColor'} />
            <span>{isEditTextMode ? 'Editing Text Mode' : 'Edit Text'}</span>
          </button>
        )}

        {onAddTextBox && (
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => onAddTextBox({ fontSize: 16, text: 'Click to edit text' })}
            title="Add a new custom text box to the current page"
          >
            <Type size={16} />
            <span>Add Text</span>
          </button>
        )}

        <div className="toolbar-divider" />

        {/* Zoom Controls */}
        <button
          type="button"
          className="toolbar-btn icon-only"
          onClick={() => onZoomChange(Math.max(0.4, Math.round((zoom - 0.15) * 100) / 100))}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>

        <select
          className="zoom-dropdown"
          value={Math.round(zoom * 100)}
          onChange={(e) => onZoomChange(parseInt(e.target.value, 10) / 100)}
          title="Zoom Level"
        >
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="100">100%</option>
          <option value="125">125%</option>
          <option value="150">150%</option>
          <option value="200">200%</option>
        </select>

        <button
          type="button"
          className="toolbar-btn icon-only"
          onClick={() => onZoomChange(Math.min(3.0, Math.round((zoom + 0.15) * 100) / 100))}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>

        <button
          type="button"
          className="toolbar-btn icon-only"
          onClick={onFitWidth}
          title="Fit to Width"
        >
          <Maximize2 size={15} />
        </button>

        <button
          type="button"
          className="toolbar-btn icon-only"
          onClick={onFitPage}
          title="Fit Entire Page"
        >
          <Minimize2 size={15} />
        </button>

        <div className="toolbar-divider" />

        {/* Page Navigation */}
        <div className="page-nav-box">
          <button
            type="button"
            className="toolbar-btn icon-only"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          <span>Page</span>
          <input
            type="text"
            className="page-number-input"
            value={pageInputVal}
            onChange={(e) => setPageInputVal(e.target.value)}
            onKeyDown={handlePageInputSubmit}
            onBlur={() => setPageInputVal(currentPage.toString())}
          />
          <span>of {totalPages}</span>

          <button
            type="button"
            className="toolbar-btn icon-only"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Action / Export / Menu */}
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn primary"
          onClick={onExport}
          disabled={isExporting}
          title="Download Modified PDF (Ctrl+S)"
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          <span>{isExporting ? 'Generating...' : 'Download PDF'}</span>
        </button>

        <div className="toolbar-divider" />

        {/* More Menu */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className={`toolbar-btn icon-only ${showMoreMenu ? 'active' : ''}`}
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            title="More Options"
          >
            <MoreVertical size={16} />
          </button>

          {showMoreMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '40px',
                width: '200px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 50,
              }}
              onClick={() => setShowMoreMenu(false)}
            >
              <button
                type="button"
                className="toolbar-btn"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={onOpenShortcuts}
              >
                <HelpCircle size={15} />
                <span>Keyboard Shortcuts</span>
              </button>

              <button
                type="button"
                className="toolbar-btn"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={onOpenDocInfo}
              >
                <Info size={15} />
                <span>Document Details</span>
              </button>

              <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />

              <button
                type="button"
                className="toolbar-btn"
                style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444' }}
                onClick={onCloseDocument}
              >
                <FolderOpen size={15} />
                <span>Close Document</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
