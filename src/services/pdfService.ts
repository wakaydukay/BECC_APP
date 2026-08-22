import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { LoanApplication, PaymentTransaction, Member } from '../types';
import { LOAN_PRODUCTS, calculateAmortization } from './loanService';

/**
 * Format currency safely for PDF rendering (standard fonts in jsPDF render 'PHP' cleanly)
 */
export function formatPdfCurrency(amount: number): string {
  return `PHP ${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Helper to draw standard Cooperative Header on PDF documents
 */
function drawCoopHeader(doc: jsPDF, title: string, subtitle?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top decorative bar
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 8, 'F');
  
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 8, pageWidth, 2, 'F');

  // Emblem / Logo box
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.roundedRect(14, 15, 16, 16, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 15, 16, 16, 2, 2, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('COOP', 16, 25);

  // Cooperative Name & Details
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('COMMUNITY MULTI-PURPOSE COOPERATIVE', 34, 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Registered with Cooperative Development Authority (CDA) • Reg No. CDA-2024-09881', 34, 25);
  doc.text('Member Services & Credit Facilities Division • Offline-First Operations Branch', 34, 29);

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 34, pageWidth - 14, 34);

  // Document Title Header Banner
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 37, pageWidth - 28, 14, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, 37, pageWidth - 28, 14, 'S');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), 18, 45);

  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 18, 49);
  }

  // Right-aligned generation timestamp
  const dateStr = `Generated: ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(dateStr, pageWidth - 18, 45, { align: 'right' });
  doc.text('Doc Ref: OFFLINE-LOCAL-VAULT', pageWidth - 18, 49, { align: 'right' });

  return 55; // Next Y-coordinate for content
}

/**
 * Helper to draw footer on each page
 */
function drawFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Official Cooperative Document • Client-Side Generated • Offline Cryptographic Record', 14, pageHeight - 9);
  doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 14, pageHeight - 9, { align: 'right' });
}

/**
 * 1. Export Loan Application Summary & Amortization Schedule as PDF
 */
