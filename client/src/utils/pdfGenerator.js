import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Format currency
const formatCur = (amount, symbol = 'Rs. ') => {
  const num = Number(amount) || 0;
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format Date & Time cleanly
export const formatDateTimeStr = (dateValue) => {
  if (!dateValue) return 'N/A';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);

  const dateStr = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return `${dateStr}, ${timeStr}`;
};

/**
 * Generates an official Tax Invoice / Receipt PDF
 */
export const generateInvoicePDF = (order, storeInfo) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currencySymbol = storeInfo?.currencySymbol || 'Rs. ';

  // --- BRAND HEADER ---
  doc.setFillColor(16, 185, 129); // Emerald-500
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Store Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(storeInfo?.storeName || 'RETAIL POS STORE', 14, 20);

  // Store Details (left)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600

  let addressLine = '';
  if (storeInfo?.address?.street) addressLine += storeInfo.address.street;
  if (storeInfo?.address?.city) addressLine += (addressLine ? ', ' : '') + storeInfo.address.city;
  if (storeInfo?.address?.state) addressLine += ', ' + storeInfo.address.state;

  doc.text(addressLine || 'Main Market Yard', 14, 25);
  doc.text(`Phone: ${storeInfo?.phone || 'N/A'} ${storeInfo?.email ? ' | Email: ' + storeInfo.email : ''}`, 14, 30);
  if (storeInfo?.taxId) {
    doc.text(`GSTIN / Tax ID: ${storeInfo.taxId}`, 14, 35);
  }

  // Right-aligned "TAX INVOICE" Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text('TAX INVOICE', pageWidth - 14, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice No: ${order.invoiceNumber || 'INV-0001'}`, pageWidth - 14, 26, { align: 'right' });
  doc.text(`Date & Time: ${formatDateTimeStr(order.createdAt)}`, pageWidth - 14, 31, { align: 'right' });
  doc.text(`Payment Mode: ${order.paymentMethod || 'CASH'}`, pageWidth - 14, 36, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, 41, pageWidth - 14, 41);

  // --- CUSTOMER DETAILS SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('BILLED TO:', 14, 47);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(order.customerName || 'Walk-in Customer', 14, 52);
  if (order.customerPhone) {
    doc.text(`Contact: ${order.customerPhone}`, 14, 57);
  }

  const startTableY = order.customerPhone ? 63 : 58;

  // --- ITEM TABLE ---
  const tableRows = (order.items || []).map((item, idx) => [
    idx + 1,
    item.name || 'Item',
    `${item.quantity || 1} ${item.unit || 'pcs'}`,
    formatCur(item.unitPrice, currencySymbol),
    formatCur(item.totalPrice, currencySymbol)
  ]);

  autoTable(doc, {
    startY: startTableY,
    head: [['#', 'Item Description', 'Qty', 'Unit Rate', 'Amount']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    }
  });

  const finalY = doc.lastAutoTable.finalY + 6;

  // --- TOTALS CALCULATION BOX ---
  const totalsX = pageWidth - 80;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal:', totalsX, finalY);
  doc.text(formatCur(order.subtotal, currencySymbol), pageWidth - 14, finalY, { align: 'right' });

  let offset = finalY + 5;
  if (order.totalDiscount > 0) {
    doc.setTextColor(16, 185, 129);
    doc.text('Discount:', totalsX, offset);
    doc.text(`-${formatCur(order.totalDiscount, currencySymbol)}`, pageWidth - 14, offset, { align: 'right' });
    offset += 5;
  }

  if (order.taxAmount > 0) {
    doc.setTextColor(71, 85, 105);
    doc.text('Tax / GST:', totalsX, offset);
    doc.text(formatCur(order.taxAmount, currencySymbol), pageWidth - 14, offset, { align: 'right' });
    offset += 5;
  }

  // Grand Total Box
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.roundedRect(totalsX - 3, offset - 1, pageWidth - totalsX - 11, 10, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text('GRAND TOTAL:', totalsX, offset + 6);
  doc.text(formatCur(order.grandTotal, currencySymbol), pageWidth - 14, offset + 6, { align: 'right' });

  // Khata Notice if applicable
  if (order.paymentMethod === 'CREDIT_KHATA') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text('* Billed to Customer Credit (Khata Ledger)', 14, offset + 6);
  }

  // --- FOOTER ---
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(storeInfo?.receiptSettings?.footerMessage || 'Thank you for your business! Visit again.', pageWidth / 2, pageHeight - 14, { align: 'center' });
  doc.text('Computer Generated Invoice | Powered by RetailPOS SaaS', pageWidth / 2, pageHeight - 9, { align: 'center' });

  return doc;
};

