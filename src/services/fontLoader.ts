import jsPDF from 'jspdf';
import { CAIRO_FONT_BASE64 } from './cairoFontData';

/**
 * Cairo Variable Font — base64-embedded, no network dependency.
 * Supports Arabic + Latin glyphs across all weights.
 * The variable font is registered as both 'normal' and 'bold' styles
 * so jsPDF can reference either weight via the same family name.
 */

let registered = false;

/**
 * Register the Cairo font with a jsPDF instance.
 * Uses a base64-embedded font — no CDN fetch, no network dependency.
 */
export function registerArabicFont(doc: jsPDF): void {
  try {
    doc.addFileToVFS('Cairo-Variable.ttf', CAIRO_FONT_BASE64);
    doc.addFont('Cairo-Variable.ttf', 'Cairo', 'normal');
    // Register same variable font for bold — jsPDF will use it for bold calls
    doc.addFont('Cairo-Variable.ttf', 'Cairo', 'bold');
    registered = true;
  } catch (err) {
    console.error('[fontLoader] Failed to register Cairo font:', err);
  }
}

/** Check if the font has been successfully registered at least once */
export function isFontRegistered(): boolean {
  return registered;
}
