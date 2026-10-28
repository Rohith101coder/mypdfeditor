import React, { useEffect, useState } from 'react';
import {
  RotateCw,
  RotateCcw,
  Copy,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  FileCode,
} from 'lucide-react';
import { renderPageThumbnail } from '../services/pdfRenderer';

export default function PageThumbnails({
  pdfDocProxy,
  pages,
  activePageIndex,
  onSelectPage,
  onRotatePage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
  onAddBlankPage,
}) {
  const [thumbnails, setThumbnails] = useState({});

  // Generate thumbnail previews when pages or rotations change
  useEffect(() => {
    if (!pdfDocProxy) return;

    let isMounted = true;
    pages.forEach(async (page, idx) => {
      if (page.isBlank) {
        // Blank page preview
        if (isMounted) {
          setThumbnails((prev) => ({ ...prev, [page.id]: 'blank' }));
        }
        return;
      }

      if (page.originalPageIndex != null) {
        const thumbUrl = await renderPageThumbnail(
          pdfDocProxy,
          page.originalPageIndex + 1,
          130,
          page.rotation
        );
        if (isMounted && thumbUrl) {
          setThumbnails((prev) => ({ ...prev, [page.id]: thumbUrl }));
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [pdfDocProxy, pages]);

  return (
    <div className="thumbnail-list">
      <button
        type="button"
        className="sidebar-primary-btn"
        onClick={() => onAddBlankPage(activePageIndex)}
      >
        <Plus size={16} />
        <span>Add Blank Page</span>
      </button>

      {pages.map((page, index) => {
        const isActive = index === activePageIndex;
        const thumbSrc = thumbnails[page.id];

        return (
          <div
            key={page.id}
            className={`thumbnail-card ${isActive ? 'active' : ''}`}
            onClick={() => onSelectPage(index)}
          >
            {/* Preview Box */}
            <div className="thumbnail-preview-wrap">
              {thumbSrc === 'blank' ? (
                <div style={{ color: '#94a3b8', fontSize: '11px', textAlign: 'center' }}>
                  <FileCode size={24} style={{ margin: '0 auto 4px', display: 'block' }} />
                  Blank Page
                </div>
              ) : thumbSrc ? (
                <img
                  src={thumbSrc}
                  alt={`Page ${index + 1}`}
                  style={{
                    transform: `rotate(${page.rotation || 0}deg)`,
                    transition: 'transform 0.2s ease',
                  }}
                />
              ) : (
                <div style={{ color: '#cbd5e1', fontSize: '11px' }}>Loading...</div>
              )}
            </div>

            {/* Thumbnail Footer Actions */}
            <div className="thumbnail-footer">
              <span className="thumbnail-page-number">Page {index + 1}</span>

              <div className="thumbnail-actions" onClick={(e) => e.stopPropagation()}>
                {/* Move Up */}
                <button
                  type="button"
                  className="thumb-action-btn"
                  title="Move Page Up"
                  disabled={index === 0}
                  onClick={() => onMovePage(index, index - 1)}
                >
                  <ArrowUp size={13} />
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  className="thumb-action-btn"
                  title="Move Page Down"
                  disabled={index === pages.length - 1}
                  onClick={() => onMovePage(index, index + 1)}
                >
                  <ArrowDown size={13} />
                </button>

                {/* Rotate CW */}
                <button
                  type="button"
                  className="thumb-action-btn"
                  title="Rotate 90° Clockwise"
                  onClick={() => onRotatePage(index, 90)}
                >
                  <RotateCw size={13} />
                </button>

                {/* Duplicate */}
                <button
                  type="button"
                  className="thumb-action-btn"
                  title="Duplicate Page"
                  onClick={() => onDuplicatePage(index)}
                >
                  <Copy size={13} />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  className="thumb-action-btn danger"
                  title="Delete Page"
                  disabled={pages.length <= 1}
                  onClick={() => onDeletePage(index)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
