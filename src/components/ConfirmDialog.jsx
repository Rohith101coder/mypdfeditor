import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color={isDanger ? '#ef4444' : '#f59e0b'} />
            <h2 className="modal-title">{title}</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="sidebar-secondary-btn"
            style={{ width: 'auto' }}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={`sidebar-primary-btn ${isDanger ? 'danger' : ''}`}
            style={{
              width: 'auto',
              backgroundColor: isDanger ? '#ef4444' : undefined,
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
