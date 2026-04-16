import jsPDF from 'jspdf';
import { registerArabicFont } from './fontLoader';
import { ar, hasArabic, processPdfText } from './arabicPdf';

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

/** Font family — Cairo (supports Latin + Arabic glyphs) */
const FF = 'Cairo';

/** Page margin */
const MARGIN = 20;

/**
 * Process text for PDF rendering.
 * In Arabic mode, reshapes + bidi-reorders for correct visual display.
 * In English mode, passes through unchanged.
 */
function t(text: string, isAr: boolean): string {
  if (!isAr) return text;
  return ar(text);
}

/**
 * Process guest name — may contain Arabic even in English mode.
 */
function processName(name: string): string {
  if (hasArabic(name)) return processPdfText(name, true);
  return name;
}

// ---------------------------------------------------------------------------
// Invoice PDF
// ---------------------------------------------------------------------------

export function generateInvoicePDF(invoice: InvoiceData, lang = 'en'): jsPDF {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const isAr = lang === 'ar';

  // Register embedded Cairo font — synchronous, no network dependency
  registerArabicFont(doc);
  doc.setFont(FF, 'bold');

  // DO NOT use doc.setR2L(true) — it does naive char reversal that breaks
  // reshaped Arabic. We handle visual ordering via arabic-reshaper + bidi-js.

  let y = 20;

  // ---- RTL layout: right-aligned start, left-aligned end ----
  // In Arabic mode, "start" is right side, "end" is left side.
  const startX = isAr ? pw - MARGIN : MARGIN;
  const endX   = isAr ? MARGIN + 40 : pw - 60;
  const startAlign: 'left' | 'right' = isAr ? 'right' : 'left';
  const endAlign: 'left' | 'right'   = isAr ? 'left' : 'right';

  // ---- Header ----
  doc.setFontSize(22);
  doc.setFont(FF, 'bold');
  doc.setTextColor(1, 31, 54);
  doc.text(
    t(isAr ? 'النخيل للعقارات الفاخرة' : 'AL-NAKHEEL LUXURY PROPERTIES', isAr),
    startX, y, { align: startAlign }
  );
  y += 8;

  doc.setFontSize(9);
  doc.setFont(FF, 'normal');
  doc.setTextColor(100);
  doc.text(
    t(isAr ? 'مسقط، سلطنة عُمان' : 'Muscat, Sultanate of Oman', isAr),
    startX, y, { align: startAlign }
  );
  y += 4;
  doc.text(
    t(isAr ? 'سجل تجاري: 1234567  |  ترخيص سياحي: TL-889' : 'CR: 1234567  |  Tourism License: TL-889', isAr),
    startX, y, { align: startAlign }
  );

  y += 15;
  doc.setDrawColor(230);
  doc.line(MARGIN, y, pw - MARGIN, y);
  y += 12;

  // ---- Invoice title + ID ----
  doc.setTextColor(1, 31, 54);
  doc.setFontSize(16);
  doc.setFont(FF, 'bold');
  const invoiceTitle = t(isAr ? 'فاتورة' : 'INVOICE', isAr);
  doc.text(invoiceTitle, startX, y, { align: startAlign });

  const idLabel = `#${invoice.id.slice(0, 8).toUpperCase()}`;
  doc.setFontSize(10);
  doc.setTextColor(100);
  if (isAr) {
    // Place ID to the left of the title in RTL
    doc.setFont(FF, 'bold');
    doc.setFontSize(16);
    const titleWidth = doc.getTextWidth(invoiceTitle);
    doc.setFontSize(10);
    doc.setFont(FF, 'normal');
    doc.text(idLabel, startX - titleWidth - 8, y, { align: 'right' });
  } else {
    doc.text(idLabel, 55, y);
  }
  y += 14;

  // ---- Billed To / Issue Date ----
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont(FF, 'bold');
  doc.text(
    t(isAr ? 'فاتورة إلى' : 'BILLED TO', isAr),
    startX, y, { align: startAlign }
  );
  doc.text(
    t(isAr ? 'تاريخ الإصدار' : 'ISSUE DATE', isAr),
    endX, y, { align: endAlign }
  );
  y += 6;

  doc.setFontSize(11);
  doc.setTextColor(1, 31, 54);
  doc.setFont(FF, 'bold');
  doc.text(processName(invoice.guest_name), startX, y, { align: startAlign });
  const dateLocale = isAr ? 'ar-OM' : 'en-GB';
  const dateStr = new Date(invoice.issued_date).toLocaleDateString(dateLocale, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  doc.text(t(dateStr, isAr), endX, y, { align: endAlign });
  y += 5;

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont(FF, 'normal');
  doc.text(t(invoice.room_type, isAr), startX, y, { align: startAlign });
  y += 14;

  doc.setDrawColor(230);
  doc.line(MARGIN, y, pw - MARGIN, y);
  y += 8;

  // ---- Table header ----
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont(FF, 'bold');
  doc.text(
    t(isAr ? 'البيان' : 'DESCRIPTION', isAr),
    startX, y, { align: startAlign }
  );
  doc.text(
    t(isAr ? 'المبلغ (ر.ع.)' : 'AMOUNT (OMR)', isAr),
    endX, y, { align: endAlign }
  );
  y += 4;
  doc.setDrawColor(230);
  doc.line(MARGIN, y, pw - MARGIN, y);
  y += 10;

  // ---- Line items ----
  doc.setFontSize(10);
  doc.setTextColor(1, 31, 54);
  doc.setFont(FF, 'normal');

  if (invoice.items && invoice.items.length > 0) {
    for (const item of invoice.items) {
      const isDeposit = /deposit|تأمين/i.test(item.description);
      if (isDeposit) {
        doc.setFont(FF, 'normal');
        doc.setTextColor(100);
      }
      doc.text(t(item.description, isAr), startX, y, { align: startAlign });
      doc.setFont(FF, 'bold');
      doc.text(item.amount.toFixed(2), endX, y, { align: endAlign });
      doc.setFont(FF, 'normal');
      doc.setTextColor(1, 31, 54);
      y += 10;
    }
  } else {
    const desc = isAr
      ? `رسوم الإقامة — ${invoice.room_type}`
      : `Stay Charges - ${invoice.room_type}`;
    doc.text(t(desc, isAr), startX, y, { align: startAlign });
    doc.setFont(FF, 'bold');
    doc.text(invoice.subtotal.toFixed(2), endX, y, { align: endAlign });
    y += 10;
  }

  y += 4;
  doc.setDrawColor(230);
  doc.line(MARGIN, y, pw - MARGIN, y);
  y += 12;

  // ---- Grand Total ----
  doc.setFontSize(14);
  doc.setFont(FF, 'bold');
  doc.setTextColor(1, 31, 54);
  doc.text(
    t(isAr ? 'الإجمالي' : 'Grand Total', isAr),
    startX, y, { align: startAlign }
  );
  doc.setTextColor(212, 175, 55);
  // Currency: "25.00 ر.ع." in Arabic, "OMR 25.00" in English
  const totalStr = isAr
    ? t(`${invoice.total_amount.toFixed(2)} ر.ع.`, true)
    : `OMR ${invoice.total_amount.toFixed(2)}`;
  doc.text(totalStr, endX, y, { align: endAlign });

  // ---- Footer ----
  y = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(7);
  doc.setTextColor(180);
  doc.setFont(FF, 'normal');
  const footerText = isAr
    ? t('النخيل للعقارات الفاخرة  |  مسقط، سلطنة عُمان  |  هذه فاتورة صادرة آليًا.', true)
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
    alert(lang === 'ar'
      ? 'حدث خطأ أثناء إنشاء الفاتورة. يرجى المحاولة مرة أخرى.'
      : 'Failed to generate invoice. Please try again.');
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
    const maxWidth = pw - MARGIN * 2;
    const isAr = lang === 'ar';

    // Register embedded Cairo font — synchronous
    registerArabicFont(doc);
    doc.setFont(FF, 'bold');

    let y = 20;

    const startX = isAr ? pw - MARGIN : MARGIN;
    const startAlign: 'left' | 'right' = isAr ? 'right' : 'left';

    // ---- Header ----
    doc.setFontSize(22);
    doc.setFont(FF, 'bold');
    doc.setTextColor(1, 31, 54);
    doc.text(
      t(isAr ? 'النخيل للعقارات الفاخرة' : 'AL-NAKHEEL LUXURY PROPERTIES', isAr),
      startX, y, { align: startAlign }
    );
    y += 8;

    doc.setFontSize(9);
    doc.setFont(FF, 'normal');
    doc.setTextColor(100);
    doc.text(
      t(isAr ? 'مسقط، سلطنة عُمان' : 'Muscat, Sultanate of Oman', isAr),
      startX, y, { align: startAlign }
    );
    y += 14;

    doc.setDrawColor(230);
    doc.line(MARGIN, y, pw - MARGIN, y);
    y += 12;

    // ---- Title ----
    doc.setFontSize(16);
    doc.setFont(FF, 'bold');
    doc.setTextColor(1, 31, 54);
    doc.text(
      t(isAr ? 'شروط الإقامة' : 'Terms of Stay', isAr),
      startX, y, { align: startAlign }
    );
    y += 8;

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont(FF, 'normal');
    const dateLocale = isAr ? 'ar-OM' : 'en-GB';
    const genLabel = isAr ? 'تاريخ الإصدار: ' : 'Generated: ';
    const genDate = new Date().toLocaleDateString(dateLocale, {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    doc.text(t(genLabel + genDate, isAr), startX, y, { align: startAlign });
    y += 12;

    doc.setDrawColor(230);
    doc.line(MARGIN, y, pw - MARGIN, y);
    y += 10;

    // ---- Body ----
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.setFont(FF, 'normal');

    // Process the terms text through reshaper/bidi if Arabic
    const processedTerms = isAr ? ar(termsText) : termsText;
    const lines = doc.splitTextToSize(processedTerms, maxWidth);
    const lineHeight = 5.5;

    for (const line of lines) {
      if (y + lineHeight > ph - 25) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, startX, y, { align: startAlign });
      y += lineHeight;
    }

    // ---- Footer ----
    y = ph - 20;
    doc.setFontSize(7);
    doc.setTextColor(180);
    doc.setFont(FF, 'normal');
    const footerText = isAr
      ? t('النخيل للعقارات الفاخرة  |  مسقط، سلطنة عُمان  |  هذه الوثيقة لأغراض إعلامية فقط.', true)
      : 'Al-Nakheel Luxury Properties  |  Muscat, Sultanate of Oman  |  This document is for informational purposes.';
    doc.text(footerText, pw / 2, y, { align: 'center' });

    doc.save(isAr ? 'النخيل-شروط-الإقامة.pdf' : 'Al-Nakheel-Terms-of-Stay.pdf');
  } catch (err) {
    console.error('[PDF] Failed to download terms PDF:', err);
    alert(lang === 'ar'
      ? 'حدث خطأ أثناء إنشاء ملف الشروط. يرجى المحاولة مرة أخرى.'
      : 'Failed to generate terms PDF. Please try again.');
  }
}
