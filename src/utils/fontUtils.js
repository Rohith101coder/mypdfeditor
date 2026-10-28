import { StandardFonts, rgb } from 'pdf-lib';

/**
 * Standard PDF font mapping based on family and styling
 */
export function getPdfStandardFontName(fontFamily = 'Helvetica', isBold = false, isItalic = false) {
  const family = (fontFamily || '').toLowerCase();

  if (family.includes('times') || family.includes('serif') || family.includes('georgia')) {
    if (isBold && isItalic) return StandardFonts.TimesRomanBoldItalic;
    if (isBold) return StandardFonts.TimesRomanBold;
    if (isItalic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }

  if (family.includes('courier') || family.includes('mono') || family.includes('code')) {
    if (isBold && isItalic) return StandardFonts.CourierBoldOblique;
    if (isBold) return StandardFonts.CourierBold;
    if (isItalic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }

  // Default to Helvetica (Sans-serif)
  if (isBold && isItalic) return StandardFonts.HelveticaBoldOblique;
  if (isBold) return StandardFonts.HelveticaBold;
  if (isItalic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}

/**
 * Converts CSS hex or rgb/rgba color string to pdf-lib rgb() object { r, g, b } (0 to 1)
 */
export function hexOrRgbToPdfColor(colorStr) {
  if (!colorStr) return rgb(0, 0, 0);

  const clean = colorStr.trim().toLowerCase();

  if (clean.startsWith('#')) {
    let hex = clean.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    return rgb(r, g, b);
  }

  if (clean.startsWith('rgb')) {
    const parts = clean.match(/[\d.]+/g);
    if (parts && parts.length >= 3) {
      const r = Math.min(255, Math.max(0, parseFloat(parts[0]))) / 255;
      const g = Math.min(255, Math.max(0, parseFloat(parts[1]))) / 255;
      const b = Math.min(255, Math.max(0, parseFloat(parts[2]))) / 255;
      return rgb(r, g, b);
    }
  }

  // Pre-defined color names
  const namedColors = {
    black: rgb(0, 0, 0),
    white: rgb(1, 1, 1),
    red: rgb(0.9, 0.2, 0.2),
    blue: rgb(0.2, 0.4, 0.9),
    green: rgb(0.1, 0.7, 0.3),
    yellow: rgb(0.95, 0.85, 0.1),
    gray: rgb(0.5, 0.5, 0.5),
    grey: rgb(0.5, 0.5, 0.5),
  };

  if (namedColors[clean]) {
    return namedColors[clean];
  }

  return rgb(0, 0, 0);
}

/**
 * Standard font family options for the editor UI
 */
export const AVAILABLE_FONTS = [
  { label: 'Helvetica / Sans-Serif', value: 'Helvetica', sample: 'Aa Bb Cc' },
  { label: 'Times New Roman / Serif', value: 'Times-Roman', sample: 'Aa Bb Cc' },
  { label: 'Courier / Monospace', value: 'Courier', sample: 'Aa Bb Cc' },
  { label: 'Inter', value: 'Inter, sans-serif', sample: 'Aa Bb Cc' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono, monospace', sample: 'Aa Bb Cc' },
];

export const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72
];
