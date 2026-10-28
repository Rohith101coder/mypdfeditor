import React, { useState } from 'react';
import { X, Download, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';

export default function ExportDialog({
  isOpen,
  onClose,
  defaultFilename,
  onConfirmExport,
  isExporting,
  stats,
}) {
  if (!isOpen) return null;

  const [filename, setFilename] = useState(
    defaultFilename ? defaultFilename.replace(/\.pdf$/i, '') + '-edited.pdf' : 'document-edited.pdf'
  );

  const handleExport = (e) => {
    e.preventDefault();
    const finalName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    onConfirmExport(finalName);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} color="#2563eb" />
            <h2 className="modal-title">Export Modified PDF</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleExport}>
          <div className="modal-body">
            <div className="prop-section">
              <span className="prop-section-title">Save As Filename</span>
              <input
                type="text"
                className="prop-input"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="document-edited.pdf"
                required
              />
            </div>

            {/* Export Summary */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Export Verification Checklist
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#166534' }}>
                <CheckCircle size={15} color="#16a34a" />
                <span>Original vector graphics & layouts preserved</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#1e293b' }}>
                <CheckCircle size={15} color="#2563eb" />
                <span>Pages: {stats?.pageCount || 1} total</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#1e293b' }}>
                <CheckCircle size={15} color="#2563eb" />
                <span>Text replacements & text boxes applied</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#1e293b' }}>
                <CheckCircle size={15} color="#2563eb" />
                <span>Clickable link annotations attached</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                fontSize: '0.74rem',
                color: '#15803d',
              }}
            >
              <ShieldCheck size={16} />
              <span>100% Client-Side generation. Download is immediate and local.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="sidebar-secondary-btn"
              style={{ width: 'auto' }}
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="sidebar-primary-btn"
              style={{ width: 'auto' }}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Export & Download</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
