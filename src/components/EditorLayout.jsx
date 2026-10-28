import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Layers, MousePointerClick, Type, Square, Sliders } from 'lucide-react';
import TopToolbar from './TopToolbar';
import LeftSidebar from './LeftSidebar';
import PDFViewer from './PDFViewer';
import RightPropertiesPanel from './RightPropertiesPanel';
import TextEditorModal from './TextEditorModal';
import ExportDialog from './ExportDialog';
import ShortcutsModal from './ShortcutsModal';
import ConfirmDialog from './ConfirmDialog';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { exportModifiedPdf, downloadPdfBlob } from '../services/pdfExporter';

export default function EditorLayout({
  pdfBytes,
  pdfDocProxy,
  filename,
  onFilenameChange,
  fileSize,
  metadata,
  pages,
  setPages,
  activePageIndex,
  setActivePageIndex,
  onCloseDocument,
  onAddBlankPage,
  onDuplicatePage,
  onDeletePage,
  onRotatePage,
  onMovePage,
}) {
  // Central zoom state
  const [zoom, setZoom] = useState(1.0);

  // Responsive Drawer & Panels state
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [activeSidebarTab, setActiveSidebarTab] = useState('thumbnails');
  const workspaceRef = useRef(null);
  const initialFitRef = useRef(false);

  // Tools state
  const [isEditTextMode, setIsEditTextMode] = useState(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState('select'); // 'select', 'pen', 'highlighter'

  // Selection state
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [selectedTextItem, setSelectedTextItem] = useState(null);

  // Edit layer & links map: pageId -> items
  const [pageEdits, setPageEdits] = useState({});
  const [pageLinks, setPageLinks] = useState({});

  // History stack for Undo/Redo
  const [historyPast, setHistoryPast] = useState([]);
  const [historyFuture, setHistoryFuture] = useState([]);
  const isHistoryActionRef = useRef(false);

  // Push state to history
  const recordHistory = useCallback(
    (newPages, newEdits, newLinks) => {
      if (isHistoryActionRef.current) return;
      const snapshot = {
        pages: JSON.parse(JSON.stringify(newPages)),
        pageEdits: JSON.parse(JSON.stringify(newEdits)),
        pageLinks: JSON.parse(JSON.stringify(newLinks)),
      };
      setHistoryPast((past) => [...past.slice(-30), snapshot]);
      setHistoryFuture([]);
    },
    []
  );

  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    isHistoryActionRef.current = true;

    const previous = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, historyPast.length - 1);

    const currentSnapshot = {
      pages: JSON.parse(JSON.stringify(pages)),
      pageEdits: JSON.parse(JSON.stringify(pageEdits)),
      pageLinks: JSON.parse(JSON.stringify(pageLinks)),
    };

    setHistoryFuture((fut) => [currentSnapshot, ...fut]);
    setHistoryPast(newPast);

    setPages(previous.pages);
    setPageEdits(previous.pageEdits);
    setPageLinks(previous.pageLinks);

    setTimeout(() => {
      isHistoryActionRef.current = false;
    }, 50);
  }, [historyPast, pages, pageEdits, pageLinks, setPages]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    isHistoryActionRef.current = true;

    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);

    const currentSnapshot = {
      pages: JSON.parse(JSON.stringify(pages)),
      pageEdits: JSON.parse(JSON.stringify(pageEdits)),
      pageLinks: JSON.parse(JSON.stringify(pageLinks)),
    };

    setHistoryPast((past) => [...past, currentSnapshot]);
    setHistoryFuture(newFuture);

    setPages(next.pages);
    setPageEdits(next.pageEdits);
    setPageLinks(next.pageLinks);

    setTimeout(() => {
      isHistoryActionRef.current = false;
    }, 50);
  }, [historyFuture, pages, pageEdits, pageLinks, setPages]);

  // Modals state
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textItemToEdit, setTextItemToEdit] = useState(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [isExporting, setIsExporting] = useState(false);

  // Active page metadata
  const activePageMeta = pages[activePageIndex] || pages[0];

  // Update Page Edits handler
  const handleUpdatePageEdits = useCallback(
    (pageId, edits) => {
      setPageEdits((prev) => {
        const updated = { ...prev, [pageId]: edits };
        recordHistory(pages, updated, pageLinks);
        return updated;
      });
    },
    [pages, pageLinks, recordHistory]
  );

  // Update Page Links handler
  const handleUpdatePageLinks = useCallback(
    (pageId, links) => {
      setPageLinks((prev) => {
        const updated = { ...prev, [pageId]: links };
        recordHistory(pages, pageEdits, updated);
        return updated;
      });
    },
    [pages, pageEdits, recordHistory]
  );

  // --- OBJECT & TOOL ACTIONS ---

  // Add a new text box
  const handleAddTextBox = useCallback(
    (preset = {}) => {
      if (!activePageMeta) return;
      const newEdit = {
        id: `text-box-${Date.now()}`,
        type: 'textbox',
        text: preset.text || 'Type your text...',
        left: 80,
        top: 100,
        width: 200,
        height: 50,
        fontSize: preset.fontSize || 16,
        fontFamily: preset.fontFamily || 'Helvetica',
        fill: '#000000',
        fontWeight: preset.isBold ? 'bold' : 'normal',
        fontStyle: preset.isItalic ? 'italic' : 'normal',
        opacity: 1.0,
      };

      setPageEdits((prev) => {
        const current = prev[activePageMeta.id] || [];
        const updated = { ...prev, [activePageMeta.id]: [...current, newEdit] };
        recordHistory(pages, updated, pageLinks);
        return updated;
      });
      setSelectedObject(newEdit);
    },
    [activePageMeta, pages, pageLinks, recordHistory]
  );

  // Add geometric shape
  const handleAddShape = useCallback(
    (shapeType) => {
      if (!activePageMeta) return;
      const baseId = `${shapeType}-${Date.now()}`;
      let newShape;

      if (shapeType === 'rect') {
        newShape = {
          id: baseId,
          type: 'rect',
          left: 100,
          top: 120,
          width: 140,
          height: 90,
          fill: '#eff6ff',
          stroke: '#2563eb',
          strokeWidth: 2,
          opacity: 1.0,
        };
      } else if (shapeType === 'circle') {
        newShape = {
          id: baseId,
          type: 'circle',
          left: 120,
          top: 120,
          width: 100,
          height: 100,
          fill: '#fef2f2',
          stroke: '#ef4444',
          strokeWidth: 2,
          opacity: 1.0,
        };
      } else if (shapeType === 'line' || shapeType === 'arrow') {
        newShape = {
          id: baseId,
          type: shapeType,
          left: 100,
          top: 150,
          x1: 100,
          y1: 150,
          x2: 250,
          y2: 150,
          stroke: '#0f172a',
          strokeWidth: 3,
          opacity: 1.0,
        };
      }

      if (newShape) {
        setPageEdits((prev) => {
          const current = prev[activePageMeta.id] || [];
          const updated = { ...prev, [activePageMeta.id]: [...current, newShape] };
          recordHistory(pages, updated, pageLinks);
          return updated;
        });
        setSelectedObject(newShape);
      }
    },
    [activePageMeta, pages, pageLinks, recordHistory]
  );

  // Add Device Image
  const handleAddImage = useCallback(
    (dataUrl) => {
      if (!activePageMeta) return;
      const newImg = {
        id: `img-${Date.now()}`,
        type: 'image',
        dataUrl,
        left: 80,
        top: 120,
        width: 180,
        height: 120,
        opacity: 1.0,
      };

      setPageEdits((prev) => {
        const current = prev[activePageMeta.id] || [];
        const updated = { ...prev, [activePageMeta.id]: [...current, newImg] };
        recordHistory(pages, updated, pageLinks);
        return updated;
      });
      setSelectedObject(newImg);
    },
    [activePageMeta, pages, pageLinks, recordHistory]
  );

  // Add Document Stamp
  const handleAddStamp = useCallback(
    (stampText, color) => {
      if (!activePageMeta) return;
      const newStamp = {
        id: `stamp-${Date.now()}`,
        type: 'textbox',
        text: stampText,
        left: 120,
        top: 150,
        width: 160,
        height: 50,
        fontSize: 20,
        fontWeight: 'bold',
        fill: color,
        stroke: color,
        strokeWidth: 1.5,
        opacity: 0.85,
        angle: -15,
      };

      setPageEdits((prev) => {
        const current = prev[activePageMeta.id] || [];
        const updated = { ...prev, [activePageMeta.id]: [...current, newStamp] };
        recordHistory(pages, updated, pageLinks);
        return updated;
      });
      setSelectedObject(newStamp);
    },
    [activePageMeta, pages, pageLinks, recordHistory]
  );

  // Add Hyperlink Region
  const handleAddNewLink = useCallback(
    (url = 'https://example.com') => {
      if (!activePageMeta) return;
      const newLink = {
        id: `link-user-${Date.now()}`,
        url,
        left: 100,
        top: 150,
        width: 160,
        height: 30,
        pageIndex: activePageIndex,
        isOriginal: false,
        isDeleted: false,
      };

      setPageLinks((prev) => {
        const current = prev[activePageMeta.id] || [];
        const updated = { ...prev, [activePageMeta.id]: [...current, newLink] };
        recordHistory(pages, pageEdits, updated);
        return updated;
      });
      setSelectedLink(newLink);
      setSelectedObject(null);
      setSelectedTextItem(null);
    },
    [activePageMeta, activePageIndex, pages, pageEdits, recordHistory]
  );

  // Existing Text Replacement handler
  const handleOpenTextEditor = useCallback((item) => {
    setTextItemToEdit(item);
    setIsTextModalOpen(true);
  }, []);

  const handleApplyTextReplacement = useCallback(
    (replacedItem) => {
      if (!activePageMeta) return;

      const editId = replacedItem.id && replacedItem.id.startsWith('replace-')
        ? replacedItem.id
        : `replace-${Date.now()}`;

      const unscaled = replacedItem.unscaledRect || {};
      const unscaledLeft = unscaled.x != null ? unscaled.x : (replacedItem.left / zoom);
      const unscaledTop = unscaled.top != null ? unscaled.top : (replacedItem.top / zoom);
      const unscaledWidth = unscaled.width != null ? unscaled.width : (replacedItem.width / zoom);
      const unscaledHeight = unscaled.height != null ? unscaled.height : (replacedItem.height / zoom);

      const editItem = {
        id: editId,
        type: 'text-replace',
        originalText: replacedItem.originalText || replacedItem.str || '',
        text: replacedItem.text,
        x: unscaled.x != null ? unscaled.x : unscaledLeft,
        y: unscaled.y != null ? unscaled.y : replacedItem.y,
        pdfX: replacedItem.pdfX != null ? replacedItem.pdfX : unscaled.pdfX,
        pdfBaselineY: replacedItem.pdfBaselineY != null ? replacedItem.pdfBaselineY : unscaled.pdfBaselineY,
        width: unscaledWidth,
        height: unscaledHeight,
        left: unscaledLeft,
        top: unscaledTop,
        fontSize: replacedItem.fontSize || 12,
        fontFamily: replacedItem.fontFamily || 'Helvetica',
        fontColor: replacedItem.fontColor || '#000000',
        bgColor: replacedItem.bgColor || '#ffffff',
        isBold: !!replacedItem.isBold,
        isItalic: !!replacedItem.isItalic,
      };

      setPageEdits((prev) => {
        const current = prev[activePageMeta.id] || [];
        const existingIdx = current.findIndex(
          (item) =>
            item.id === editId ||
            (item.type === 'text-replace' && item.originalText === editItem.originalText && Math.abs(item.left - editItem.left) < 3)
        );

        let updatedList;
        if (existingIdx >= 0) {
          updatedList = [...current];
          updatedList[existingIdx] = { ...current[existingIdx], ...editItem };
        } else {
          updatedList = [...current, editItem];
        }

        const updated = { ...prev, [activePageMeta.id]: updatedList };
        recordHistory(pages, updated, pageLinks);
        return updated;
      });

      setSelectedTextItem(editItem);
      setSelectedObject(null);
      setSelectedLink(null);
    },
    [activePageMeta, zoom, pages, pageLinks, recordHistory]
  );

  const handleDeleteTextItem = useCallback(
    (itemId) => {
      if (!activePageMeta) return;
      setPageEdits((prev) => {
        const current = prev[activePageMeta.id] || [];
        const updated = {
          ...prev,
          [activePageMeta.id]: current.filter((item) => item.id !== itemId),
        };
        recordHistory(pages, updated, pageLinks);
        return updated;
      });
      if (selectedTextItem?.id === itemId) {
        setSelectedTextItem(null);
      }
    },
    [activePageMeta, selectedTextItem, pages, pageLinks, recordHistory]
  );

  // Update properties of currently selected object
  const handleUpdateObjectProps = useCallback(
    (props) => {
      if (selectedTextItem) {
        setSelectedTextItem((prev) => {
          const updated = { ...prev, ...props };
          setPageEdits((allEdits) => {
            const pageList = allEdits[activePageMeta.id] || [];
            return {
              ...allEdits,
              [activePageMeta.id]: pageList.map((item) =>
                item.id === updated.id ? updated : item
              ),
            };
          });
          return updated;
        });
        return;
      }

      if (selectedObject) {
        setSelectedObject((prev) => {
          const updated = { ...prev, ...props };
          setPageEdits((allEdits) => {
            const pageList = allEdits[activePageMeta.id] || [];
            return {
              ...allEdits,
              [activePageMeta.id]: pageList.map((item) =>
                item.id === updated.id ? updated : item
              ),
            };
          });
          return updated;
        });
      }
    },
    [selectedTextItem, selectedObject, activePageMeta]
  );

  // Update Hyperlink URL
  const handleUpdateLinkUrl = useCallback(
    (linkId, newUrl) => {
      if (!activePageMeta) return;
      setPageLinks((prev) => {
        const current = prev[activePageMeta.id] || [];
        const updatedLinks = current.map((link) =>
          link.id === linkId ? { ...link, url: newUrl } : link
        );
        const updated = { ...prev, [activePageMeta.id]: updatedLinks };
        recordHistory(pages, pageEdits, updated);
        return updated;
      });

      setSelectedLink((prev) => (prev && prev.id === linkId ? { ...prev, url: newUrl } : prev));
    },
    [activePageMeta, pages, pageEdits, recordHistory]
  );

  // Delete currently selected object
  const handleDeleteSelected = useCallback(() => {
    if (!activePageMeta) return;

    if (selectedTextItem) {
      setPageEdits((prev) => {
        const current = prev[activePageMeta.id] || [];
        const updated = {
          ...prev,
          [activePageMeta.id]: current.filter((item) => item.id !== selectedTextItem.id),
        };
        recordHistory(pages, updated, pageLinks);
        return updated;
      });
      setSelectedTextItem(null);
      return;
    }

    if (selectedObject) {
      setPageEdits((prev) => {
        const current = prev[activePageMeta.id] || [];
        const updated = {
          ...prev,
          [activePageMeta.id]: current.filter((item) => item.id !== selectedObject.id),
        };
        recordHistory(pages, updated, pageLinks);
        return updated;
      });
      setSelectedObject(null);
    }
  }, [activePageMeta, selectedTextItem, selectedObject, pages, pageLinks, recordHistory]);

  // Duplicate currently selected object
  const handleDuplicateSelected = useCallback(() => {
    if (!activePageMeta || !selectedObject) return;
    const duplicated = {
      ...selectedObject,
      id: `${selectedObject.type}-${Date.now()}`,
      left: (selectedObject.left || 0) + 15,
      top: (selectedObject.top || 0) + 15,
    };

    setPageEdits((prev) => {
      const current = prev[activePageMeta.id] || [];
      const updated = { ...prev, [activePageMeta.id]: [...current, duplicated] };
      recordHistory(pages, updated, pageLinks);
      return updated;
    });
    setSelectedObject(duplicated);
  }, [activePageMeta, selectedObject, pages, pageLinks, recordHistory]);

  // Delete Hyperlink
  const handleDeleteLink = useCallback(
    (linkId) => {
      if (!activePageMeta) return;
      setPageLinks((prev) => {
        const current = prev[activePageMeta.id] || [];
        const updatedLinks = current.map((l) =>
          l.id === linkId ? { ...l, isDeleted: true } : l
        );
        const updated = { ...prev, [activePageMeta.id]: updatedLinks };
        recordHistory(pages, pageEdits, updated);
        return updated;
      });
      if (selectedLink?.id === linkId) {
        setSelectedLink(null);
      }
    },
    [activePageMeta, selectedLink, pages, pageEdits, recordHistory]
  );

  // Deselect all
  const handleDeselectAll = useCallback(() => {
    setSelectedObject(null);
    setSelectedLink(null);
    setSelectedTextItem(null);
    setIsTextModalOpen(false);
  }, []);

  // Nudge selected object by arrow keys
  const handleNudge = useCallback(
    (dx, dy) => {
      if (selectedObject) {
        handleUpdateObjectProps({
          left: (selectedObject.left || 0) + dx,
          top: (selectedObject.top || 0) + dy,
        });
      }
    },
    [selectedObject, handleUpdateObjectProps]
  );

  // Keyboard Shortcuts Hook
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDeleteSelected: handleDeleteSelected,
    onDeselect: handleDeselectAll,
    onSave: () => setIsExportDialogOpen(true),
    onNudge: handleNudge,
    canUndo: historyPast.length > 0,
    canRedo: historyFuture.length > 0,
  });

  // Export & Download PDF
  const handleExecuteExport = async (finalName) => {
    setIsExporting(true);
    try {
      if (!pdfBytes || pdfBytes.byteLength === 0) {
        throw new Error('Original PDF data is not available. Please reload the document.');
      }
      const modifiedBytes = await exportModifiedPdf({
        originalPdfBytes: pdfBytes.slice(0),
        pages,
        pageEdits,
        pageLinks,
      });

      downloadPdfBlob(modifiedBytes, finalName);
      setIsExportDialogOpen(false);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export PDF: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Zoom helpers: Fit Width & Fit Page
  const handleFitWidth = useCallback(() => {
    if (!activePageMeta) return;
    const container = workspaceRef.current;
    const containerWidth = container ? container.clientWidth : window.innerWidth;
    const padding = window.innerWidth < 640 ? 16 : 48;
    const availableWidth = Math.max(100, containerWidth - padding);
    const targetScale = Math.max(0.25, Math.min(3.0, availableWidth / activePageMeta.width));
    setZoom(Math.floor(targetScale * 100) / 100);
  }, [activePageMeta]);

  const handleFitPage = useCallback(() => {
    if (!activePageMeta) return;
    const container = workspaceRef.current;
    const containerHeight = container ? container.clientHeight : (window.innerHeight - 56);
    const padding = window.innerWidth < 640 ? 24 : 64;
    const availableHeight = Math.max(100, containerHeight - padding);
    const targetScale = Math.max(0.25, Math.min(3.0, availableHeight / activePageMeta.height));
    setZoom(Math.floor(targetScale * 100) / 100);
  }, [activePageMeta]);

  // Auto-fit on initial document load
  useEffect(() => {
    if (activePageMeta && !initialFitRef.current) {
      initialFitRef.current = true;
      const timer = setTimeout(() => {
        handleFitWidth();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activePageMeta, handleFitWidth]);

  // Responsive resize handler
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsRightPanelOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Safe Close Document
  const handleCloseDocumentRequest = () => {
    const hasEdits =
      Object.keys(pageEdits).some((k) => pageEdits[k]?.length > 0) ||
      pages.length !== (pdfDocProxy?.numPages || 1);

    if (hasEdits) {
      setConfirmDialog({
        isOpen: true,
        title: 'Close Document?',
        message: 'You have unsaved modifications. Closing this document will discard all changes made during this session.',
        confirmLabel: 'Discard Changes & Close',
        isDanger: true,
        onConfirm: () => {
          setConfirmDialog({ isOpen: false });
          onCloseDocument();
        },
      });
    } else {
      onCloseDocument();
    }
  };

  // Safe Delete Page
  const handleDeletePageRequest = (pageIdx) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Page?',
      message: `Are you sure you want to delete Page ${pageIdx + 1}? This action can be undone.`,
      confirmLabel: 'Delete Page',
      isDanger: true,
      onConfirm: () => {
        setConfirmDialog({ isOpen: false });
        onDeletePage(pageIdx);
      },
    });
  };

  return (
    <div className="app-container">
      {/* Top Toolbar */}
      <TopToolbar
        filename={filename}
        onFilenameChange={onFilenameChange}
        canUndo={historyPast.length > 0}
        canRedo={historyFuture.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        currentPage={activePageIndex + 1}
        totalPages={pages.length}
        onPageChange={(p) => setActivePageIndex(p - 1)}
        onExport={() => setIsExportDialogOpen(true)}
        isExporting={isExporting}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenDocInfo={() => {
          setActiveSidebarTab('info');
          setIsLeftSidebarOpen(true);
        }}
        onCloseDocument={handleCloseDocumentRequest}
        isEditTextMode={isEditTextMode}
        onToggleEditTextMode={() => {
          setIsEditTextMode(!isEditTextMode);
          setActiveDrawingTool('select');
        }}
        onAddTextBox={handleAddTextBox}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleRightPanel={() => setIsRightPanelOpen((prev) => !prev)}
        isRightPanelOpen={isRightPanelOpen}
        hasSelectedObject={Boolean(selectedObject || selectedLink || selectedTextItem)}
      />

      <div className="editor-main">
        {/* Left Sidebar */}
        <LeftSidebar
          pdfDocProxy={pdfDocProxy}
          pages={pages}
          activePageIndex={activePageIndex}
          onSelectPage={setActivePageIndex}
          onRotatePage={(idx, deg) => onRotatePage(idx, deg)}
          onDuplicatePage={onDuplicatePage}
          onDeletePage={handleDeletePageRequest}
          onMovePage={onMovePage}
          onAddBlankPage={onAddBlankPage}
          // Text tools props
          isEditTextMode={isEditTextMode}
          onToggleEditTextMode={() => {
            setIsEditTextMode(!isEditTextMode);
            setActiveDrawingTool('select');
          }}
          onAddTextBox={handleAddTextBox}
          // Shape tools props
          activeDrawingTool={activeDrawingTool}
          onSelectDrawingTool={(tool) => {
            setActiveDrawingTool(tool);
            setIsEditTextMode(false);
          }}
          onAddShape={handleAddShape}
          // Image props
          onAddImage={handleAddImage}
          onAddStamp={handleAddStamp}
          // Link props
          links={pageLinks[activePageMeta?.id] || []}
          onAddNewLink={handleAddNewLink}
          onSelectLink={(link) => {
            setSelectedLink(link);
            setSelectedObject(null);
            setSelectedTextItem(null);
            if (window.innerWidth < 1024) setIsRightPanelOpen(true);
          }}
          onDeleteLink={handleDeleteLink}
          selectedLinkId={selectedLink?.id}
          // Doc Info props
          filename={filename}
          fileSize={fileSize}
          metadata={metadata}
          // Responsive drawer props
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
          activeTab={activeSidebarTab}
          onTabChange={setActiveSidebarTab}
        />

        {/* Central Workspace / PDF Viewer */}
        <PDFViewer
          ref={workspaceRef}
          pdfDocProxy={pdfDocProxy}
          pages={pages}
          activePageIndex={activePageIndex}
          onActivatePage={setActivePageIndex}
          zoom={zoom}
          isEditTextMode={isEditTextMode}
          activeDrawingTool={activeDrawingTool}
          onSelectObject={(obj) => {
            setSelectedObject(obj);
            if (obj) {
              setSelectedLink(null);
              setSelectedTextItem(null);
              if (window.innerWidth < 1024) setIsRightPanelOpen(true);
            }
          }}
          onSelectLink={(link) => {
            setSelectedLink(link);
            if (link) {
              setSelectedObject(null);
              setSelectedTextItem(null);
              if (window.innerWidth < 1024) setIsRightPanelOpen(true);
            }
          }}
          selectedLinkId={selectedLink?.id}
          onOpenTextEditor={handleOpenTextEditor}
          selectedTextItem={selectedTextItem}
          onSelectTextItem={(item) => {
            setSelectedTextItem(item);
            if (item) {
              setSelectedObject(null);
              setSelectedLink(null);
              if (window.innerWidth < 1024) setIsRightPanelOpen(true);
            }
          }}
          onDeleteTextItem={handleDeleteTextItem}
          pageEdits={pageEdits}
          pageLinks={pageLinks}
          onUpdatePageEdits={handleUpdatePageEdits}
          onUpdatePageLinks={handleUpdatePageLinks}
        />

        {/* Right Properties Panel */}
        <RightPropertiesPanel
          selectedObject={selectedObject}
          selectedLink={selectedLink}
          selectedTextItem={selectedTextItem}
          onUpdateObjectProps={handleUpdateObjectProps}
          onUpdateLinkUrl={handleUpdateLinkUrl}
          onDeleteSelected={handleDeleteSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onDeleteLink={handleDeleteLink}
          activePageMeta={activePageMeta}
          onRotatePage={(deg) => onRotatePage(activePageIndex, deg)}
          onAddTextBox={handleAddTextBox}
          onAddShape={handleAddShape}
          onAddLink={handleAddNewLink}
          isOpen={isRightPanelOpen}
          onClose={() => setIsRightPanelOpen(false)}
        />
      </div>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="mobile-bottom-bar" aria-label="Mobile Navigation">
        <button
          type="button"
          className={`mobile-nav-btn ${isLeftSidebarOpen && activeSidebarTab === 'thumbnails' ? 'active' : ''}`}
          onClick={() => {
            setActiveSidebarTab('thumbnails');
            setIsLeftSidebarOpen((prev) => (activeSidebarTab === 'thumbnails' && prev ? false : true));
            setIsRightPanelOpen(false);
          }}
        >
          <Layers size={18} />
          <span>Pages</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${isEditTextMode ? 'active' : ''}`}
          onClick={() => {
            setIsEditTextMode(!isEditTextMode);
            setActiveDrawingTool('select');
          }}
        >
          <MousePointerClick size={18} />
          <span>Edit Text</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${isLeftSidebarOpen && activeSidebarTab === 'text' ? 'active' : ''}`}
          onClick={() => {
            setActiveSidebarTab('text');
            setIsLeftSidebarOpen((prev) => (activeSidebarTab === 'text' && prev ? false : true));
            setIsRightPanelOpen(false);
          }}
        >
          <Type size={18} />
          <span>Insert</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${isLeftSidebarOpen && (activeSidebarTab === 'shapes' || activeSidebarTab === 'images') ? 'active' : ''}`}
          onClick={() => {
            setActiveSidebarTab('shapes');
            setIsLeftSidebarOpen((prev) => (activeSidebarTab === 'shapes' && prev ? false : true));
            setIsRightPanelOpen(false);
          }}
        >
          <Square size={18} />
          <span>Tools</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-btn ${isRightPanelOpen ? 'active' : ''}`}
          onClick={() => {
            setIsRightPanelOpen(!isRightPanelOpen);
            if (!isRightPanelOpen) setIsLeftSidebarOpen(false);
          }}
        >
          <Sliders size={18} />
          <span>Properties</span>
          {Boolean(selectedObject || selectedLink || selectedTextItem) && (
            <span className="mobile-nav-badge" />
          )}
        </button>
      </nav>

      {/* Existing Text Editor Modal */}
      <TextEditorModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        textItem={textItemToEdit}
        onApplyReplacement={handleApplyTextReplacement}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        defaultFilename={filename}
        onConfirmExport={handleExecuteExport}
        isExporting={isExporting}
        stats={{
          pageCount: pages.length,
        }}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isDanger={confirmDialog.isDanger}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false })}
      />
    </div>
  );
}
