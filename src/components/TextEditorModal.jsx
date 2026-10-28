import React, { useState } from 'react';
import { X, Check, Type } from 'lucide-react';
import { AVAILABLE_FONTS } from '../utils/fontUtils';

export default function TextEditorModal({
  isOpen,
  onClose,
  textItem,
  onApplyReplacement,
}) {
  if (!isOpen || !textItem) return null;

  const [text, setText] = useState(textItem.replacementText || textItem.str || '');
  const [fontFamily, setFontFamily] = useState(textItem.fontFamily || 'Helvetica');
  const [fontSize, setFontSize] = useState(textItem.fontSize || 12);
  const [fontColor, setFontColor] = useState(textItem.fontColor || '#000000');
  const [bgColor, setBgColor] = useState(textItem.bgColor || '#ffffff');
  const [isBold, setIsBold] = useState(textItem.isBold || false);
  const [isItalic, setIsItalic] = useState(textItem.isItalic || false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplyReplacement({
      ...textItem,
      text,
      fontFamily,
      fontSize: parseInt(fontSize, 10) || 12,
      fontColor,
      bgColor,
      isBold,
      isItalic,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Type size={18} color="#2563eb" />
            <h2 className="modal-title">Edit Document Text</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Original Text */}
            <div className="prop-section">
              <span className="prop-section-title">Original Text on Page</span>
              <div
                style={{
                  padding: '10px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: '#475569',
                  fontStyle: 'italic',
                }}
              >
                "{textItem.str}"
              </div>
            </div>

            {/* Replacement Text */}
            <div className="prop-section">
              <span className="prop-section-title">New Replacement Text</span>
              <textarea
                className="prop-textarea"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter replacement text..."
                autoFocus
              />
            </div>

            {/* Typography Controls */}
            <div className="modal-grid-2col">
              <div className="prop-section">
                <span className="prop-section-title">Font Family</span>
                <select
                  className="prop-select"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                >
                  {AVAILABLE_FONTS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="prop-section">
                <span className="prop-section-title">Font Size (pt)</span>
                <input
                  type="number"
                  className="prop-input"
                  min="6"
                  max="120"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                />
              </div>
            </div>

            {/* Colors */}
            <div className="modal-grid-2col">
              <div className="prop-section">
                <span className="prop-section-title">Text Color</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    className="color-input-native"
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{fontColor}</span>
                </div>
              </div>

              <div className="prop-section">
                <span className="prop-section-title">Cover Background Color</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    className="color-input-native"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    title="Color matching page background to cover original text"
                  />
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{bgColor}</span>
                </div>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="prop-section">
              <span className="prop-section-title">Live Preview</span>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: bgColor,
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  color: fontColor,
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  fontWeight: isBold ? 'bold' : 'normal',
                  fontStyle: isItalic ? 'italic' : 'normal',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {text || <span style={{ color: '#94a3b8' }}>(Empty text)</span>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="sidebar-secondary-btn"
              style={{ width: 'auto' }}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="sidebar-primary-btn"
              style={{ width: 'auto' }}
            >
              <Check size={16} />
              <span>Apply Replacement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
