import jsPDF from 'jspdf';

interface VATReportData {
  month: string;
  taxId: string;
  totalRevenue: number;
  vatRate: number;
  vatCollected: number;
  bookingCount: number;
  bookings: { guest_name: string; check_in: string; nights: number; amount: number }[];
}

export function generateVATReportPDF(data: VATReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(1, 31, 54);
  doc.text('AL-NAKHEEL LUXURY PROPERTIES', 20, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Tax ID: ${data.taxId}  |  Muscat, Sultanate of Oman`, 20, y);
  y += 4;
  doc.text('CR: 1234567  |  Tourism License: TL-889', 20, y);

  // Title badge
  doc.setFillColor(1, 31, 54);
  doc.roundedRect(pageWidth - 70, 15, 55, 14, 2, 2, 'F');
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('VAT REPORT', pageWidth - 65, 24);

  y += 16;
  doc.setDrawColor(230);
  doc.line(20, y, pageWidth - 20, y);
  y += 14;

  // Report Title
  doc.setTextColor(1, 31, 54);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Monthly VAT Summary`, 20, y);
  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(data.month, 20, y);
  y += 16;

  // Summary Box
  doc.setFillColor(245, 245, 248);
  doc.roundedRect(20, y, pageWidth - 40, 40, 3, 3, 'F');

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL REVENUE', 30, y + 12);
  doc.text('VAT RATE', 90, y + 12);
  doc.text('VAT COLLECTED', 140, y + 12);

  doc.setFontSize(14);
  doc.setTextColor(1, 31, 54);
  doc.text(`OMR ${data.totalRevenue.toFixed(2)}`, 30, y + 26);
  doc.text(`${data.vatRate}%`, 90, y + 26);
  doc.setTextColor(212, 175, 55);
  doc.text(`OMR ${data.vatCollected.toFixed(2)}`, 140, y + 26);

  y += 54;

  // Bookings table header
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'bold');
  doc.text('GUEST', 20, y);
  doc.text('CHECK-IN', 90, y);
  doc.text('NIGHTS', 130, y);
  doc.text('AMOUNT (OMR)', pageWidth - 55, y);
  y += 4;
  doc.setDrawColor(230);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  // Bookings rows
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(1, 31, 54);

  for (const b of data.bookings) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'normal');
    doc.text(b.guest_name, 20, y);
    doc.text(new Date(b.check_in).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), 90, y);
    doc.text(String(b.nights), 135, y);
    doc.setFont('helvetica', 'bold');
    doc.text(b.amount.toFixed(2), pageWidth - 55, y);
    y += 8;
  }

  if (data.bookings.length === 0) {
    doc.setTextColor(150);
    doc.text('No confirmed bookings for this period.', 20, y);
    y += 8;
  }

  y += 6;
  doc.setDrawColor(230);
  doc.line(20, y, pageWidth - 20, y);
  y += 10;

  // Total row
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(1, 31, 54);
  doc.text(`Total: ${data.bookingCount} bookings`, 20, y);
  doc.setTextColor(212, 175, 55);
  doc.text(`VAT: OMR ${data.vatCollected.toFixed(2)}`, pageWidth - 55, y);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(7);
  doc.setTextColor(180);
  doc.setFont('helvetica', 'normal');
  doc.text('Al-Nakheel Luxury Properties  |  This is a computer-generated VAT summary report.', pageWidth / 2, footerY, { align: 'center' });

  doc.save(`Al-Nakheel-VAT-Report-${data.month.replace(/\s/g, '-')}.pdf`);
}
