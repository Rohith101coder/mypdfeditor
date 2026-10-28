/**
 * File validation and safety checks for PDF uploads
 */

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Validates whether a file is a valid PDF
 * @param {File} file 
 * @returns {Promise<{ valid: boolean, error?: string }>}
 */
export async function validatePdfFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  // Check file extension / MIME type
  const isPdfMime = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdfMime) {
    return {
      valid: false,
      error: `Invalid file format "${file.name}". Please upload a standard PDF file (.pdf).`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum supported size is 50 MB for browser memory safety.`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'The uploaded file is empty (0 bytes).',
    };
  }

  // Verify PDF magic header bytes: %PDF-
  try {
    const headerSlice = file.slice(0, 8);
    const headerBuffer = await headerSlice.arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);
    const headerStr = String.fromCharCode(...headerBytes);

    if (!headerStr.startsWith('%PDF-')) {
      return {
        valid: false,
        error: 'File does not appear to be a valid PDF document (missing %PDF- header).',
      };
    }
  } catch (err) {
    return {
      valid: false,
      error: 'Could not read file header: ' + (err.message || 'unknown error'),
    };
  }

  return { valid: true };
}

/**
 * Formats byte size to human readable string
 */
export function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
