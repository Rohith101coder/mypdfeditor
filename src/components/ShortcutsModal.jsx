import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl / ⌘ + Z', action: 'Undo last editing action' },
    { key: 'Ctrl / ⌘ + Shift + Z / Ctrl + Y', action: 'Redo last undone action' },
    { key: 'Ctrl / ⌘ + S', action: 'Export and download modified PDF' },
    { key: 'Delete / Backspace', action: 'Delete selected object or hyperlink' },
    { key: 'Escape', action: 'Deselect active object or close dialog' },
    { key: 'Arrow Keys', action: 'Nudge selected object by 1 pt' },
    { key: 'Shift + Arrow Keys', action: 'Nudge selected object by 10 pt' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Keyboard size={18} color="#2563eb" />
            <h2 className="modal-title">Keyboard Shortcuts</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {shortcuts.map((sc, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: '#334155' }}>{sc.action}</span>
                <kbd
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '3px 7px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: '#0f172a',
                    boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
                  }}
                >
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="sidebar-primary-btn"
            style={{ width: 'auto' }}
            onClick={onClose}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
