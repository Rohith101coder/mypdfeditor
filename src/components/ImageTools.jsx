import React, { useRef } from 'react';
import { Image as ImageIcon, Stamp, Upload } from 'lucide-react';

export default function ImageTools({ onAddImage, onAddStamp }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please choose a valid PNG or JPEG image file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        onAddImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Upload Image Section */}
      <div>
        <div className="tool-section-title">Insert Image</div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/jpg"
          style={{ display: 'none' }}
        />

        <button
          type="button"
          className="sidebar-primary-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={16} />
          <span>Upload Image from Device</span>
        </button>

        <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px' }}>
          Supports PNG and JPEG. You can move, resize, rotate, and adjust opacity.
        </p>
      </div>

      {/* Preset Stamps Section */}
      <div>
        <div className="tool-section-title">Document Stamps</div>
        <div className="stamp-grid">
          <button
            type="button"
            className="stamp-btn approved"
            onClick={() => onAddStamp('APPROVED', '#16a34a')}
          >
            APPROVED
          </button>

          <button
            type="button"
            className="stamp-btn confidential"
            onClick={() => onAddStamp('CONFIDENTIAL', '#dc2626')}
          >
            CONFIDENTIAL
          </button>

          <button
            type="button"
            className="stamp-btn draft"
            onClick={() => onAddStamp('DRAFT', '#ca8a04')}
          >
            DRAFT
          </button>

          <button
            type="button"
            className="stamp-btn paid"
            onClick={() => onAddStamp('PAID', '#2563eb')}
          >
            PAID
          </button>
        </div>
      </div>
    </div>
  );
}
