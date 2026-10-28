import React from 'react';
import { FileText, Shield, HardDrive, Calendar, User, BookOpen } from 'lucide-react';
import { formatBytes } from '../utils/fileValidation';

export default function DocumentInfo({ filename, fileSize, pageCount, metadata }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="tool-section-title">Document Properties</div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: '#f8fafc',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Filename */}
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
            Filename
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', wordBreak: 'break-all' }}>
            {filename || 'Untitled'}
          </div>
        </div>

        {/* File Size & Page Count */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
              File Size
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
              {formatBytes(fileSize)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
              Pages
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
              {pageCount}
            </div>
          </div>
        </div>

        {/* Title */}
        {metadata?.title && (
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
              Title
            </div>
            <div style={{ fontSize: '0.82rem', color: '#334155' }}>
              {metadata.title}
            </div>
          </div>
        )}

        {/* Author */}
        {metadata?.author && metadata.author !== 'Unknown' && (
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
              Author
            </div>
            <div style={{ fontSize: '0.82rem', color: '#334155' }}>
              {metadata.author}
            </div>
          </div>
        )}
      </div>

      {/* Privacy Guarantee Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          padding: '12px',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #bbf7d0',
        }}
      >
        <Shield size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.74rem', color: '#166534', lineHeight: 1.4 }}>
          <strong>Zero Server Transfers</strong>: This document exists purely inside this browser tab's RAM. No network requests are made with your file content.
        </div>
      </div>
    </div>
  );
}
