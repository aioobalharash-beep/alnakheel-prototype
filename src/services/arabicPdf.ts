/**
 * Arabic PDF text processing utility.
 *
 * Pipeline: reshape (connect letters) → bidi reorder (visual LTR order)
 *
 * jsPDF renders text left-to-right. For Arabic we must:
 *  1. Reshape characters into connected presentation forms (ف+ا → فا)
 *  2. Reorder the string into visual LTR order so jsPDF renders it correctly
 *
 * After processing, text is rendered with normal LTR alignment in jsPDF
 * but positioned from the right margin for RTL layout.
 */

// @ts-ignore — no type declarations available
import { convertArabic } from 'arabic-reshaper';
// @ts-ignore — no type declarations available
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

/** Check if a string contains any Arabic characters */
export function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/**
 * Process text for Arabic PDF rendering.
 * - Reshapes Arabic characters into connected presentation forms
 * - Applies Unicode Bidirectional Algorithm for correct visual ordering
 * - Handles mixed Arabic/English text properly
 *
 * For non-Arabic text, returns the input unchanged.
 */
export function processPdfText(text: string, isRtl: boolean): string {
  if (!text) return text;

  // If the text has no Arabic characters and is not RTL, skip processing
  if (!hasArabic(text) && !isRtl) return text;

  // Step 1: Reshape Arabic characters (connect letter forms)
  const reshaped = convertArabic(text);

  // Step 2: Apply bidi algorithm for visual ordering
  // Base direction 'rtl' ensures Arabic text flows correctly
  const embeddingLevels = bidi.getEmbeddingLevels(reshaped, isRtl ? 'rtl' : 'ltr');
  const reordered = bidi.getReorderedString(reshaped, embeddingLevels);

  return reordered;
}

/**
 * Shorthand for Arabic PDF text processing (always RTL base direction).
 */
export function ar(text: string): string {
  return processPdfText(text, true);
}
