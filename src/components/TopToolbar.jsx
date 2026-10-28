import React, { useState, useEffect, useRef } from 'react';
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
  Menu,
  Sliders,
  Check,
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
  onToggleLeftSidebar,
  isLeftSidebarOpen,
  onToggleRightPanel,
  isRightPanelOpen,
  hasSelectedObject,
}) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [pageInputVal, setPageInputVal] = useState(currentPage.toString());
  const moreMenuRef = useRef(null);

  // Keep input in sync with currentPage
  useEffect(() => {
    setPageInputVal(currentPage.toString());
  }, [currentPage]);

  // Close more menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    }
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMoreMenu]);

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

  const zoomPercent = Math.round(zoom * 100);
  const standardZooms = [50, 75, 100, 125, 150, 200];
  const hasCustomZoom = !standardZooms.includes(zoomPercent);

  return (
    <header className="top-toolbar">
      {/* Brand & Left Sidebar Toggle & Document Name */}
      <div className="toolbar-group flexible">
        {onToggleLeftSidebar && (
          <button
            type="button"
            className={`toolbar-btn icon-only mobile-sidebar-toggle ${isLeftSidebarOpen ? 'active' : ''}`}
            onClick={onToggleLeftSidebar}
            title={isLeftSidebarOpen ? 'Close Pages & Tools' : 'Open Pages & Tools'}
          >
            <Menu size={18} />
          </button>
        )}

        <div className="brand-section">
          <div className="brand-icon" title="PaperEdit">
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

        {/* Undo / Redo in header so always handy */}
        <div className="toolbar-divider desktop-divider" />

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
      </div>

      {/* Desktop / Tablet Center Tools (Quick Text, Zoom, Page Nav) */}
      <div className="toolbar-group toolbar-center-tools">
        {/* Quick Text Tools */}
        {onToggleEditTextMode && (
          <button
            type="button"
            className={`toolbar-btn ${isEditTextMode ? 'active' : ''}`}
            onClick={onToggleEditTextMode}
            title={isEditTextMode ? 'Click any text on PDF to edit (active)' : 'Enable Click-to-Edit existing text on PDF'}
          >
            <MousePointerClick size={16} color={isEditTextMode ? '#2563eb' : 'currentColor'} />
            <span className="hide-tablet">{isEditTextMode ? 'Editing Text Mode' : 'Edit Text'}</span>
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
            <span className="hide-tablet">Add Text</span>
          </button>
        )}

        <div className="toolbar-divider" />

        {/* Zoom Controls */}
        <button
          type="button"
          className="toolbar-btn icon-only hide-tablet"
          onClick={() => onZoomChange(Math.max(0.3, Math.round((zoom - 0.15) * 100) / 100))}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>

        <select
          className="zoom-dropdown"
          value={zoomPercent}
          onChange={(e) => onZoomChange(parseInt(e.target.value, 10) / 100)}
          title="Zoom Level"
        >
          {hasCustomZoom && <option value={zoomPercent}>{zoomPercent}%</option>}
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="100">100%</option>
          <option value="125">125%</option>
          <option value="150">150%</option>
          <option value="200">200%</option>
        </select>

        <button
          type="button"
          className="toolbar-btn icon-only hide-tablet"
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
          className="toolbar-btn icon-only hide-tablet"
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

          <span className="hide-tablet">Page</span>
          <input
            type="text"
            className="page-number-input"
            value={pageInputVal}
            onChange={(e) => setPageInputVal(e.target.value)}
            onKeyDown={handlePageInputSubmit}
            onBlur={() => setPageInputVal(currentPage.toString())}
            title="Current Page"
          />
          <span>/ {totalPages}</span>

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

      {/* Action / Export / Menu / Mobile Properties */}
      <div className="toolbar-group">
        {/* Toggle Right Properties Panel (visible on tablet & mobile) */}
        {onToggleRightPanel && (
          <button
            type="button"
            className={`toolbar-btn icon-only properties-toggle-btn ${isRightPanelOpen ? 'active' : ''}`}
            onClick={onToggleRightPanel}
            title={isRightPanelOpen ? 'Close Properties Panel' : 'Open Properties Panel'}
          >
            <Sliders size={16} />
            {hasSelectedObject && <span className="selection-dot" />}
          </button>
        )}

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
        <div ref={moreMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={`toolbar-btn icon-only ${showMoreMenu ? 'active' : ''}`}
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            title="More Options"
          >
            <MoreVertical size={16} />
          </button>

          {showMoreMenu && (
            <div className="toolbar-dropdown-menu">
              {/* Mobile Viewport Quick Tools */}
              <div className="show-mobile">
                <span className="dropdown-section-label">View & Zoom</span>
                <button
                  type="button"
                  className="toolbar-btn"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => {
                    onFitWidth();
                    setShowMoreMenu(false);
                  }}
                >
                  <Maximize2 size={15} />
                  <span>Fit to Screen Width</span>
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => {
                    onFitPage();
                    setShowMoreMenu(false);
                  }}
                >
                  <Minimize2 size={15} />
                  <span>Fit Entire Page</span>
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => {
                    onZoomChange(1.0);
                    setShowMoreMenu(false);
                  }}
                >
                  <ZoomIn size={15} />
                  <span>Zoom 100%</span>
                </button>

                <div className="dropdown-divider" />

                <span className="dropdown-section-label">Quick Actions</span>
                {onToggleEditTextMode && (
                  <button
                    type="button"
                    className="toolbar-btn"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => {
                      onToggleEditTextMode();
                      setShowMoreMenu(false);
                    }}
                  >
                    <MousePointerClick size={15} />
                    <span>{isEditTextMode ? 'Stop Editing Text' : 'Edit Existing Text'}</span>
                  </button>
                )}
                {onAddTextBox && (
                  <button
                    type="button"
                    className="toolbar-btn"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => {
                      onAddTextBox({ fontSize: 16, text: 'New Text' });
                      setShowMoreMenu(false);
                    }}
                  >
                    <Type size={15} />
                    <span>Insert Text Box</span>
                  </button>
                )}

                <div className="dropdown-divider" />
              </div>

              <button
                type="button"
                className="toolbar-btn"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => {
                  onOpenDocInfo();
                  setShowMoreMenu(false);
                }}
              >
                <Info size={15} />
                <span>Document Details</span>
              </button>

              <button
                type="button"
                className="toolbar-btn"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => {
                  onOpenShortcuts();
                  setShowMoreMenu(false);
                }}
              >
                <HelpCircle size={15} />
                <span>Keyboard Shortcuts</span>
              </button>

              <div className="dropdown-divider" />

              <button
                type="button"
                className="toolbar-btn"
                style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444' }}
                onClick={() => {
                  onCloseDocument();
                  setShowMoreMenu(false);
                }}
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
