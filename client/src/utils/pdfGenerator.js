import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

// Format Indian Currency
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Format Date & Time
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

// Convert number to Indian words
export const amountInWords = (num) => {
  const nVal = Math.round(Number(num) || 0);
  if (nVal === 0) return 'Zero Rupees Only';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + nVal).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim() + ' Rupees Only';
};

/**
 * Generates UPI payment payload & QR code Data URL
 */
const generateUpiQr = async (storeInfo, amount, invoiceNumber) => {
  try {
    const vpa = storeInfo?.taxId ? `${storeInfo.storeName.replace(/\s+/g, '').toLowerCase()}@upi` : 'merchant@upi';
    const upiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(storeInfo?.storeName || 'Merchant')}&am=${amount}&tn=Inv_${invoiceNumber}&cu=INR`;
    return await QRCode.toDataURL(upiUri, {
      width: 140,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
  } catch (e) {
    return null;
  }
};

/**
 * Renders an HTML string into a high-DPI custom-fit PDF with zero blank whitespace
 */
const renderHtmlToFitPdf = async (htmlContent, fileName) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '420px';
  container.style.backgroundColor = '#ffffff';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.color = '#0f172a';
  container.innerHTML = htmlContent;

  document.body.appendChild(container);

  // Allow image loading and reflow
  await new Promise((r) => setTimeout(r, 80));

  try {
    const canvas = await html2canvas(container, {
      scale: 3, // 3x high-resolution for razor-sharp typography
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const pdfWidthMm = 100; // 100mm width fits all phone screens & POS printers
    const pdfHeightMm = (canvas.height * pdfWidthMm) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidthMm, pdfHeightMm]
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm, '', 'FAST');
    pdf.save(fileName);

    return { pdf, blob: pdf.output('blob') };
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * Creates the HTML layout for a modern, authentic Retail Cash Bill / Tax Invoice
 */
export const buildInvoiceHtml = async (order, storeInfo) => {
  const qrDataUrl = await generateUpiQr(storeInfo, order.grandTotal, order.invoiceNumber);
  const storeName = storeInfo?.storeName || 'RETAIL POS STORE';
  const initial = storeName.charAt(0).toUpperCase();

  let addressLine = '';
  if (storeInfo?.address?.street) addressLine += storeInfo.address.street;
  if (storeInfo?.address?.city) addressLine += (addressLine ? ', ' : '') + storeInfo.address.city;
  if (storeInfo?.address?.state) addressLine += ', ' + storeInfo.address.state;

  const totalItemsCount = (order.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
  const words = amountInWords(order.grandTotal);

  const itemsHtml = (order.items || []).map((item, idx) => `
    <tr style="border-bottom: 1px dashed #e2e8f0; font-size: 13px;">
      <td style="padding: 10px 4px; vertical-align: top; width: 22px; color: #64748b; font-weight: 600;">${idx + 1}</td>
      <td style="padding: 10px 4px; vertical-align: top;">
        <div style="font-weight: 700; color: #0f172a; text-transform: capitalize;">${item.name}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${item.quantity} ${item.unit || 'pcs'} × ${formatCurrency(item.unitPrice)}</div>
      </td>
      <td style="padding: 10px 4px; vertical-align: top; text-align: right; font-weight: 800; color: #0f172a; white-space: nowrap;">
        ${formatCurrency(item.totalPrice)}
      </td>
    </tr>
  `).join('');

  return `
    <div style="width: 420px; background: #ffffff; padding: 24px 20px; box-sizing: border-box; color: #0f172a;">
      <!-- Store Header Card -->
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: #10b981; color: #ffffff; border-radius: 12px; font-size: 24px; font-weight: 900; margin-bottom: 8px;">
          ${initial}
        </div>
        <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #0f172a;">
          ${storeName}
        </div>
        ${addressLine ? `<div style="font-size: 12px; color: #475569; margin-top: 3px; font-weight: 500;">${addressLine}</div>` : ''}
        <div style="font-size: 12px; color: #475569; margin-top: 2px;">
          ${storeInfo?.phone ? `📞 Ph: <strong>${storeInfo.phone}</strong>` : ''}
          ${storeInfo?.email ? ` • ✉️ ${storeInfo.email}` : ''}
        </div>
        ${storeInfo?.taxId ? `<div style="font-size: 11px; color: #0f172a; font-weight: 700; margin-top: 4px; background: #f1f5f9; display: inline-block; padding: 2px 8px; border-radius: 4px;">GSTIN: ${storeInfo.taxId}</div>` : ''}
      </div>

      <!-- Bill Title & Status -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0 8px; border-bottom: 1px dashed #cbd5e1;">
        <div>
          <span style="background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
            TAX INVOICE / CASH BILL
          </span>
        </div>
        <div style="font-size: 11px; font-weight: 800; color: #10b981; text-transform: uppercase;">
          ● ${order.paymentMethod === 'CREDIT_KHATA' ? 'BILLED TO KHATA' : 'PAID IN FULL'}
        </div>
      </div>

      <!-- Invoice Metadata Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin: 10px 0; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #64748b;">Invoice No:</span>
          <strong style="color: #0f172a; font-family: monospace; font-size: 13px;">${order.invoiceNumber}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #64748b;">Date & Time:</span>
          <strong style="color: #0f172a;">${formatDateTimeStr(order.createdAt)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #64748b;">Customer:</span>
          <strong style="color: #0f172a;">${order.customerName || 'Walk-in Customer'}</strong>
        </div>
        ${order.customerPhone ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #64748b;">Contact:</span>
          <strong style="color: #0f172a;">${order.customerPhone}</strong>
        </div>` : ''}
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">Payment Method:</span>
          <strong style="color: #0f172a; text-transform: uppercase;">${order.paymentMethod}</strong>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase;">
            <th style="padding: 7px 4px; text-align: left; width: 22px;">#</th>
            <th style="padding: 7px 4px; text-align: left;">Item Description</th>
            <th style="padding: 7px 4px; text-align: right; width: 80px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Totals Summary -->
      <div style="margin-top: 14px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #475569;">
          <span>Items Total (${(order.items || []).length} items, ${totalItemsCount} units):</span>
          <span>${formatCurrency(order.subtotal)}</span>
        </div>

        ${order.totalDiscount > 0 ? `
        <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #10b981; font-weight: 600;">
          <span>Discount Savings:</span>
          <span>-${formatCurrency(order.totalDiscount)}</span>
        </div>` : ''}

        ${order.taxAmount > 0 ? `
        <div style="display: flex; justify-content: space-between; padding: 2px 0; color: #475569;">
          <span>Taxes / GST:</span>
          <span>${formatCurrency(order.taxAmount)}</span>
        </div>` : ''}

        <!-- Grand Total Banner -->
        <div style="background: #10b981; color: #ffffff; border-radius: 8px; padding: 12px 14px; margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">
            GRAND TOTAL
          </div>
          <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
            ${formatCurrency(order.grandTotal)}
          </div>
        </div>

        <!-- Amount in Words -->
        <div style="margin-top: 8px; font-size: 11px; color: #64748b; font-style: italic; text-align: right;">
          ${words}
        </div>
      </div>

      <!-- Payment / UPI QR & Authenticity Section -->
      <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; gap: 14px;">
        ${qrDataUrl ? `
        <img src="${qrDataUrl}" style="width: 75px; height: 75px; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; padding: 2px;" alt="UPI QR" />
        ` : ''}
        <div style="flex: 1; font-size: 11px;">
          <div style="font-weight: 800; color: #0f172a; text-transform: uppercase;">SCAN & PAY VIA UPI</div>
          <div style="color: #64748b; margin-top: 2px;">Accepted: GPay, PhonePe, Paytm, BHIM</div>
          <div style="font-weight: 700; color: #10b981; margin-top: 4px;">✓ Verified Merchant Bill</div>
        </div>
      </div>

      <!-- Barcode Graphic Simulation -->
      <div style="text-align: center; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 26px; letter-spacing: 5px; font-weight: bold; color: #1e293b;">
          ||| | ||||| || |||| || |||
        </div>
        <div style="font-size: 10px; font-family: monospace; color: #64748b; margin-top: 2px;">
          ${order.invoiceNumber}
        </div>
      </div>

      <!-- Footer Message -->
      <div style="text-align: center; margin-top: 12px; font-size: 11px; color: #64748b;">
        <p style="margin: 0; font-weight: 600; color: #334155;">
          ${storeInfo?.receiptSettings?.footerMessage || 'Thank you for shopping local! Please visit again.'}
        </p>
        <p style="margin: 4px 0 0; font-size: 9px; color: #94a3b8;">
          Computer Generated Tax Invoice • RetailPOS Cloud
        </p>
      </div>
    </div>
  `;
};

/**
 * Creates the HTML layout for an authentic Customer Khata Ledger Statement
 */
export const buildKhataStatementHtml = async (customer, storeInfo) => {
  const storeName = storeInfo?.storeName || 'RETAIL POS STORE';
  const initial = storeName.charAt(0).toUpperCase();

  const totalCredit = (customer.transactions || [])
    .filter(t => t.type === 'PURCHASE_CREDIT')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalPaid = (customer.transactions || [])
    .filter(t => t.type === 'PAYMENT_RECEIVED')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const isSettled = customer.creditBalance <= 0;

  // Sort chronologically ascending
  const sorted = [...(customer.transactions || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let running = 0;
  const rowsHtml = sorted.map((t, idx) => {
    const isCredit = t.type === 'PURCHASE_CREDIT';
    const amt = Number(t.amount) || 0;
    if (isCredit) {
      running += amt;
    } else {
      running = Math.max(0, running - amt);
    }

    const dt = formatDateTimeStr(t.date);
    return `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 8px 4px; color: #64748b; font-weight: 600;">${idx + 1}</td>
        <td style="padding: 8px 4px; color: #0f172a; font-weight: 600;">
          ${dt}
        </td>
        <td style="padding: 8px 4px; color: #334155;">
          <div style="font-weight: 700;">${t.notes || (isCredit ? 'Credit Purchase' : 'Payment Received')}</div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">${t.paymentMode || (isCredit ? 'Credit' : 'Cash')}</div>
        </td>
        <td style="padding: 8px 4px; text-align: right; color: ${isCredit ? '#e11d48' : '#64748b'}; font-weight: 700;">
          ${isCredit ? '+' + formatCurrency(amt) : '-'}
        </td>
        <td style="padding: 8px 4px; text-align: right; color: ${!isCredit ? '#10b981' : '#64748b'}; font-weight: 700;">
          ${!isCredit ? '-' + formatCurrency(amt) : '-'}
        </td>
        <td style="padding: 8px 4px; text-align: right; font-weight: 800; color: #0f172a;">
          ${formatCurrency(running)}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div style="width: 440px; background: #ffffff; padding: 24px 20px; box-sizing: border-box; color: #0f172a;">
      <!-- Store Header -->
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; background: #0f172a; color: #ffffff; border-radius: 10px; font-size: 22px; font-weight: 900; margin-bottom: 6px;">
          ${initial}
        </div>
        <div style="font-size: 20px; font-weight: 900; text-transform: uppercase; color: #0f172a;">
          ${storeName}
        </div>
        <div style="font-size: 11px; color: #475569; margin-top: 2px;">
          ${storeInfo?.phone ? `Ph: ${storeInfo.phone}` : ''} ${storeInfo?.taxId ? `• GSTIN: ${storeInfo.taxId}` : ''}
        </div>
      </div>

      <!-- Statement Header Banner -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #cbd5e1;">
        <span style="background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
          KHATA LEDGER STATEMENT
        </span>
        <span style="font-size: 11px; color: #64748b; font-weight: 600;">
          Generated: ${formatDateTimeStr(new Date())}
        </span>
      </div>

      <!-- Customer Profile Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin: 10px 0; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: #64748b;">Customer Name:</span>
          <strong style="color: #0f172a; font-size: 13px;">${customer.name}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: #64748b;">Phone Number:</span>
          <strong style="color: #0f172a;">${customer.phone}</strong>
        </div>
        ${customer.address ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: #64748b;">Address:</span>
          <strong style="color: #0f172a;">${customer.address}</strong>
        </div>` : ''}
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">Credit Limit:</span>
          <strong style="color: #0f172a;">${formatCurrency(customer.creditLimit || 5000)}</strong>
        </div>
      </div>

      <!-- 3-Column Metric Cards -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 12px 0;">
        <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 8px; text-align: center;">
          <div style="font-size: 9px; font-weight: 800; color: #9f1239; text-transform: uppercase;">Total Credit</div>
          <div style="font-size: 13px; font-weight: 900; color: #e11d48; margin-top: 2px;">${formatCurrency(totalCredit)}</div>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 8px; text-align: center;">
          <div style="font-size: 9px; font-weight: 800; color: #065f46; text-transform: uppercase;">Total Paid</div>
          <div style="font-size: 13px; font-weight: 900; color: #10b981; margin-top: 2px;">${formatCurrency(totalPaid)}</div>
        </div>

        <div style="background: ${isSettled ? '#f0fdf4' : '#fff1f2'}; border: 1px solid ${isSettled ? '#bbf7d0' : '#fecdd3'}; border-radius: 6px; padding: 8px; text-align: center;">
          <div style="font-size: 9px; font-weight: 800; color: ${isSettled ? '#065f46' : '#9f1239'}; text-transform: uppercase;">Balance Due</div>
          <div style="font-size: 14px; font-weight: 900; color: ${isSettled ? '#10b981' : '#e11d48'}; margin-top: 2px;">${formatCurrency(customer.creditBalance)}</div>
        </div>
      </div>

      <!-- Ledger Table -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 800; text-transform: uppercase;">
            <th style="padding: 6px 4px; text-align: left;">#</th>
            <th style="padding: 6px 4px; text-align: left;">Date/Time</th>
            <th style="padding: 6px 4px; text-align: left;">Notes</th>
            <th style="padding: 6px 4px; text-align: right;">Udhaar (+)</th>
            <th style="padding: 6px 4px; text-align: right;">Jama (-)</th>
            <th style="padding: 6px 4px; text-align: right;">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Sign & Footer -->
      <div style="margin-top: 22px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1px solid #cbd5e1; font-size: 10px;">
        <div style="color: #64748b;">
          Please verify statement entries.<br />
          For queries, contact store manager.
        </div>
        <div style="text-align: center;">
          <div style="border-bottom: 1px solid #94a3b8; width: 120px; margin-bottom: 4px;"></div>
          <strong style="color: #0f172a;">Authorized Signatory</strong>
        </div>
      </div>
    </div>
  `;
};

/**
 * Downloads modern, compact Retail Bill PDF
 */
export const downloadInvoicePDF = async (order, storeInfo) => {
  const html = await buildInvoiceHtml(order, storeInfo);
  const fileName = `Invoice_${order.invoiceNumber || 'POS'}.pdf`;
  await renderHtmlToFitPdf(html, fileName);
  return fileName;
};

/**
 * Downloads modern, compact Khata Statement PDF
 */
export const downloadKhataStatementPDF = async (customer, storeInfo) => {
  const html = await buildKhataStatementHtml(customer, storeInfo);
  const sanitizedName = (customer.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Khata_Statement_${sanitizedName}.pdf`;
  await renderHtmlToFitPdf(html, fileName);
  return fileName;
};

/**
 * Shares official PDF via Web Share API (if supported) and opens WhatsApp with a professional message
 */
export const shareInvoiceViaWhatsApp = async (order, storeInfo) => {
  const html = await buildInvoiceHtml(order, storeInfo);
  const fileName = `Invoice_${order.invoiceNumber || 'POS'}.pdf`;
  const { blob } = await renderHtmlToFitPdf(html, fileName);

  // Check if native Web Share with file attachment is supported (Mobile browsers)
  let sharedViaNative = false;
  try {
    const pdfFile = new File([blob], fileName, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: `Bill ${order.invoiceNumber}`,
        text: `Official Bill from ${storeInfo?.storeName || 'our shop'}`
      });
      sharedViaNative = true;
    }
  } catch (err) {}

  // Open WhatsApp with polished message
  const lines = [
    `🧾 *RETAIL CASH BILL / TAX INVOICE*`,
    `🏪 *${storeInfo?.storeName || 'RETAIL POS'}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 *Invoice No:* ${order.invoiceNumber}`,
    `📅 *Date & Time:* ${formatDateTimeStr(order.createdAt)}`,
    order.customerName && order.customerName !== 'Walk-in Customer' ? `👤 *Customer:* ${order.customerName}` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🛍️ *Items Purchased (${(order.items || []).length}):*`,
    ...(order.items || []).slice(0, 5).map((it, idx) => `  ${idx + 1}. ${it.name} (${it.quantity} ${it.unit || 'pcs'}) = ${formatCurrency(it.totalPrice)}`),
    (order.items || []).length > 5 ? `  ...and ${(order.items.length - 5)} more items` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    order.totalDiscount > 0 ? `🏷️ *Discount:* -${formatCurrency(order.totalDiscount)}` : null,
    `💰 *Grand Total:* *${formatCurrency(order.grandTotal)}*`,
    `💳 *Payment Mode:* ${order.paymentMethod}`,
    order.paymentMethod === 'CREDIT_KHATA' ? `⚠️ *Recorded in Customer Khata (Credit)*` : null,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📎 *Official PDF Bill:* _Downloaded (${fileName})_`,
    `🙏 ${storeInfo?.receiptSettings?.footerMessage || 'Thank you for shopping local! Visit again.'}`
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
  const html = await buildKhataStatementHtml(customer, storeInfo);
  const sanitizedName = (customer.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Khata_Statement_${sanitizedName}.pdf`;
  const { blob } = await renderHtmlToFitPdf(html, fileName);

  try {
    const pdfFile = new File([blob], fileName, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: `Khata Statement - ${customer.name}`,
        text: `Khata Statement from ${storeInfo?.storeName || 'our shop'}`
      });
    }
  } catch (err) {}

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
    `💰 *CURRENT OUTSTANDING:* *${formatCurrency(customer.creditBalance)}*`,
    customer.creditLimit ? `🔒 *Credit Limit:* ${formatCurrency(customer.creditLimit)}` : null,
    recentPayments.length > 0 ? `━━━━━━━━━━━━━━━━━━━━` : null,
    recentPayments.length > 0 ? `💳 *Recent EMI Payments:*` : null,
    ...recentPayments.map(p => `  • ${formatDateTimeStr(p.date)}: -${formatCurrency(p.amount)} (${p.notes || p.paymentMode || 'Payment'})`),
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
