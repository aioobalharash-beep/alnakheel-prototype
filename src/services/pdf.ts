import jsPDF from 'jspdf';
import { registerArabicFont } from './fontLoader';

interface InvoiceData {
  id: string;
  guest_name: string;
  room_type: string;
  issued_date: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  items?: { description: string; amount: number }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Font family — always Cairo (supports Latin + Arabic glyphs) */
const FF = 'Cairo';

/** Text alignment shorthand — flips for RTL */
function align(side: 'left' | 'right', lang: string): 'left' | 'right' {
  if (lang !== 'ar') return side;
  return side === 'left' ? 'right' : 'left';
}

/** X position — mirrors for RTL */
function xPos(x: number, pageWidth: number, lang: string): number {
  return lang === 'ar' ? pageWidth - x : x;
}

// ---------------------------------------------------------------------------
// Invoice PDF
// ---------------------------------------------------------------------------

export function generateInvoicePDF(invoice: InvoiceData, lang = 'en'): jsPDF {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  const isAr = lang === 'ar';

  // Register embedded Cairo font (synchronous, no network dependency)
  registerArabicFont(doc);

  if (isAr) {
    doc.setR2L(true);
  }

  let y = 20;

  // ---- Header ----
  const headerX = xPos(margin, pw, lang);
  const headerAlign = align('left', lang);

  doc.setFontSize(22);
  doc.setFont(FF, 'bold');
  doc.setTextColor(1, 31, 54);
  doc.text(isAr ? 'النخيل للعقارات الفاخرة' : 'AL-NAKHEEL LUXURY PROPERTIES', headerX, y, { align: headerAlign });
  y += 8;

  doc.setFontSize(9);
  doc.setFont(FF, 'normal');
  doc.setTextColor(100);
  doc.text(isAr ? 'مسقط، سلطنة عُمان' : 'Muscat, Sultanate of Oman', headerX, y, { align: headerAlign });
  y += 4;
  doc.text(isAr ? 'سجل تجاري: 1234567  |  ترخيص سياحي: TL-889' : 'CR: 1234567  |  Tourism License: TL-889', headerX, y, { align: headerAlign });

  y += 15;
  doc.setDrawColor(230);
  doc.line(margin, y, pw - margin, y);
  y += 12;

  // ---- Invoice title ----
  doc.setTextColor(1, 31, 54);
  doc.setFontSize(16);
  doc.setFont(FF, 'bold');
  doc.text(isAr ? 'فاتورة' : 'INVOICE', xPos(margin, pw, lang), y, { align: headerAlign });

  // Invoice number — placed after title
  const idLabel = `#${invoice.id.slice(0, 8).toUpperCase()}`;
  if (isAr) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(idLabel, xPos(margin, pw, lang) - doc.getTextWidth(isAr ? 'فاتورة' : 'INVOICE') - 8, y, { align: 'right' });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(idLabel, 55, y);
  }
  y += 14;

  // ---- Billed To / Issue Date ----
  const leftX = xPos(margin, pw, lang);
  const rightX = xPos(pw - 60, pw, lang);
  const leftAlign = align('left', lang);
  const rightAlign = align('right', lang);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont(FF, 'bold');
  doc.text(isAr ? 'فاتورة إلى' : 'BILLED TO', leftX, y, { align: leftAlign });
  doc.text(isAr ? 'تاريخ الإصدار' : 'ISSUE DATE', rightX, y, { align: rightAlign });
  y += 6;

  doc.setFontSize(11);
  doc.setTextColor(1, 31, 54);
  doc.setFont(FF, 'bold');
  doc.text(invoice.guest_name, leftX, y, { align: leftAlign });
  const dateLocale = isAr ? 'ar-OM' : 'en-GB';
  doc.text(new Date(invoice.issued_date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }), rightX, y, { align: rightAlign });
  y += 5;

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont(FF, 'normal');
  doc.text(invoice.room_type, leftX, y, { align: leftAlign });
  y += 14;

  doc.setDrawColor(230);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  // ---- Table header ----
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont(FF, 'bold');
  doc.text(isAr ? 'البيان' : 'DESCRIPTION', leftX, y, { align: leftAlign });
  doc.text(isAr ? 'المبلغ (ر.ع.)' : 'AMOUNT (OMR)', rightX, y, { align: rightAlign });
  y += 4;
  doc.setDrawColor(230);
  doc.line(margin, y, pw - margin, y);
  y += 10;

  // ---- Items ----
  doc.setFontSize(10);
  doc.setTextColor(1, 31, 54);
  doc.setFont(FF, 'normal');

  if (invoice.items && invoice.items.length > 0) {
    for (const item of invoice.items) {
      const isDeposit = item.description.toLowerCase().includes('deposit');
      if (isDeposit) {
        doc.setFont(FF, 'normal');
        doc.setTextColor(100);
      }
      doc.text(item.description, leftX, y, { align: leftAlign });
      doc.setFont(FF, 'bold');
      doc.text(item.amount.toFixed(2), rightX, y, { align: rightAlign });
      doc.setFont(FF, 'normal');
      doc.setTextColor(1, 31, 54);
      y += 10;
    }
  } else {
    const desc = isAr ? `رسوم الإقامة — ${invoice.room_type}` : `Stay Charges - ${invoice.room_type}`;
    doc.text(desc, leftX, y, { align: leftAlign });
    doc.setFont(FF, 'bold');
    doc.text(invoice.subtotal.toFixed(2), rightX, y, { align: rightAlign });
    y += 10;
  }

  y += 4;
  doc.setDrawColor(230);
  doc.line(margin, y, pw - margin, y);
  y += 12;

  // ---- Grand Total ----
  doc.setFontSize(14);
  doc.setFont(FF, 'bold');
  doc.setTextColor(1, 31, 54);
  doc.text(isAr ? 'الإجمالي' : 'Grand Total', leftX, y, { align: leftAlign });
  doc.setTextColor(212, 175, 55);
  const totalStr = isAr ? `${invoice.total_amount.toFixed(2)} ر.ع.` : `OMR ${invoice.total_amount.toFixed(2)}`;
  doc.text(totalStr, rightX, y, { align: rightAlign });

  // ---- Footer ----
  y = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(7);
  doc.setTextColor(180);
  doc.setFont(FF, 'normal');
  const footerText = isAr
    ? 'النخيل للعقارات الفاخرة  |  مسقط، سلطنة عُمان  |  هذه فاتورة صادرة آليًا.'
    : 'Al-Nakheel Luxury Properties  |  Muscat, Sultanate of Oman  |  This is a computer-generated invoice.';
  doc.text(footerText, pw / 2, y, { align: 'center' });

  return doc;
}

