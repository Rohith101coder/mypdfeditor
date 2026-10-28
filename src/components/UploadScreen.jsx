import React, { useState, useRef } from 'react';
import {
  FileUp,
  FileText,
  ShieldCheck,
  Zap,
  Sparkles,
  Link,
  Layers,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function UploadScreen({ onFileUpload, onLoadSample, isLoading, loadingMessage, error }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileUpload(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileUpload(file);
    }
  };

  return (
    <div className="upload-screen-container">
      <div className="upload-card">
        {/* Brand Header */}
        <div className="upload-logo-wrap">
          <div className="upload-logo-icon">
            <FileText size={28} />
          </div>
          <span className="brand-badge">Client-Side Only</span>
        </div>

        <h1 className="upload-title">PaperEdit</h1>
        <p className="upload-subtitle">
          Professional, fully featured PDF editor that runs 100% in your browser.
          Modify text, links, shapes, annotations, and pages with complete privacy.
        </p>

        {/* Error message */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          className={`drop-zone ${isDragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
          />

          <div className="drop-icon-circle">
            {isLoading ? (
              <Loader2 size={28} className="animate-spin" />
            ) : (
              <FileUp size={28} />
            )}
          </div>

          <div>
            <div className="drop-primary-text">
              {isLoading
                ? loadingMessage || 'Processing PDF...'
                : 'Choose a PDF file or drag & drop it here'}
            </div>
            <div className="drop-secondary-text">
              PDF files up to 50MB • All processing remains in browser memory
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="upload-divider">
          <span>OR</span>
        </div>

        {/* Load Sample PDF */}
        <button
          type="button"
          className="sample-btn"
          onClick={onLoadSample}
          disabled={isLoading}
        >
          <Sparkles size={16} color="#2563eb" />
          <span>Load Multi-Page Sample Document</span>
        </button>

        {/* Feature Badges */}
        <div className="features-pill-row">
          <div className="feature-pill">
            <ShieldCheck size={14} color="#10b981" />
            <span>100% Private (No Cloud/Server)</span>
          </div>
          <div className="feature-pill">
            <Zap size={14} color="#3b82f6" />
            <span>Visual Text Replacement</span>
          </div>
          <div className="feature-pill">
            <Link size={14} color="#8b5cf6" />
            <span>Clickable PDF Link Editing</span>
          </div>
          <div className="feature-pill">
            <Layers size={14} color="#f59e0b" />
            <span>Page Management & Rotation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
