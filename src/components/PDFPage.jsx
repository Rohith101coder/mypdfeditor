import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { renderPdfPageToCanvas } from '../services/pdfRenderer';
import { extractPageText } from '../services/pdfTextExtractor';
import { extractPageLinks } from '../services/pdfLinkManager';
import { Link as LinkIcon, Edit3 } from 'lucide-react';

export default function PDFPage({
  pageMeta,
  pageIndex,
  pdfDocProxy,
  zoom,
  isActive,
  onActivate,
  isEditTextMode,
  activeDrawingTool,
  onSelectObject,
  onSelectLink,
  selectedLinkId,
  onOpenTextEditor,
  selectedTextItem,
  onSelectTextItem,
  onDeleteTextItem,
  // Edits & Links state for this page
  pageEdits = [],
  pageLinks = [],
  onUpdatePageEdits,
  onUpdatePageLinks,
}) {
  const containerRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const fabricInstanceRef = useRef(null);
  const isInternalActionRef = useRef(false);

  const [textItems, setTextItems] = useState([]);
  const [isRendered, setIsRendered] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: Math.round(pageMeta.width * zoom),
    height: Math.round(pageMeta.height * zoom),
  });

  const isBlank = pageMeta.isBlank || pageMeta.originalPageIndex == null;
  const rotation = pageMeta.rotation || 0;

  // 1. Render Base PDF Page Canvas
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (isBlank || !pdfDocProxy) {
        setIsRendered(true);
        return;
      }

      try {
        const pageProxy = await pdfDocProxy.getPage(pageMeta.originalPageIndex + 1);
        if (isCancelled || !bgCanvasRef.current) return;

        const rendered = await renderPdfPageToCanvas(
          pageProxy,
          bgCanvasRef.current,
          zoom,
          rotation
        );

        if (!isCancelled && rendered) {
          setDimensions({ width: rendered.width, height: rendered.height });
          setIsRendered(true);

          // Extract text items for direct visual editing
          const items = await extractPageText(pageProxy, zoom, rotation);
          if (!isCancelled) {
            setTextItems(items);
          }

          // If no links have been extracted yet, extract initial PDF annotations
          if (!pageLinks || pageLinks.length === 0) {
            const detectedLinks = await extractPageLinks(pageProxy, zoom, rotation);
            if (!isCancelled && detectedLinks.length > 0) {
              onUpdatePageLinks(pageMeta.id, detectedLinks);
            }
          }
        }
      } catch (err) {
        console.error(`Error rendering page ${pageIndex + 1}:`, err);
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDocProxy, pageMeta.originalPageIndex, pageMeta.id, zoom, rotation, isBlank]);

  // Serializes fabric objects and updates page edits in unscaled 1.0 coordinates
  const serializeAndNotifyEdits = useCallback(
    (canvas) => {
      if (!canvas) return;
      isInternalActionRef.current = true;

      const objects = canvas.getObjects();
      const serializedCanvasEdits = objects.map((obj) => {
        const json = obj.toObject([
          'id',
          'type',
          'left',
          'top',
          'width',
          'height',
          'scaleX',
          'scaleY',
          'angle',
          'fill',
          'stroke',
          'strokeWidth',
          'opacity',
          'fontSize',
          'fontFamily',
          'fontWeight',
          'fontStyle',
          'underline',
          'textAlign',
          'text',
          'dataUrl',
          'path',
        ]);

        return {
          ...json,
          id: obj.id || json.id || `edit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          left: Math.round(obj.left * 10) / 10,
          top: Math.round(obj.top * 10) / 10,
          width: Math.round(obj.getScaledWidth() * 10) / 10,
          height: Math.round(obj.getScaledHeight() * 10) / 10,
          fontSize: obj.fontSize ? Math.round(obj.fontSize * 10) / 10 : undefined,
        };
      });

      // Preserve any text-replace items for this page
      const replaceEdits = (pageEdits || []).filter((e) => e.type === 'text-replace');
      onUpdatePageEdits(pageMeta.id, [...replaceEdits, ...serializedCanvasEdits]);

      setTimeout(() => {
        isInternalActionRef.current = false;
      }, 50);
    },
    [pageMeta.id, onUpdatePageEdits, pageEdits]
  );

  // 2. Initialize Fabric.js Canvas
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(fabricCanvasRef.current, {
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
    });

    // Style selection box & handles
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.cornerColor = '#2563eb';
    fabric.Object.prototype.cornerStrokeColor = '#ffffff';
    fabric.Object.prototype.borderColor = '#3b82f6';
    fabric.Object.prototype.cornerSize = 8;
    fabric.Object.prototype.cornerStyle = 'circle';

    // Selection events
    fabricCanvas.on('selection:created', (e) => {
      const active = e.selected ? e.selected[0] : null;
      if (active) {
        onSelectObject(active);
        if (onSelectTextItem) onSelectTextItem(null);
        if (onSelectLink) onSelectLink(null);
      }
    });

    fabricCanvas.on('selection:updated', (e) => {
      const active = e.selected ? e.selected[0] : null;
      if (active) {
        onSelectObject(active);
        if (onSelectTextItem) onSelectTextItem(null);
        if (onSelectLink) onSelectLink(null);
      }
    });

    fabricCanvas.on('selection:cleared', () => {
      onSelectObject(null);
    });

    fabricCanvas.on('object:modified', () => {
      serializeAndNotifyEdits(fabricCanvas);
      const activeObj = fabricCanvas.getActiveObject();
      if (activeObj) onSelectObject(activeObj);
    });

    fabricCanvas.on('text:changed', () => {
      serializeAndNotifyEdits(fabricCanvas);
      const activeObj = fabricCanvas.getActiveObject();
      if (activeObj) onSelectObject(activeObj);
    });

    fabricCanvas.on('path:created', () => {
      serializeAndNotifyEdits(fabricCanvas);
    });

    fabricInstanceRef.current = fabricCanvas;

    return () => {
      fabricCanvas.dispose();
      fabricInstanceRef.current = null;
    };
  }, []);

  // 3. Synchronize Fabric canvas objects from pageEdits (non-replace items)
  useEffect(() => {
    const canvas = fabricInstanceRef.current;
    if (!canvas || isInternalActionRef.current) return;

    const fabricEdits = pageEdits.filter((e) => e.type !== 'text-replace');
    const existingCanvasObjects = canvas.getObjects();
    const editIds = new Set(fabricEdits.map((e) => e.id));

    // Remove objects deleted from pageEdits
    existingCanvasObjects.forEach((obj) => {
      if (obj.id && !editIds.has(obj.id)) {
        canvas.remove(obj);
      }
    });

    // Add or update objects from fabricEdits
    fabricEdits.forEach((edit) => {
      const existing = canvas.getObjects().find((obj) => obj.id === edit.id);

      if (existing) {
        let changed = false;
        if (existing.type === 'textbox' || existing.type === 'text') {
          if (edit.text !== undefined && existing.text !== edit.text) {
            existing.set('text', edit.text);
            changed = true;
          }
          if (edit.fontSize && existing.fontSize !== edit.fontSize) {
            existing.set('fontSize', edit.fontSize);
            changed = true;
          }
          if (edit.fontFamily && existing.fontFamily !== edit.fontFamily) {
            existing.set('fontFamily', edit.fontFamily);
            changed = true;
          }
          if (edit.fill && existing.fill !== edit.fill) {
            existing.set('fill', edit.fill);
            changed = true;
          }
          if (edit.fontWeight && existing.fontWeight !== edit.fontWeight) {
            existing.set('fontWeight', edit.fontWeight);
            changed = true;
          }
          if (edit.fontStyle && existing.fontStyle !== edit.fontStyle) {
            existing.set('fontStyle', edit.fontStyle);
            changed = true;
          }
        } else if (existing.type === 'rect' || existing.type === 'circle') {
          if (edit.fill && existing.fill !== edit.fill) {
            existing.set('fill', edit.fill);
            changed = true;
          }
          if (edit.stroke && existing.stroke !== edit.stroke) {
            existing.set('stroke', edit.stroke);
            changed = true;
          }
          if (edit.strokeWidth != null && existing.strokeWidth !== edit.strokeWidth) {
            existing.set('strokeWidth', edit.strokeWidth);
            changed = true;
          }
        }
        if (edit.opacity != null && existing.opacity !== edit.opacity) {
          existing.set('opacity', edit.opacity);
          changed = true;
        }

        if (changed) {
          existing.setCoords();
        }
      } else {
        // Create new object
        let newObj = null;

        if (edit.type === 'textbox') {
          newObj = new fabric.Textbox(edit.text || 'Type your text...', {
            id: edit.id,
            left: edit.left || 80,
            top: edit.top || 100,
            width: edit.width || 200,
            fontSize: edit.fontSize || 16,
            fontFamily: edit.fontFamily || 'Helvetica',
            fontWeight: edit.fontWeight || (edit.isBold ? 'bold' : 'normal'),
            fontStyle: edit.fontStyle || (edit.isItalic ? 'italic' : 'normal'),
            fill: edit.fill || edit.fontColor || '#000000',
            opacity: edit.opacity != null ? edit.opacity : 1.0,
            angle: edit.angle || 0,
            editable: true,
            cursorColor: '#2563eb',
          });
        } else if (edit.type === 'rect') {
          newObj = new fabric.Rect({
            id: edit.id,
            left: edit.left || 100,
            top: edit.top || 120,
            width: edit.width || 140,
            height: edit.height || 90,
            fill: edit.fill || '#eff6ff',
            stroke: edit.stroke || '#2563eb',
            strokeWidth: edit.strokeWidth || 2,
            opacity: edit.opacity != null ? edit.opacity : 1.0,
            angle: edit.angle || 0,
          });
        } else if (edit.type === 'circle') {
          newObj = new fabric.Circle({
            id: edit.id,
            left: edit.left || 120,
            top: edit.top || 120,
            radius: (edit.width || 100) / 2,
            fill: edit.fill || '#fef2f2',
            stroke: edit.stroke || '#ef4444',
            strokeWidth: edit.strokeWidth || 2,
            opacity: edit.opacity != null ? edit.opacity : 1.0,
          });
        } else if (edit.type === 'line' || edit.type === 'arrow') {
          newObj = new fabric.Line(
            [edit.x1 || 100, edit.y1 || 150, edit.x2 || 250, edit.y2 || 150],
            {
              id: edit.id,
              stroke: edit.stroke || '#0f172a',
              strokeWidth: edit.strokeWidth || 3,
              opacity: edit.opacity != null ? edit.opacity : 1.0,
            }
          );
        } else if (edit.type === 'image' && edit.dataUrl) {
          fabric.Image.fromURL(edit.dataUrl, (img) => {
            img.set({
              id: edit.id,
              left: edit.left || 80,
              top: edit.top || 120,
              scaleX: (edit.width || 180) / img.width,
              scaleY: (edit.height || 120) / img.height,
              opacity: edit.opacity != null ? edit.opacity : 1.0,
              angle: edit.angle || 0,
            });
            canvas.add(img);
            canvas.requestRenderAll();
          });
        }

        if (newObj) {
          canvas.add(newObj);
          canvas.setActiveObject(newObj);
        }
      }
    });

    canvas.requestRenderAll();
  }, [pageEdits]);

  // 4. Update Fabric dimensions and scale via canvas.setZoom
  useEffect(() => {
    const canvas = fabricInstanceRef.current;
    if (!canvas) return;

    canvas.setDimensions({
      width: dimensions.width,
      height: dimensions.height,
    });
    canvas.setZoom(zoom);
    canvas.requestRenderAll();
  }, [dimensions, zoom]);

  // 5. Update Drawing mode (Pen / Highlighter)
  useEffect(() => {
    const canvas = fabricInstanceRef.current;
    if (!canvas) return;

    if (activeDrawingTool === 'pen') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = '#000000';
      canvas.freeDrawingBrush.width = 2;
    } else if (activeDrawingTool === 'highlighter') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = 'rgba(250, 204, 21, 0.45)';
      canvas.freeDrawingBrush.width = 16;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [activeDrawingTool]);

  // Click handler to activate page
  const handlePageClick = () => {
    if (!isActive) {
      onActivate(pageIndex);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`pdf-page-container ${isActive ? 'active-page' : ''}`}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
      onClick={handlePageClick}
      data-page-index={pageIndex}
    >
      {/* Background Canvas (PDF.js render) */}
      {!isBlank && (
        <canvas
          ref={bgCanvasRef}
          className="pdf-canvas-bg"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
        />
      )}

      {/* Blank page white background */}
      {isBlank && (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            position: 'absolute',
            inset: 0,
          }}
        />
      )}

      {/* Applied Text Replacements Layer (visibly covers original text and displays new text) */}
      <div className="text-replacements-layer">
        {pageEdits
          .filter((edit) => edit.type === 'text-replace')
          .map((edit) => {
            const isSelected = selectedTextItem?.id === edit.id;
            return (
              <div
                key={edit.id}
                className={`text-replace-box ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `${edit.left * zoom}px`,
                  top: `${edit.top * zoom}px`,
                  minWidth: `${edit.width * zoom}px`,
                  minHeight: `${edit.height * zoom}px`,
                  backgroundColor: edit.bgColor || '#ffffff',
                  color: edit.fontColor || '#000000',
                  fontFamily: edit.fontFamily || 'Helvetica, Arial, sans-serif',
                  fontSize: `${(edit.fontSize || 12) * zoom}px`,
                  fontWeight: edit.isBold ? 'bold' : 'normal',
                  fontStyle: edit.isItalic ? 'italic' : 'normal',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectTextItem) onSelectTextItem(edit);
                  if (onSelectObject) onSelectObject(null);
                  if (onSelectLink) onSelectLink(null);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (onOpenTextEditor) onOpenTextEditor(edit);
                }}
                title={`Replaced Text: "${edit.text}" (Click to select, double-click to edit)`}
              >
                <span>{edit.text}</span>
                {isSelected && (
                  <div className="replace-box-controls">
                    <button
                      type="button"
                      className="replace-box-control-btn edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenTextEditor) onOpenTextEditor(edit);
                      }}
                      title="Edit replacement text"
                    >
                      <Edit3 size={11} />
                    </button>
                    <button
                      type="button"
                      className="replace-box-control-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeleteTextItem) onDeleteTextItem(edit.id);
                      }}
                      title="Revert to original text"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Fabric.js Canvas Layer */}
      <div className="fabric-canvas-wrapper">
        <canvas ref={fabricCanvasRef} />
      </div>

      {/* Text Extraction Layer (for Existing Text Selection & Replacement) */}
      {isEditTextMode && (
        <div className="text-extract-layer interactive">
          {textItems.map((item) => {
            const isReplaced = pageEdits.some(
              (e) => e.type === 'text-replace' && e.originalText === item.str
            );

            return (
              <div
                key={item.id}
                className={`text-item-box ${isReplaced ? 'editing-active' : ''}`}
                style={{
                  left: `${item.left}px`,
                  top: `${item.top}px`,
                  width: `${item.width}px`,
                  height: `${item.height}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // If already replaced, prefill with current replacement edit
                  const existingEdit = pageEdits.find(
                    (ed) => ed.type === 'text-replace' && ed.originalText === item.str
                  );
                  if (existingEdit) {
                    onOpenTextEditor({
                      ...item,
                      ...existingEdit,
                      replacementText: existingEdit.text,
                    });
                  } else {
                    onOpenTextEditor(item);
                  }
                }}
                title={isReplaced ? `Edited: "${item.str}" (Click to re-edit)` : `Click to edit text: "${item.str}"`}
              />
            );
          })}
        </div>
      )}

      {/* Hyperlinks Overlay Layer */}
      <div className="links-layer">
        {pageLinks.map((link) => {
          if (link.isDeleted) return null;
          const isSelected = selectedLinkId === link.id;

          return (
            <div
              key={link.id}
              className={`link-highlight-box ${isSelected ? 'selected' : ''}`}
              style={{
                left: `${link.left * zoom}px`,
                top: `${link.top * zoom}px`,
                width: `${link.width * zoom}px`,
                height: `${link.height * zoom}px`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectLink(link);
              }}
              title={`Hyperlink: ${link.url || 'No URL'}`}
            >
              <div className="link-badge-icon">
                <LinkIcon size={9} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