export function downloadInvoicePDF(invoice: InvoiceData, lang = 'en') {
  try {
    const doc = generateInvoicePDF(invoice, lang);
    doc.save(`Al-Nakheel-Invoice-${invoice.id.slice(0, 8).toUpperCase()}.pdf`);
  } catch (err) {
    console.error('[PDF] Failed to download invoice PDF:', err);
    alert(lang === 'ar' ? 'حدث خطأ أثناء إنشاء الفاتورة. يرجى المحاولة مرة أخرى.' : 'Failed to generate invoice. Please try again.');
  }
}

// ---------------------------------------------------------------------------
// Terms of Stay PDF
// ---------------------------------------------------------------------------

export function downloadTermsPDF(termsText: string, lang = 'en') {
  try {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pw - margin * 2;
    const isAr = lang === 'ar';

    // Register embedded Cairo font (synchronous)
    registerArabicFont(doc);

    if (isAr) {
      doc.setR2L(true);
    }

    let y = 20;

    const headerX = xPos(margin, pw, lang);
    const headerAlign = align('left', lang);

    // ---- Header ----
    doc.setFontSize(22);
    doc.setFont(FF, 'bold');
    doc.setTextColor(1, 31, 54);
    doc.text(isAr ? 'النخيل للعقارات الفاخرة' : 'AL-NAKHEEL LUXURY PROPERTIES', headerX, y, { align: headerAlign });
    y += 8;

    doc.setFontSize(9);
    doc.setFont(FF, 'normal');
    doc.setTextColor(100);
    doc.text(isAr ? 'مسقط، سلطنة عُمان' : 'Muscat, Sultanate of Oman', headerX, y, { align: headerAlign });
    y += 14;

    doc.setDrawColor(230);
    doc.line(margin, y, pw - margin, y);
    y += 12;

    // ---- Title ----
    doc.setFontSize(16);
    doc.setFont(FF, 'bold');
    doc.setTextColor(1, 31, 54);
    doc.text(isAr ? 'شروط الإقامة' : 'Terms of Stay', headerX, y, { align: headerAlign });
    y += 8;

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont(FF, 'normal');
    const dateLocale = isAr ? 'ar-OM' : 'en-GB';
    const genLabel = isAr ? 'تاريخ الإصدار: ' : 'Generated: ';
    doc.text(genLabel + new Date().toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' }), headerX, y, { align: headerAlign });
    y += 12;

    doc.setDrawColor(230);
    doc.line(margin, y, pw - margin, y);
    y += 10;

    // ---- Body ----
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.setFont(FF, 'normal');

    const lines = doc.splitTextToSize(termsText, maxWidth);
    const lineHeight = 5.5;
    const textAlign = align('left', lang);
    const textX = xPos(margin, pw, lang);

    for (const line of lines) {
      if (y + lineHeight > ph - 25) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, textX, y, { align: textAlign });
      y += lineHeight;
    }

    // ---- Footer ----
    y = ph - 20;
    doc.setFontSize(7);
    doc.setTextColor(180);
    doc.setFont(FF, 'normal');
    const footerText = isAr
      ? 'النخيل للعقارات الفاخرة  |  مسقط، سلطنة عُمان  |  هذه الوثيقة لأغراض إعلامية فقط.'
      : 'Al-Nakheel Luxury Properties  |  Muscat, Sultanate of Oman  |  This document is for informational purposes.';
    doc.text(footerText, pw / 2, y, { align: 'center' });

    doc.save(isAr ? 'النخيل-شروط-الإقامة.pdf' : 'Al-Nakheel-Terms-of-Stay.pdf');
  } catch (err) {
    console.error('[PDF] Failed to download terms PDF:', err);
    alert(lang === 'ar' ? 'حدث خطأ أثناء إنشاء ملف الشروط. يرجى المحاولة مرة أخرى.' : 'Failed to generate terms PDF. Please try again.');
  }
}
