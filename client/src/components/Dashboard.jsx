import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  AlertCircle, 
  BookOpen, 
  Clock, 
  CreditCard,
  QrCode,
  Banknote
} from 'lucide-react';

export default function Dashboard({ orders, products, customers, storeInfo }) {
  // Compute metrics
  const totalSales = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalOrders = orders.length;

  // Gross profit calculation
  let totalEstimatedProfit = 0;
  orders.forEach(order => {
    order.items?.forEach(item => {
      const cost = (item.costPrice || 0) * (item.quantity || 1);
      const rev = item.totalPrice || 0;
      totalEstimatedProfit += Math.max(0, rev - cost);
    });
  });

  const totalCreditOutstanding = customers.reduce((sum, c) => sum + (c.creditBalance || 0), 0);
  const lowStockCount = products.filter(p => p.currentStock <= p.minStockAlert).length;

  // Payment breakdown
  const paymentBreakdown = {
    CASH: orders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.grandTotal, 0),
    UPI_QR: orders.filter(o => o.paymentMethod === 'UPI_QR').reduce((sum, o) => sum + o.grandTotal, 0),
    CARD: orders.filter(o => o.paymentMethod === 'CARD').reduce((sum, o) => sum + o.grandTotal, 0),
    CREDIT_KHATA: orders.filter(o => o.paymentMethod === 'CREDIT_KHATA').reduce((sum, o) => sum + o.grandTotal, 0),
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Store Insights & Daily Analytics</h1>
        <p className="text-xs text-slate-500">
          Track sales performance, profit margins, cash/digital breakdown, and inventory risk
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {storeInfo?.currencySymbol || '₹'}{totalSales.toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {totalOrders} Orders Billed
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Profit</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {storeInfo?.currencySymbol || '₹'}{Math.round(totalEstimatedProfit).toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Margin: {totalSales > 0 ? Math.round((totalEstimatedProfit / totalSales) * 100) : 0}%
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100/50 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Khata Credit Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khata Credit</span>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">
              {storeInfo?.currencySymbol || '₹'}{totalCreditOutstanding.toLocaleString()}
            </p>
            <span className="text-[11px] text-rose-600 font-semibold mt-1 block">
              Pending collections
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{lowStockCount}</p>
            <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
              Items need reordering
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Payment Split & Sales Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Payment Methods Received</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-700">Cash</span>
              </div>
              <span className="text-xs font-bold text-slate-900">
                {storeInfo?.currencySymbol || '₹'}{paymentBreakdown.CASH.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-700">UPI / QR Code</span>
              </div>
              <span className="text-xs font-bold text-slate-900">
                {storeInfo?.currencySymbol || '₹'}{paymentBreakdown.UPI_QR.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-slate-700">Card</span>
              </div>
              <span className="text-xs font-bold text-slate-900">
                {storeInfo?.currencySymbol || '₹'}{paymentBreakdown.CARD.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-slate-700">Khata Credit</span>
              </div>
              <span className="text-xs font-bold text-amber-700">
                {storeInfo?.currencySymbol || '₹'}{paymentBreakdown.CREDIT_KHATA.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400">Total Billed: </span>
            <span className="text-xs font-bold text-slate-800">
              {storeInfo?.currencySymbol || '₹'}{totalSales.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Recent Invoices Table (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Recent Store Invoices</h3>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Latest sales
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-3 py-2">Invoice #</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Payment</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400">
                      No invoices recorded yet. Run your first sale on POS Billing!
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2.5 font-mono font-semibold text-slate-800">
                        {ord.invoiceNumber}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 truncate max-w-[120px]">
                        {ord.customerName}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                        {storeInfo?.currencySymbol || '₹'}{ord.grandTotal}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-right">
            <p className="text-[11px] text-slate-400">Data automatically synced locally & to cloud</p>
          </div>
        </div>
      </div>
    </div>
  );
}
