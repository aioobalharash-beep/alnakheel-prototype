import jsPDF from 'jspdf';

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

export function generateInvoicePDF(invoice: InvoiceData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('AL-NAKHEEL LUXURY PROPERTIES', 20, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Muscat, Sultanate of Oman', 20, y);
  y += 4;
  doc.text('CR: 1234567  |  Tourism License: TL-889', 20, y);

  y += 15;
  doc.setDrawColor(230);
  doc.line(20, y, pageWidth - 20, y);
  y += 12;

  // Invoice details
  doc.setTextColor(1, 31, 54);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`INVOICE`, 20, y);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`#${invoice.id.slice(0, 8).toUpperCase()}`, 55, y);
  y += 14;

  // Billed To / Date
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO', 20, y);
  doc.text('ISSUE DATE', pageWidth - 60, y);
  y += 6;
  doc.setFontSize(11);
  doc.setTextColor(1, 31, 54);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.guest_name, 20, y);
  doc.text(new Date(invoice.issued_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), pageWidth - 60, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.room_type, 20, y);
  y += 14;

  doc.setDrawColor(230);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  // Table header
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', 20, y);
  doc.text('AMOUNT (OMR)', pageWidth - 55, y);
  y += 4;
  doc.setDrawColor(230);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Items
  doc.setFontSize(10);
  doc.setTextColor(1, 31, 54);
  doc.setFont('helvetica', 'normal');
  if (invoice.items && invoice.items.length > 0) {
    for (const item of invoice.items) {
      const isDeposit = item.description.toLowerCase().includes('deposit');
      if (isDeposit) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
      }
      doc.text(item.description, 20, y);
      doc.setFont('helvetica', 'bold');
      doc.text(item.amount.toFixed(2), pageWidth - 55, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(1, 31, 54);
      y += 10;
    }
  } else {
    doc.text(`Stay Charges - ${invoice.room_type}`, 20, y);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.subtotal.toFixed(2), pageWidth - 55, y);
    y += 10;
  }

  y += 4;
  doc.setDrawColor(230);
  doc.line(20, y, pageWidth - 20, y);
  y += 12;

  // Grand Total (no VAT on guest invoices)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(1, 31, 54);
  doc.text('Grand Total', 20, y);
  doc.setTextColor(212, 175, 55);
  doc.text(`OMR ${invoice.total_amount.toFixed(2)}`, pageWidth - 55, y);

  // Footer
  y = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(7);
  doc.setTextColor(180);
  doc.setFont('helvetica', 'normal');
  doc.text('Al-Nakheel Luxury Properties  |  Muscat, Sultanate of Oman  |  This is a computer-generated invoice.', pageWidth / 2, y, { align: 'center' });

  return doc;
}

export function downloadInvoicePDF(invoice: InvoiceData) {
  const doc = generateInvoicePDF(invoice);
  doc.save(`Al-Nakheel-Invoice-${invoice.id.slice(0, 8).toUpperCase()}.pdf`);
}
