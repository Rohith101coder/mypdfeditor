import React from 'react';
import { Link as LinkIcon, Plus, ExternalLink, Trash2, Edit3 } from 'lucide-react';
import { normalizeUrl } from '../services/pdfLinkManager';

export default function LinkTools({
  links = [],
  onAddNewLink,
  onSelectLink,
  onDeleteLink,
  selectedLinkId,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div className="tool-section-title">Hyperlinks</div>
        <button
          type="button"
          className="sidebar-primary-btn"
          onClick={() => onAddNewLink('https://example.com')}
        >
          <Plus size={16} />
          <span>Add Hyperlink Region</span>
        </button>

        <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px' }}>
          Adds a real clickable PDF link zone that opens the target URL when clicked in standard PDF readers.
        </p>
      </div>

      {/* Links List on Active Page */}
      <div>
        <div className="tool-section-title">Links on this Page ({links.length})</div>

        {links.length === 0 ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              fontSize: '0.78rem',
              color: '#94a3b8',
            }}
          >
            No hyperlinks found on this page.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {links.map((link) => {
              const isSelected = link.id === selectedLinkId;

              return (
                <div
                  key={link.id}
                  style={{
                    padding: '8px 10px',
                    backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                  onClick={() => onSelectLink(link)}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '140px',
                      }}
                    >
                      {link.url || 'No URL specified'}
                    </span>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      {link.url && (
                        <a
                          href={normalizeUrl(link.url)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '3px',
                            color: '#3b82f6',
                            display: 'inline-flex',
                          }}
                          onClick={(e) => e.stopPropagation()}
                          title="Test Link in new tab"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}

                      <button
                        type="button"
                        className="thumb-action-btn danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLink(link.id);
                        }}
                        title="Delete Hyperlink"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {link.isOriginal ? 'Original PDF Link' : 'Custom Added Link'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
