import React from 'react';
import {
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Copy,
  Link as LinkIcon,
  ExternalLink,
  Layers,
  Square,
  Sliders,
  RotateCw,
  X,
} from 'lucide-react';
import { AVAILABLE_FONTS, FONT_SIZES } from '../utils/fontUtils';
import { isValidUrl, normalizeUrl } from '../services/pdfLinkManager';

function PanelContainer({ title, isOpen, onClose, children }) {
  return (
    <>
      {isOpen && onClose && (
        <div className="drawer-backdrop properties-backdrop" onClick={onClose} />
      )}
      <aside className={`properties-panel ${isOpen ? 'panel-open' : ''}`}>
        <div className="properties-header">
          <span className="properties-title">{title}</span>
          {onClose && (
            <button
              type="button"
              className="properties-close-btn"
              onClick={onClose}
              title="Close Properties"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="properties-body">
          {children}
        </div>
      </aside>
    </>
  );
}

export default function RightPropertiesPanel({
  selectedObject,
  selectedLink,
  selectedTextItem,
  onUpdateObjectProps,
  onUpdateLinkUrl,
  onDeleteSelected,
  onDuplicateSelected,
  onDeleteLink,
  activePageMeta,
  onRotatePage,
  onAddTextBox,
  onAddShape,
  onAddLink,
  isOpen = false,
  onClose,
}) {
  // If an existing text item is selected for editing
  if (selectedTextItem) {
    return (
      <PanelContainer title="Edit Existing Text" isOpen={isOpen} onClose={onClose}>
          <div className="prop-section">
            <span className="prop-section-title">Original Text</span>
            <div
              style={{
                padding: '8px',
                backgroundColor: '#f1f5f9',
                borderRadius: '4px',
                fontSize: '0.8rem',
                color: '#64748b',
                fontStyle: 'italic',
              }}
            >
              "{selectedTextItem.originalText || selectedTextItem.str}"
            </div>
          </div>

          <div className="prop-section">
            <span className="prop-section-title">Replacement Text</span>
            <textarea
              className="prop-textarea"
              value={selectedTextItem.text != null ? selectedTextItem.text : selectedTextItem.str}
              onChange={(e) =>
                onUpdateObjectProps({ text: e.target.value })
              }
              placeholder="Type replacement text..."
            />
          </div>

          <div className="prop-section">
            <span className="prop-section-title">Typography</span>
            <select
              className="prop-select"
              value={selectedTextItem.fontFamily || 'Helvetica'}
              onChange={(e) => onUpdateObjectProps({ fontFamily: e.target.value })}
            >
              {AVAILABLE_FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <div className="prop-row" style={{ marginTop: '6px' }}>
              <span className="prop-label">Font Size</span>
              <input
                type="number"
                className="prop-input small"
                value={selectedTextItem.fontSize || 14}
                onChange={(e) =>
                  onUpdateObjectProps({ fontSize: parseInt(e.target.value, 10) || 14 })
                }
              />
            </div>
          </div>

          <div className="prop-section">
            <span className="prop-section-title">Colors</span>
            <div className="prop-row">
              <span className="prop-label">Text Color</span>
              <input
                type="color"
                className="color-input-native"
                value={selectedTextItem.fontColor || '#000000'}
                onChange={(e) => onUpdateObjectProps({ fontColor: e.target.value })}
              />
            </div>

            <div className="prop-row">
              <span className="prop-label">Cover Background</span>
              <input
                type="color"
                className="color-input-native"
                value={selectedTextItem.bgColor || '#ffffff'}
                onChange={(e) => onUpdateObjectProps({ bgColor: e.target.value })}
                title="Matches original page background to cover text"
              />
            </div>
          </div>

          <div className="prop-section" style={{ marginTop: 'auto' }}>
            <button
              type="button"
              className="prop-action-btn danger"
              onClick={onDeleteSelected}
            >
              <Trash2 size={14} />
              <span>Revert to Original Text</span>
            </button>
          </div>
        </PanelContainer>
      );
    }

  // If a Hyperlink is selected
  if (selectedLink) {
    const valid = isValidUrl(selectedLink.url);

    return (
      <PanelContainer title="Link Properties" isOpen={isOpen} onClose={onClose}>
          <div className="prop-section">
            <span className="prop-section-title">Target Destination URL</span>
            <input
              type="text"
              className="prop-input"
              value={selectedLink.url || ''}
              onChange={(e) => onUpdateLinkUrl(selectedLink.id, e.target.value)}
              placeholder="https://example.com"
            />
            {!valid && selectedLink.url && (
              <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>
                Please enter a valid URL starting with http:// or https://
              </span>
            )}
          </div>

          <div className="prop-section">
            <a
              href={normalizeUrl(selectedLink.url)}
              target="_blank"
              rel="noreferrer"
              className="sidebar-secondary-btn"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={14} />
              <span>Test Link in New Tab</span>
            </a>
          </div>

          <div className="prop-section">
            <span className="prop-section-title">Bounding Box (Points)</span>
            <div className="prop-row">
              <span className="prop-label">Width</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {Math.round(selectedLink.width)} pt
              </span>
            </div>
            <div className="prop-row">
              <span className="prop-label">Height</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {Math.round(selectedLink.height)} pt
              </span>
            </div>
          </div>

          <div className="prop-section" style={{ marginTop: 'auto' }}>
            <button
              type="button"
              className="prop-action-btn danger"
              onClick={() => onDeleteLink(selectedLink.id)}
            >
              <Trash2 size={14} />
              <span>Delete Hyperlink</span>
            </button>
          </div>
        </PanelContainer>
      );
    }

  // If a Fabric Object is selected (Text, Shape, Image)
  if (selectedObject) {
    const isText =
      selectedObject.type === 'textbox' ||
      selectedObject.type === 'i-text' ||
      selectedObject.type === 'text';
    const isShape = ['rect', 'circle', 'line', 'triangle', 'arrow'].includes(
      selectedObject.type
    );
    const isImage = selectedObject.type === 'image';

    return (
      <PanelContainer
        title={isText ? 'Text Properties' : isShape ? 'Shape Properties' : 'Image Properties'}
        isOpen={isOpen}
        onClose={onClose}
      >
          {/* Text Content */}
          {isText && (
            <div className="prop-section">
              <span className="prop-section-title">Text Content</span>
              <textarea
                className="prop-textarea"
                value={selectedObject.text || ''}
                onChange={(e) => onUpdateObjectProps({ text: e.target.value })}
              />
            </div>
          )}

          {/* Typography Controls */}
          {isText && (
            <div className="prop-section">
              <span className="prop-section-title">Typography</span>
              <select
                className="prop-select"
                value={selectedObject.fontFamily || 'Helvetica'}
                onChange={(e) => onUpdateObjectProps({ fontFamily: e.target.value })}
              >
                {AVAILABLE_FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              <div className="prop-row" style={{ marginTop: '6px' }}>
                <span className="prop-label">Font Size</span>
                <input
                  type="number"
                  className="prop-input small"
                  value={Math.round(selectedObject.fontSize || 16)}
                  onChange={(e) =>
                    onUpdateObjectProps({ fontSize: parseInt(e.target.value, 10) || 16 })
                  }
                />
              </div>

              {/* Bold, Italic, Underline */}
              <div className="btn-group" style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  className={`btn-group-item ${selectedObject.fontWeight === 'bold' ? 'active' : ''}`}
                  onClick={() =>
                    onUpdateObjectProps({
                      fontWeight: selectedObject.fontWeight === 'bold' ? 'normal' : 'bold',
                    })
                  }
                  title="Bold"
                >
                  <Bold size={14} />
                </button>

                <button
                  type="button"
                  className={`btn-group-item ${selectedObject.fontStyle === 'italic' ? 'active' : ''}`}
                  onClick={() =>
                    onUpdateObjectProps({
                      fontStyle: selectedObject.fontStyle === 'italic' ? 'normal' : 'italic',
                    })
                  }
                  title="Italic"
                >
                  <Italic size={14} />
                </button>

                <button
                  type="button"
                  className={`btn-group-item ${selectedObject.underline ? 'active' : ''}`}
                  onClick={() =>
                    onUpdateObjectProps({
                      underline: !selectedObject.underline,
                    })
                  }
                  title="Underline"
                >
                  <Underline size={14} />
                </button>
              </div>

              {/* Alignment */}
              <div className="btn-group" style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  className={`btn-group-item ${selectedObject.textAlign === 'left' ? 'active' : ''}`}
                  onClick={() => onUpdateObjectProps({ textAlign: 'left' })}
                  title="Align Left"
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  type="button"
                  className={`btn-group-item ${selectedObject.textAlign === 'center' ? 'active' : ''}`}
                  onClick={() => onUpdateObjectProps({ textAlign: 'center' })}
                  title="Align Center"
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  type="button"
                  className={`btn-group-item ${selectedObject.textAlign === 'right' ? 'active' : ''}`}
                  onClick={() => onUpdateObjectProps({ textAlign: 'right' })}
                  title="Align Right"
                >
                  <AlignRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Color Controls */}
          <div className="prop-section">
            <span className="prop-section-title">Color & Stroke</span>

            <div className="prop-row">
              <span className="prop-label">{isText ? 'Text Color' : 'Fill Color'}</span>
              <input
                type="color"
                className="color-input-native"
                value={selectedObject.fill && selectedObject.fill !== 'transparent' ? selectedObject.fill : '#000000'}
                onChange={(e) => onUpdateObjectProps({ fill: e.target.value })}
              />
            </div>

            {isShape && (
              <>
                <div className="prop-row">
                  <span className="prop-label">Stroke Color</span>
                  <input
                    type="color"
                    className="color-input-native"
                    value={selectedObject.stroke || '#000000'}
                    onChange={(e) => onUpdateObjectProps({ stroke: e.target.value })}
                  />
                </div>

                <div className="prop-row">
                  <span className="prop-label">Stroke Width</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="prop-input small"
                    value={selectedObject.strokeWidth || 1}
                    onChange={(e) =>
                      onUpdateObjectProps({ strokeWidth: parseInt(e.target.value, 10) || 1 })
                    }
                  />
                </div>
              </>
            )}
          </div>

          {/* Opacity Slider */}
          <div className="prop-section">
            <span className="prop-section-title">Opacity</span>
            <div className="prop-slider-wrap">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                className="prop-slider"
                value={selectedObject.opacity != null ? selectedObject.opacity : 1.0}
                onChange={(e) =>
                  onUpdateObjectProps({ opacity: parseFloat(e.target.value) })
                }
              />
              <span className="prop-slider-val">
                {Math.round((selectedObject.opacity != null ? selectedObject.opacity : 1.0) * 100)}%
              </span>
            </div>
          </div>

          {/* Position & Size */}
          <div className="prop-section">
            <span className="prop-section-title">Position & Dimensions</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <div>
                <span className="prop-label">X</span>
                <input
                  type="number"
                  className="prop-input"
                  value={Math.round(selectedObject.left || 0)}
                  onChange={(e) =>
                    onUpdateObjectProps({ left: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>

              <div>
                <span className="prop-label">Y</span>
                <input
                  type="number"
                  className="prop-input"
                  value={Math.round(selectedObject.top || 0)}
                  onChange={(e) =>
                    onUpdateObjectProps({ top: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>

              <div>
                <span className="prop-label">Width</span>
                <input
                  type="number"
                  className="prop-input"
                  value={Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1))}
                  onChange={(e) =>
                    onUpdateObjectProps({
                      width: parseInt(e.target.value, 10) || 10,
                      scaleX: 1,
                    })
                  }
                />
              </div>

              <div>
                <span className="prop-label">Height</span>
                <input
                  type="number"
                  className="prop-input"
                  value={Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1))}
                  onChange={(e) =>
                    onUpdateObjectProps({
                      height: parseInt(e.target.value, 10) || 10,
                      scaleY: 1,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="prop-section" style={{ marginTop: 'auto', gap: '8px' }}>
            <button
              type="button"
              className="prop-action-btn"
              onClick={onDuplicateSelected}
            >
              <Copy size={14} />
              <span>Duplicate</span>
            </button>

            <button
              type="button"
              className="prop-action-btn danger"
              onClick={onDeleteSelected}
            >
              <Trash2 size={14} />
              <span>Delete Object</span>
            </button>
          </div>
        </PanelContainer>
      );
    }

  // Default Empty State (No selection) -> Show page overview and quick actions
  return (
    <PanelContainer title="Document & Page" isOpen={isOpen} onClose={onClose}>
        {activePageMeta && (
          <div className="prop-section">
            <span className="prop-section-title">Active Page</span>
            <div
              style={{
                padding: '10px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div className="prop-row">
                <span className="prop-label">Page Dimensions</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  {Math.round(activePageMeta.width)} × {Math.round(activePageMeta.height)} pt
                </span>
              </div>

              <div className="prop-row">
                <span className="prop-label">Rotation</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  {activePageMeta.rotation || 0}°
                </span>
              </div>
            </div>

            <button
              type="button"
              className="sidebar-secondary-btn"
              style={{ marginTop: '8px' }}
              onClick={() => onRotatePage(90)}
            >
              <RotateCw size={14} />
              <span>Rotate Page 90°</span>
            </button>
          </div>
        )}

        <div className="prop-section">
          <span className="prop-section-title">Quick Insert</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              className="sidebar-secondary-btn"
              onClick={() => onAddTextBox({ fontSize: 16, text: 'New Text Box' })}
            >
              <Type size={14} />
              <span>Add Text Box</span>
            </button>

            <button
              type="button"
              className="sidebar-secondary-btn"
              onClick={() => onAddShape('rect')}
            >
              <Square size={14} />
              <span>Add Rectangle</span>
            </button>

            <button
              type="button"
              className="sidebar-secondary-btn"
              onClick={() => onAddLink('https://example.com')}
            >
              <LinkIcon size={14} />
              <span>Add Hyperlink</span>
            </button>
          </div>
        </div>

        <div className="empty-properties">
          <div className="empty-properties-icon">
            <Sliders size={20} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
            No Object Selected
          </span>
          <p style={{ fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Click any text, shape, image, or link on the page to view and edit its properties.
          </p>
        </div>
      </PanelContainer>
    );
  }