export function exportLoanSummaryPDF(loan: LoanApplication, member?: Member) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const product = LOAN_PRODUCTS[loan.loanType] || LOAN_PRODUCTS.salary_loan;
  let startY = drawCoopHeader(
    doc,
    'Loan Application & Disclosure Statement',
    `${product.name.toUpperCase()} (15.0% P.A. DIMINISHING BALANCE)`
  );

  const pageWidth = doc.internal.pageSize.getWidth();

  // Section 1: Borrower & Loan Identification Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, startY, pageWidth - 28, 28, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startY, pageWidth - 28, 28, 2, 2, 'S');

  // Left Column: Borrower Information
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('BORROWER / MEMBER PROFILE', 18, startY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`Member Name:`, 18, startY + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(loan.memberName || member?.fullName || 'N/A', 45, startY + 12);

  doc.setFont('helvetica', 'normal');
  doc.text(`Member ID:`, 18, startY + 17);
  doc.setFont('helvetica', 'bold');
  doc.text(loan.memberId, 45, startY + 17);

  doc.setFont('helvetica', 'normal');
  doc.text(`Contact / Status:`, 18, startY + 22);
  doc.setFont('helvetica', 'bold');
  const contactText = member?.phone || 'On Record';
  doc.text(`${contactText} • Status: ${member?.status?.toUpperCase() || 'ACTIVE'}`, 45, startY + 22);

  // Right Column: Loan Identification
  const rightColX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('LOAN ACCOUNT PARTICULARS', rightColX, startY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`Loan Reference:`, rightColX, startY + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(loan.loanNumber, rightColX + 30, startY + 12);

  doc.setFont('helvetica', 'normal');
  doc.text(`Applied Date:`, rightColX, startY + 17);
  doc.setFont('helvetica', 'bold');
  doc.text(loan.appliedDate || new Date().toISOString().split('T')[0], rightColX + 30, startY + 17);

  doc.setFont('helvetica', 'normal');
  doc.text(`Current Status:`, rightColX, startY + 22);
  doc.setFont('helvetica', 'bold');
  const statusLabel = loan.status === 'fully_paid' ? 'FULLY PAID' : loan.status === 'past_due' ? 'PAST DUE' : loan.isRestructured ? 'RESTRUCTURED' : 'ACTIVE / IN GOOD STANDING';
  doc.text(statusLabel, rightColX + 30, startY + 22);

  startY += 33;

  // Section 2: Financial Terms & Deductions Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('FINANCIAL DISCLOSURE & DEDUCTIONS BREAKDOWN', 14, startY);

  startY += 3;

  // Summary Metrics Table
  const metricsData: RowInput[] = [
    [
      { content: 'Principal Granted', styles: { fontStyle: 'bold' } },
      formatPdfCurrency(loan.principalAmount),
      { content: 'Annual Interest Rate', styles: { fontStyle: 'bold' } },
      '15.00% p.a. (Diminishing)'
    ],
    [
      { content: 'Repayment Term', styles: { fontStyle: 'bold' } },
      `${loan.termMonths} Months (${(loan.termMonths / 12).toFixed(1)} Yrs)`,
      { content: 'Monthly Amortization (1st Mo)', styles: { fontStyle: 'bold' } },
      formatPdfCurrency(loan.schedule[0]?.totalMonthlyPayment || loan.monthlyAmortization)
    ],
    [
      { content: 'Remaining Balance', styles: { fontStyle: 'bold' } },
      formatPdfCurrency(loan.remainingBalance),
      { content: 'Total Principal & Interest Paid', styles: { fontStyle: 'bold' } },
      formatPdfCurrency(loan.totalPaid)
    ]
  ];

  autoTable(doc, {
    startY: startY,
    body: metricsData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 45, fillColor: [248, 250, 252] },
      1: { cellWidth: 45 },
      2: { cellWidth: 48, fillColor: [248, 250, 252] },
      3: { cellWidth: 44 }
    },
    margin: { left: 14, right: 14 }
  });

  // Deductions Table
  const lastTable = (doc as any).lastAutoTable;
  startY = lastTable.finalY + 4;

  const emeraldBg: [number, number, number] = [236, 253, 245];
  const emeraldText: [number, number, number] = [4, 120, 87];

  const deductionsData: RowInput[] = [
    ['Service Fee (3% of Principal)', formatPdfCurrency(loan.serviceFee), 'Cooperative administrative and credit processing fee'],
    ['Application & Filing Fee (Fixed)', formatPdfCurrency(loan.applicationFee), 'Standard offline filing documentation cost'],
    ['Loan Guarantee Fund (1% Retention)', formatPdfCurrency(loan.guaranteeFee), 'Mutual default risk buffer'],
    ['Capital Build-Up (5% Member Equity)', formatPdfCurrency(loan.capitalBuildUp), 'Credited directly to member shared equity'],
    [{ content: 'Total Initial Deductions', styles: { fontStyle: 'bold' } }, { content: formatPdfCurrency(loan.totalDeductions), styles: { fontStyle: 'bold' } }, ''],
    [{ content: 'NET DISBURSED CASH PROCEEDS', styles: { fontStyle: 'bold', fillColor: emeraldBg } }, { content: formatPdfCurrency(loan.netProceeds), styles: { fontStyle: 'bold', textColor: emeraldText, fillColor: emeraldBg } }, { content: 'Total actual cash received by borrower', styles: { fillColor: emeraldBg } }]
  ];

  if (loan.isRestructured || loan.loanType === 'restructuring_loan') {
    deductionsData.push([
      { content: 'Restructured Principal Settled', styles: { fontStyle: 'bold' } },
      formatPdfCurrency(loan.restructuredPrincipalPaid || 0),
      `Settled overdue loan ${loan.restructuredFromLoanNumber || ''}`
    ]);
  }

  autoTable(doc, {
    startY: startY,
    head: [['Itemized Deduction / Retention', 'Amount (PHP)', 'Policy Reference']],
    body: deductionsData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 2
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 35, halign: 'right' },
      2: { cellWidth: 82 }
    },
    margin: { left: 14, right: 14 }
  });

  // Section 3: Amortization Schedule Table
  const deductionsTable = (doc as any).lastAutoTable;
  startY = deductionsTable.finalY + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL AMORTIZATION SCHEDULE (DIMINISHING 15% P.A.)', 14, startY);

  startY += 3;

  const scheduleRows: RowInput[] = loan.schedule.map((item) => [
    item.period.toString(),
    item.dueDate,
    formatPdfCurrency(item.principalPayment),
    formatPdfCurrency(item.interestPayment),
    formatPdfCurrency(item.totalMonthlyPayment),
    formatPdfCurrency(item.endingBalance),
    item.isPaid ? `PAID (${item.paymentRef || 'Voucher'})` : 'PENDING'
  ]);

  autoTable(doc, {
    startY: startY,
    head: [['Mo.', 'Due Date', 'Principal', '15% Interest', 'Total Payment', 'Remaining Balance', 'Status']],
    body: scheduleRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 32, halign: 'right' },
      6: { cellWidth: 30, halign: 'center' }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const text = data.cell.raw as string;
        if (text.startsWith('PAID')) {
          doc.setTextColor(4, 120, 87);
        } else {
          doc.setTextColor(100, 116, 139);
        }
      }
    },
    margin: { left: 14, right: 14 }
  });

  // Section 4: Signatures & Certification
  const scheduleTable = (doc as any).lastAutoTable;
  let finalY = scheduleTable.finalY + 8;

  // Check if we need a new page for signatures
  if (finalY > doc.internal.pageSize.getHeight() - 45) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    'PROMISSORY AGREEMENT: The undersigned borrower acknowledges the loan terms, itemized deductions, and diminishing interest computations herein.',
    14,
    finalY,
    { maxWidth: pageWidth - 28 }
  );

  finalY += 12;

  // 3 Signature boxes
  const boxWidth = (pageWidth - 28 - 16) / 3;

  // Box 1: Borrower
  doc.setDrawColor(148, 163, 184);
  doc.line(14, finalY + 10, 14 + boxWidth, finalY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(loan.memberName.toUpperCase(), 14 + boxWidth / 2, finalY + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Borrower Signature over Printed Name', 14 + boxWidth / 2, finalY + 17, { align: 'center' });

  // Box 2: Credit Committee
  const box2X = 14 + boxWidth + 8;
  doc.line(box2X, finalY + 10, box2X + boxWidth, finalY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CREDIT & LOAN COMMITTEE', box2X + boxWidth / 2, finalY + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Loan Evaluator / Signatory', box2X + boxWidth / 2, finalY + 17, { align: 'center' });

  // Box 3: General Manager
  const box3X = box2X + boxWidth + 8;
  doc.line(box3X, finalY + 10, box3X + boxWidth, finalY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('COOPERATIVE GENERAL MANAGER', box3X + boxWidth / 2, finalY + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Disbursement Approval & Seal', box3X + boxWidth / 2, finalY + 17, { align: 'center' });

  // Add footers on all pages
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  // Trigger download
  const cleanLoanNum = loan.loanNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
  doc.save(`Coop_Loan_Summary_${cleanLoanNum}.pdf`);
}

/**
 * 2. Export Official Payment Receipt as PDF
 */
export function exportPaymentReceiptPDF(transaction: PaymentTransaction, loan?: LoanApplication, member?: Member) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // A5 is standard for payment vouchers and official receipts
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 6, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 6, pageWidth, 1.5, 'F');

  // Emblem / Logo
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(10, 11, 12, 12, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(10, 11, 12, 12, 1.5, 1.5, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('COOP', 11.5, 19);

  // Cooperative Details
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('COMMUNITY MULTI-PURPOSE COOPERATIVE', 26, 15);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Official Collection Voucher • CDA Registration No. CDA-2024-09881', 26, 19);
  doc.text('Branch Collections & Member Repayments Division', 26, 22);

  // Receipt Banner Box
  doc.setFillColor(248, 250, 252);
  doc.rect(10, 26, pageWidth - 20, 12, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, 26, pageWidth - 20, 12, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL LOAN REPAYMENT RECEIPT', 14, 33);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('VALID FOR OFFICIAL COOPERATIVE CREDIT CLEARANCE', 14, 36.5);

  // Receipt Number & Date (Right-aligned)
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(transaction.receiptNumber, pageWidth - 14, 32.5, { align: 'right' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${transaction.paymentDate}`, pageWidth - 14, 36.5, { align: 'right' });

  // Member & Account Info Card
  let startY = 41;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, startY, pageWidth - 20, 22, 1.5, 1.5, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('RECEIVED FROM:', 14, startY + 5);
  doc.text('LOAN REFERENCE:', 14, startY + 11);
  doc.text('PAYMENT CHANNEL:', 14, startY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(transaction.memberName || member?.fullName || 'N/A', 42, startY + 5);
  doc.text(transaction.loanNumber || 'N/A', 42, startY + 11);
  doc.text(transaction.channel.replace(/_/g, ' ').toUpperCase(), 42, startY + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('MEMBER ID:', pageWidth / 2 + 10, startY + 5);
  doc.text('SYNC STATUS:', pageWidth / 2 + 10, startY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(transaction.memberId, pageWidth / 2 + 32, startY + 5);
  doc.text('OFFLINE VAULT SECURED', pageWidth / 2 + 32, startY + 11);

  // Repayment Split Breakdown Table
  startY += 25;

  const slateLightBg: [number, number, number] = [241, 245, 249];
  const emeraldHighlight: [number, number, number] = [4, 120, 87];

  const paymentItems: RowInput[] = [
    ['Principal Balance Reduction', formatPdfCurrency(transaction.principalPaid), 'Direct reduction of principal outstanding'],
    ['15% Accrued Diminishing Interest', formatPdfCurrency(transaction.interestPaid), 'Monthly interest portion at 1.25% diminishing/mo'],
    ['Penalty / Late Surcharge', formatPdfCurrency(transaction.penaltyPaid || 0), transaction.penaltyPaid > 0 ? 'Assessed late payment fee' : 'None (Paid on-schedule)'],
    [{ content: 'TOTAL AMOUNT COLLECTED', styles: { fontStyle: 'bold', fillColor: slateLightBg } }, { content: formatPdfCurrency(transaction.amount), styles: { fontStyle: 'bold', textColor: emeraldHighlight, fillColor: slateLightBg } }, { content: 'Verified official tender', styles: { fillColor: slateLightBg } }]
  ];

  autoTable(doc, {
    startY: startY,
    head: [['Repayment Allocation Item', 'Amount (PHP)', 'Description / Accounting Note']],
    body: paymentItems,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 2
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 32, halign: 'right' },
      2: { cellWidth: 46 }
    },
    margin: { left: 10, right: 10 }
  });

  // Balance Status Post-Payment
  const paymentTable = (doc as any).lastAutoTable;
  startY = paymentTable.finalY + 4;

  if (loan) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(10, startY, pageWidth - 20, 16, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, startY, pageWidth - 20, 16, 1.5, 1.5, 'S');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('UPDATED REMAINING BALANCE:', 14, startY + 6);
    doc.text('TOTAL CUMULATIVE PAYMENTS:', 14, startY + 11.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(formatPdfCurrency(loan.remainingBalance), 60, startY + 6);
    doc.setTextColor(4, 120, 87);
    doc.text(formatPdfCurrency(loan.totalPaid), 60, startY + 11.5);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('LOAN STATUS:', pageWidth / 2 + 10, startY + 6);

    doc.setFont('helvetica', 'bold');
    const statusText = loan.remainingBalance <= 0 ? 'FULLY SETTLED' : loan.status === 'past_due' ? 'PAST DUE' : 'CURRENT / IN GOOD STANDING';
    doc.text(statusText, pageWidth / 2 + 32, startY + 6);

    startY += 20;
  } else {
    startY += 6;
  }

  // Notes if any
  if (transaction.notes) {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Note: ${transaction.notes}`, 10, startY);
    startY += 5;
  }

  // Signatures
  startY = Math.max(startY, pageHeight - 38);

  const sigWidth = (pageWidth - 20 - 12) / 2;

  // Payor Signature
  doc.setDrawColor(148, 163, 184);
  doc.line(10, startY + 10, 10 + sigWidth, startY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(transaction.memberName.toUpperCase(), 10 + sigWidth / 2, startY + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Member / Payor Signature', 10 + sigWidth / 2, startY + 17, { align: 'center' });

  // Teller Signature
  const tellerX = 10 + sigWidth + 12;
  doc.line(tellerX, startY + 10, tellerX + sigWidth, startY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('AUTHORIZED CASHIER / TELLER', tellerX + sigWidth / 2, startY + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Official Collection Officer Stamp', tellerX + sigWidth / 2, startY + 17, { align: 'center' });

  // Receipt Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(10, pageHeight - 8, pageWidth - 10, pageHeight - 8);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Official Cooperative Payment Receipt • Generated Client-Side • Valid for Proof of Payment', 10, pageHeight - 4.5);
  doc.text(`Ref: ${transaction.id}`, pageWidth - 10, pageHeight - 4.5, { align: 'right' });

  // Save PDF
  const cleanReceipt = transaction.receiptNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
  doc.save(`Coop_Receipt_${cleanReceipt}.pdf`);
}
