import React from 'react';
import {
  Type,
  Heading1,
  Heading2,
  AlignLeft,
  FileCode,
  MousePointerClick,
  Info,
} from 'lucide-react';

export default function TextTools({
  isEditTextMode,
  onToggleEditTextMode,
  onAddTextBox,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Existing Text Editing Toggle */}
      <div
        style={{
          padding: '12px',
          backgroundColor: isEditTextMode ? '#eff6ff' : '#f8fafc',
          border: `1.5px solid ${isEditTextMode ? '#2563eb' : '#e2e8f0'}`,
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MousePointerClick
            size={18}
            color={isEditTextMode ? '#2563eb' : '#64748b'}
          />
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: isEditTextMode ? '#1e40af' : '#1e293b',
            }}
          >
            Edit Existing Text
          </span>
        </div>

        <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
          Click on any word or sentence in the document to edit its text, font size, or color.
        </p>

        <button
          type="button"
          className={`sidebar-primary-btn ${isEditTextMode ? '' : 'sidebar-secondary-btn'}`}
          onClick={onToggleEditTextMode}
        >
          {isEditTextMode ? 'Active (Click text to edit)' : 'Enable Text Selection'}
        </button>
      </div>

      {/* Insert New Text Section */}
      <div>
        <div className="tool-section-title">Insert New Text</div>
        <button
          type="button"
          className="sidebar-primary-btn"
          style={{ marginBottom: '10px' }}
          onClick={() => onAddTextBox({ fontSize: 16, text: 'Click to edit text' })}
        >
          <Type size={16} />
          <span>Add Custom Text Box</span>
        </button>

        <div className="tool-grid">
          <button
            type="button"
            className="tool-btn"
            onClick={() =>
              onAddTextBox({
                fontSize: 24,
                isBold: true,
                text: 'Heading 1',
              })
            }
          >
            <Heading1 size={18} />
            <span>Heading</span>
          </button>

          <button
            type="button"
            className="tool-btn"
            onClick={() =>
              onAddTextBox({
                fontSize: 18,
                isBold: true,
                text: 'Subheading',
              })
            }
          >
            <Heading2 size={18} />
            <span>Subheading</span>
          </button>

          <button
            type="button"
            className="tool-btn"
            onClick={() =>
              onAddTextBox({
                fontSize: 12,
                text: 'Enter paragraph text here...',
              })
            }
          >
            <AlignLeft size={18} />
            <span>Body Text</span>
          </button>

          <button
            type="button"
            className="tool-btn"
            onClick={() =>
              onAddTextBox({
                fontSize: 11,
                fontFamily: 'Courier',
                text: 'CODE_OR_NOTE_01',
              })
            }
          >
            <FileCode size={18} />
            <span>Monospace</span>
          </button>
        </div>
      </div>

      {/* Info Tip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          padding: '10px',
          backgroundColor: '#f1f5f9',
          borderRadius: '6px',
          fontSize: '0.74rem',
          color: '#475569',
          lineHeight: 1.4,
        }}
      >
        <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          Editing replaces text visually with a background-matched cover and sharp vector text. Surrounding vector graphics remain preserved.
        </span>
      </div>
    </div>
  );
}
