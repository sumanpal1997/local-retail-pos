import React, { useState } from 'react';
import { Printer, Share2, Check, X, FileText, Download } from 'lucide-react';
import { downloadInvoicePDF, shareInvoiceViaWhatsApp } from '../utils/pdfGenerator';

export default function ReceiptModal({ order, storeInfo, onClose }) {
  if (!order) return null;

  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      setIsPdfGenerating(true);
      downloadInvoicePDF(order, storeInfo);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleWhatsAppShare = async () => {
    try {
      setIsPdfGenerating(true);
      await shareInvoiceViaWhatsApp(order, storeInfo);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="bg-emerald-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 bg-white/20 rounded-full p-1" />
            <h3 className="font-bold text-base">Payment Successful!</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Preview Area */}
        <div className="p-6 bg-slate-50 flex justify-center">
          <div 
            id="printable-receipt" 
            className="w-full bg-white p-5 rounded-lg border border-slate-300 font-mono text-xs shadow-xs text-slate-900"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="font-bold text-sm uppercase tracking-wide">
                {storeInfo?.storeName || 'RETAIL POS'}
              </h2>
              <p className="text-[10px] text-slate-600 mt-0.5">
                {storeInfo?.address?.street}, {storeInfo?.address?.city}
              </p>
              <p className="text-[10px] text-slate-600">Ph: {storeInfo?.phone}</p>
              {storeInfo?.taxId && (
                <p className="text-[10px] text-slate-600">GSTIN: {storeInfo.taxId}</p>
              )}
            </div>

            {/* Metadata */}
            <div className="py-2 border-b border-dashed border-slate-300 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Inv: #{order.invoiceNumber}</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cust: {order.customerName}</span>
                <span>{order.customerPhone ? order.customerPhone.slice(-10) : ''}</span>
              </div>
            </div>

            {/* Item Rows */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
              <div className="flex justify-between font-bold text-slate-700 pb-1">
                <span>Item</span>
                <span>Qty x Rate = Total</span>
              </div>
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-baseline">
                  <div className="flex-1 pr-2 truncate">
                    <span>{item.name}</span>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span>{item.quantity}×₹{item.unitPrice} = </span>
                    <span className="font-bold">₹{item.totalPrice}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              {order.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-₹{order.totalDiscount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
                <span>GRAND TOTAL</span>
                <span>₹{order.grandTotal}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                <span>Paid via: {order.paymentMethod}</span>
                {order.paymentDetails?.changeReturned > 0 && (
                  <span>Change: ₹{order.paymentDetails.changeReturned}</span>
                )}
              </div>
              {order.paymentMethod === 'CREDIT_KHATA' && (
                <div className="bg-rose-50 border border-rose-200 rounded p-1.5 mt-1 text-[10px] text-rose-700 font-semibold text-center">
                  Added to Customer Khata Credit
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-500">
              <p>{storeInfo?.receiptSettings?.footerMessage || 'Thank you for shopping local!'}</p>
              <p className="mt-1 font-sans text-[9px] text-slate-400">Powered by LocalRetailPOS</p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Download PDF, WhatsApp Bill & Thermal Print */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isPdfGenerating}
              className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition border border-slate-300"
            >
              <Download className="w-4 h-4 text-slate-600" /> Download PDF Bill
            </button>
            <button
              onClick={handleWhatsAppShare}
              disabled={isPdfGenerating}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-sm shadow-emerald-200"
            >
              <Share2 className="w-4 h-4" /> Send PDF on WhatsApp
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print Thermal Slip
          </button>
        </div>
      </div>
    </div>
  );
}