/**
 * Generates an official Customer Khata Ledger Statement PDF
 */
export const generateKhataStatementPDF = (customer, storeInfo) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currencySymbol = storeInfo?.currencySymbol || 'Rs. ';

  // --- BRAND HEADER ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Store Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(storeInfo?.storeName || 'RETAIL POS STORE', 14, 18);

  // Store Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  let addressLine = '';
  if (storeInfo?.address?.street) addressLine += storeInfo.address.street;
  if (storeInfo?.address?.city) addressLine += (addressLine ? ', ' : '') + storeInfo.address.city;
  doc.text(addressLine || 'Main Market Yard', 14, 23);
  doc.text(`Phone: ${storeInfo?.phone || 'N/A'} ${storeInfo?.taxId ? ' | GSTIN: ' + storeInfo.taxId : ''}`, 14, 28);

  // Title on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('KHATA LEDGER STATEMENT', pageWidth - 14, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Generated: ${formatDateTimeStr(new Date())}`, pageWidth - 14, 24, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 33, pageWidth - 14, 33);

  // --- CUSTOMER PROFILE BOX ---
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, 37, pageWidth - 28, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Customer: ${customer.name}`, 18, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Phone: ${customer.phone}`, 18, 50);
  if (customer.address) {
    doc.text(`Address: ${customer.address}`, 18, 55);
  }

  // Credit Limit on right
  doc.setFont('helvetica', 'normal');
  doc.text('Approved Credit Limit:', pageWidth - 18, 44, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(formatCur(customer.creditLimit || 5000, currencySymbol), pageWidth - 18, 50, { align: 'right' });

  // --- SUMMARY KPI CARDS ---
  const totalCredit = (customer.transactions || [])
    .filter(t => t.type === 'PURCHASE_CREDIT')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalPaid = (customer.transactions || [])
    .filter(t => t.type === 'PAYMENT_RECEIVED')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const cardWidth = (pageWidth - 28 - 6) / 3;
  const startCardsY = 63;

  // Card 1: Total Credit
  doc.setFillColor(255, 241, 242); // rose-50
  doc.roundedRect(14, startCardsY, cardWidth, 16, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(159, 18, 57); // rose-800
  doc.text('TOTAL CREDIT BILLED', 18, startCardsY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(formatCur(totalCredit, currencySymbol), 18, startCardsY + 12);

  // Card 2: Total Paid
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.roundedRect(14 + cardWidth + 3, startCardsY, cardWidth, 16, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text('TOTAL PAID (EMIs)', 18 + cardWidth + 3, startCardsY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(formatCur(totalPaid, currencySymbol), 18 + cardWidth + 3, startCardsY + 12);

  // Card 3: Outstanding Due
  const isSettled = customer.creditBalance <= 0;
  if (isSettled) {
    doc.setFillColor(240, 253, 244);
  } else {
    doc.setFillColor(255, 241, 242);
  }
  doc.roundedRect(14 + (cardWidth + 3) * 2, startCardsY, cardWidth, 16, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  if (isSettled) {
    doc.setTextColor(6, 95, 70);
  } else {
    doc.setTextColor(159, 18, 57);
  }
  doc.text('CURRENT OUTSTANDING', 18 + (cardWidth + 3) * 2, startCardsY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(formatCur(customer.creditBalance, currencySymbol), 18 + (cardWidth + 3) * 2, startCardsY + 12);

  // --- TRANSACTIONS TABLE WITH EXACT DATE, TIME & RUNNING BALANCE ---
  // Sort chronologically ascending to calculate running balance
  const sorted = [...(customer.transactions || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let running = 0;
  const tableRows = sorted.map((t, idx) => {
    const isCredit = t.type === 'PURCHASE_CREDIT';
    const amt = Number(t.amount) || 0;
    if (isCredit) {
      running += amt;
    } else {
      running = Math.max(0, running - amt);
    }

    const dt = formatDateTimeStr(t.date);
    const debitStr = isCredit ? formatCur(amt, currencySymbol) : '-';
    const creditStr = !isCredit ? formatCur(amt, currencySymbol) : '-';
    const balStr = formatCur(running, currencySymbol);
    const mode = t.paymentMode || (isCredit ? 'Credit' : 'Cash');

    return [
      idx + 1,
      dt,
      t.notes || (isCredit ? 'Credit Purchase' : 'Payment Received'),
      mode,
      debitStr,
      creditStr,
      balStr
    ];
  });

  autoTable(doc, {
    startY: startCardsY + 20,
    head: [['#', 'Date & Time', 'Transaction / Remarks', 'Mode', 'Debit (+)', 'Credit (-)', 'Balance']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 34 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 20 },
      4: { cellWidth: 24, halign: 'right', textColor: [225, 29, 72] }, // Rose for Debit
      5: { cellWidth: 24, halign: 'right', textColor: [16, 185, 129] }, // Emerald for Credit
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  // --- FOOTER & SIGNATURE ---
  const pageHeight = doc.internal.pageSize.getHeight();
  const signY = pageHeight - 30;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Terms: Please verify your statement. For inquiries, contact store manager.', 14, signY);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(pageWidth - 65, signY + 12, pageWidth - 14, signY + 12);
  doc.text('Authorized Signatory', pageWidth - 40, signY + 16, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Official Customer Ledger Statement | Powered by RetailPOS SaaS', pageWidth / 2, pageHeight - 6, { align: 'center' });

  return doc;
};

/**
 * Downloads invoice PDF directly to customer device
 */
export const downloadInvoicePDF = (order, storeInfo) => {
  const doc = generateInvoicePDF(order, storeInfo);
  const fileName = `Invoice_${order.invoiceNumber || 'POS'}.pdf`;
  doc.save(fileName);
  return fileName;
};

/**
 * Downloads Khata ledger statement PDF
 */
export const downloadKhataStatementPDF = (customer, storeInfo) => {
  const doc = generateKhataStatementPDF(customer, storeInfo);
  const sanitizedName = (customer.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Khata_Statement_${sanitizedName}.pdf`;
  doc.save(fileName);
  return fileName;
};

/**
 * Shares official PDF via Web Share API (if supported) and opens WhatsApp with a professional message
 */
export const shareInvoiceViaWhatsApp = async (order, storeInfo) => {
  const currencySymbol = storeInfo?.currencySymbol || 'Rs. ';
  const doc = generateInvoicePDF(order, storeInfo);
  const fileName = `Invoice_${order.invoiceNumber || 'POS'}.pdf`;

  // Check if native Web Share with file attachment is supported (Mobile Chrome, Safari, etc.)
  let sharedViaNative = false;
  try {
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: `Tax Invoice ${order.invoiceNumber}`,
        text: `Tax Invoice from ${storeInfo?.storeName || 'our shop'}`
      });
      sharedViaNative = true;
    }
  } catch (err) {
    // Fall back to auto-download + WhatsApp link
  }

  // If not shared natively, auto-download the PDF so user has the file
  if (!sharedViaNative) {
    doc.save(fileName);
  }

  // Create clean, beautiful WhatsApp message
  const lines = [
    `🧾 *TAX INVOICE / CASH BILL*`,
    `🏪 *${storeInfo?.storeName || 'RETAIL POS'}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 *Invoice No:* ${order.invoiceNumber}`,
    `📅 *Date & Time:* ${formatDateTimeStr(order.createdAt)}`,
    order.customerName && order.customerName !== 'Walk-in Customer' ? `👤 *Customer:* ${order.customerName}` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🛍️ *Items Purchased (${(order.items || []).length}):*`,
    ...(order.items || []).slice(0, 5).map((it, idx) => `  ${idx + 1}. ${it.name} (${it.quantity} ${it.unit || 'pcs'}) = ${currencySymbol}${it.totalPrice}`),
    (order.items || []).length > 5 ? `  ...and ${(order.items.length - 5)} more items` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    order.totalDiscount > 0 ? `🏷️ *Discount:* -${currencySymbol}${order.totalDiscount}` : null,
    `💰 *Grand Total:* *${currencySymbol}${order.grandTotal}*`,
    `💳 *Payment Mode:* ${order.paymentMethod}`,
    order.paymentMethod === 'CREDIT_KHATA' ? `⚠️ *Recorded in Customer Khata (Credit)*` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📎 *Official PDF Bill:* _Downloaded (${fileName})_`,
    `🙏 ${storeInfo?.receiptSettings?.footerMessage || 'Thank you for shopping with us! Visit again.'}`
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join('\n'));
  const phone = order.customerPhone ? order.customerPhone.replace(/\D/g, '') : '';
  const url = phone.length >= 10
    ? `https://wa.me/91${phone.slice(-10)}?text=${text}`
    : `https://wa.me/?text=${text}`;

  window.open(url, '_blank');
};

/**
 * Shares Khata statement PDF via WhatsApp
 */
export const shareKhataViaWhatsApp = async (customer, storeInfo) => {
  const currencySymbol = storeInfo?.currencySymbol || 'Rs. ';
  const doc = generateKhataStatementPDF(customer, storeInfo);
  const sanitizedName = (customer.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Khata_Statement_${sanitizedName}.pdf`;

  // Try native share on mobile
  let sharedViaNative = false;
  try {
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: `Khata Ledger Statement - ${customer.name}`,
        text: `Khata Statement from ${storeInfo?.storeName || 'our store'}`
      });
      sharedViaNative = true;
    }
  } catch (err) {}

  if (!sharedViaNative) {
    doc.save(fileName);
  }

  // Generate clean WhatsApp message
  const recentPayments = (customer.transactions || [])
    .filter(t => t.type === 'PAYMENT_RECEIVED')
    .slice(-3);

  const lines = [
    `📊 *CUSTOMER KHATA STATEMENT*`,
    `🏪 *${storeInfo?.storeName || 'RETAIL POS'}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Customer:* ${customer.name}`,
    `📅 *Statement Date:* ${formatDateTimeStr(new Date())}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 *CURRENT OUTSTANDING:* *${currencySymbol}${customer.creditBalance}*`,
    customer.creditLimit ? `🔒 *Credit Limit:* ${currencySymbol}${customer.creditLimit}` : null,
    recentPayments.length > 0 ? `━━━━━━━━━━━━━━━━━━━━` : null,
    recentPayments.length > 0 ? `💳 *Recent EMI Payments:*` : null,
    ...recentPayments.map(p => `  • ${formatDateTimeStr(p.date)}: -${currencySymbol}${p.amount} (${p.notes || p.paymentMode || 'Payment'})`),
    `━━━━━━━━━━━━━━━━━━━━`,
    `📎 *Detailed PDF Ledger:* _Downloaded (${fileName})_`,
    `Kindly clear the pending balance at your earliest convenience via Cash or UPI.`,
    `🙏 _Thank you for your valued patronage!_`
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join('\n'));
  const phone = customer.phone ? customer.phone.replace(/\D/g, '') : '';
  const url = phone.length >= 10
    ? `https://wa.me/91${phone.slice(-10)}?text=${text}`
    : `https://wa.me/?text=${text}`;

  window.open(url, '_blank');
};
