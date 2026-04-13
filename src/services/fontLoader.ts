import jsPDF from 'jspdf';

/**
 * IBM Plex Sans Arabic — loaded once from Google Fonts CDN and cached.
 * Regular (400) and Bold (700) weights.
 */
const FONT_URLS = {
  regular: 'https://fonts.gstatic.com/s/ibmplexsansarabic/v12/Qw3CZRtWPQCuHme67tEYUIx3Kh0PHR9N6bs61A.ttf',
  bold: 'https://fonts.gstatic.com/s/ibmplexsansarabic/v12/Qw3VZRtWPQCuHme67tEYUIx3Kh0PHR9N6YNe3PC5.ttf',
};

let fontCache: { regular?: string; bold?: string } = {};

async function fetchFontAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * Register IBM Plex Sans Arabic (regular + bold) with a jsPDF instance.
 * Fetches the font from CDN on first call, then uses a cached copy.
 */
export async function registerArabicFont(doc: jsPDF): Promise<void> {
  if (!fontCache.regular) {
    const [regular, bold] = await Promise.all([
      fetchFontAsBase64(FONT_URLS.regular),
      fetchFontAsBase64(FONT_URLS.bold),
    ]);
    fontCache = { regular, bold };
  }

  doc.addFileToVFS('IBMPlexSansArabic-Regular.ttf', fontCache.regular!);
  doc.addFont('IBMPlexSansArabic-Regular.ttf', 'IBMPlexArabic', 'normal');

  doc.addFileToVFS('IBMPlexSansArabic-Bold.ttf', fontCache.bold!);
  doc.addFont('IBMPlexSansArabic-Bold.ttf', 'IBMPlexArabic', 'bold');
}
