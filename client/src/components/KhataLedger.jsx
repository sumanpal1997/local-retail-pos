import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  User, 
  Phone, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Share2, 
  Plus, 
  CheckCircle2, 
  History, 
  Clock, 
  Calendar, 
  Wallet, 
  CreditCard, 
  Filter,
  Check,
  Download,
  FileText
} from 'lucide-react';
import { downloadKhataStatementPDF, shareKhataViaWhatsApp } from '../utils/pdfGenerator';

export default function KhataLedger({ 
  customers = [], 
  onAddCustomer, 
  onRecordPayment, 
  onRecordCredit, 
  storeInfo 
}) {
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?._id || null);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'PAYMENTS' | 'CREDITS'

  // Payment (EMI) modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // Credit (Udhaar) modal state
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [creditDate, setCreditDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // Add customer modal state
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', address: '', creditLimit: 5000 });

  // Always resolve selected customer from props to prevent stale data
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c._id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  const currency = storeInfo?.currencySymbol || '₹';
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.creditBalance || 0), 0);
  const customersWithCredit = customers.filter(c => c.creditBalance > 0);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  // Format date and time prominently
  const formatDateTime = (dateValue) => {
    if (!dateValue) return { date: 'N/A', time: '', full: 'N/A' };
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return { date: String(dateValue), time: '', full: String(dateValue) };

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
    return {
      date: dateStr,
      time: timeStr,
      full: `${dateStr} at ${timeStr}`
    };
  };

  // Compute chronological running balance for every transaction
  const processedTransactions = useMemo(() => {
    if (!selectedCustomer?.transactions || selectedCustomer.transactions.length === 0) return [];

    // Sort chronologically (oldest first) to compute correct balance progression
    const sorted = [...selectedCustomer.transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let running = 0;
    const computed = sorted.map((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'PURCHASE_CREDIT') {
        running += amt;
      } else {
        running = Math.max(0, running - amt);
      }
      return {
        ...t,
        calculatedBalanceAfter: t.balanceAfter !== undefined ? t.balanceAfter : running
      };
    });

    // Return newest first for timeline viewing
    return computed.reverse();
  }, [selectedCustomer]);

  // Filtered transactions based on selected filter
  const displayedTransactions = useMemo(() => {
    if (filterType === 'PAYMENTS') {
      return processedTransactions.filter(t => t.type === 'PAYMENT_RECEIVED');
    }
    if (filterType === 'CREDITS') {
      return processedTransactions.filter(t => t.type === 'PURCHASE_CREDIT');
    }
    return processedTransactions;
  }, [processedTransactions, filterType]);

  // Customer stats for EMI / Settlement tracking
  const customerStats = useMemo(() => {
    if (!selectedCustomer?.transactions) return { totalCredit: 0, totalPaid: 0, paymentCount: 0 };
    const totalCredit = selectedCustomer.transactions
      .filter(t => t.type === 'PURCHASE_CREDIT')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalPaid = selectedCustomer.transactions
      .filter(t => t.type === 'PAYMENT_RECEIVED')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const paymentCount = selectedCustomer.transactions
      .filter(t => t.type === 'PAYMENT_RECEIVED').length;
    return { totalCredit, totalPaid, paymentCount };
  }, [selectedCustomer]);

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0 || !selectedCustomer) return;

    if (onRecordPayment) {
      onRecordPayment(
        selectedCustomer._id, 
        paymentAmount, 
        paymentMode, 
        paymentNote.trim(), 
        paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString()
      );
    }

    setPaymentAmount('');
    setPaymentNote('');
    setIsPayModalOpen(false);
  };

  const handleRecordCredit = (e) => {
    e.preventDefault();
    if (!creditAmount || Number(creditAmount) <= 0 || !selectedCustomer) return;

    if (onRecordCredit) {
      onRecordCredit(
        selectedCustomer._id, 
        creditAmount, 
        creditNote.trim() || 'Credit purchase', 
        creditDate ? new Date(creditDate).toISOString() : new Date().toISOString()
      );
    }

    setCreditAmount('');
    setCreditNote('');
    setIsCreditModalOpen(false);
  };

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCust.name || !newCust.phone) return;

    if (onAddCustomer) {
      onAddCustomer(newCust);
    }
    setNewCust({ name: '', phone: '', address: '', creditLimit: 5000 });
    setIsAddCustModalOpen(false);
  };

  const sendWhatsAppReminder = (customer) => {
    const cur = storeInfo?.currencySymbol || '₹';
    const recentPayments = (customer.transactions || [])
      .filter(t => t.type === 'PAYMENT_RECEIVED')
      .slice(-3);

    let paymentBreakdown = '';
    if (recentPayments.length > 0) {
      paymentBreakdown = '\n\n*Recent Payments (EMIs):*\n' + recentPayments.map(p => {
        const dt = formatDateTime(p.date);
        return `• ${dt.date} ${dt.time}: -${cur}${p.amount} (${p.notes || p.paymentMode || 'Payment'})`;
      }).join('\n');
    }

    const message = encodeURIComponent(
      `Namaste ${customer.name} ji,\n\nThis is a Khata statement from *${storeInfo?.storeName || 'our shop'}*.\n\n*Current Balance Due:* *${cur}${customer.creditBalance}*${paymentBreakdown}\n\nKindly clear the remaining balance at your convenience via Cash or UPI.\n\nThank you for your patronage! 🙏`
    );
    const phone = customer.phone.replace(/\D/g, '');
    const url = phone.length >= 10
      ? `https://wa.me/91${phone.slice(-10)}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Credit (Khata) Ledger</h1>
          <p className="text-xs text-slate-500">
            Digitally track customer credit, record installment / EMI settlements with date & time logs
          </p>
        </div>

        <button
          onClick={() => setIsAddCustModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add New Customer
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
          <span className="text-xs font-medium text-rose-800">Total Credit Outstanding</span>
          <p className="text-2xl font-bold text-rose-900 mt-1">
            {currency}{totalOutstanding.toLocaleString()}
          </p>
          <p className="text-[11px] text-rose-700 mt-0.5">Across {customersWithCredit.length} customers</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Registered Customers</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{customers.length}</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
          <span className="text-xs font-medium text-emerald-800">Customers with Zero Balance</span>
          <p className="text-2xl font-bold text-emerald-900 mt-1">
            {customers.length - customersWithCredit.length}
          </p>
        </div>
      </div>

      {/* Main 2-Column Split: Customer List & Detail Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Customer Directory (4.5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[580px]">
            {filteredCustomers.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No customers found</p>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?._id === cust._id;
                return (
                  <div
                    key={cust._id}
                    onClick={() => setSelectedCustomerId(cust._id)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                      isSelected ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-slate-900 text-xs">{cust.name}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {cust.phone}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-bold ${
                        cust.creditBalance > 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}>
                        {currency}{cust.creditBalance.toLocaleString()}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {cust.creditBalance > 0 ? 'Owes Store' : 'Settled'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Customer Ledger & Actions (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          {selectedCustomer ? (
            <div>
              {/* Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500">
                    Ph: {selectedCustomer.phone} {selectedCustomer.address ? `• ${selectedCustomer.address}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => downloadKhataStatementPDF(selectedCustomer, storeInfo)}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    title="Download Official PDF Statement"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" /> Download PDF
                  </button>

                  <button
                    onClick={() => shareKhataViaWhatsApp(selectedCustomer, storeInfo)}
                    className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    title="Send PDF Statement on WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Send PDF on WhatsApp
                  </button>

                  <button
                    onClick={() => {
                      const now = new Date();
                      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                      setCreditDate(now.toISOString().slice(0, 16));
                      setIsCreditModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> + Give Credit
                  </button>

                  <button
                    onClick={() => {
                      const now = new Date();
                      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                      setPaymentDate(now.toISOString().slice(0, 16));
                      setPaymentAmount(selectedCustomer.creditBalance > 0 ? selectedCustomer.creditBalance : '');
                      setIsPayModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" /> Collect Payment / EMI
                  </button>
                </div>
              </div>

              {/* Balance & EMI Progress Summary */}
              <div className="p-4 bg-white border-b border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Balance Due</span>
                    <p className={`text-xl font-bold mt-0.5 ${selectedCustomer.creditBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {currency}{selectedCustomer.creditBalance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Credit Billed</span>
                    <p className="text-xl font-bold text-slate-800 mt-0.5">
                      {currency}{customerStats.totalCredit.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Paid So Far</span>
                    <p className="text-xl font-bold text-emerald-600 mt-0.5">
                      {currency}{customerStats.totalPaid.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">EMIs / Settlements</span>
                    <p className="text-xl font-bold text-indigo-600 mt-0.5">
                      {customerStats.paymentCount} {customerStats.paymentCount === 1 ? 'payment' : 'payments'}
                    </p>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                {customerStats.totalCredit > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-1">
                      <span>EMI Settlement Progress</span>
                      <span>
                        {Math.min(100, Math.round((customerStats.totalPaid / customerStats.totalCredit) * 100))}% Cleared
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (customerStats.totalPaid / customerStats.totalCredit) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ledger History Header with Filters */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-600" /> Transaction Timeline & History Log
                  </h4>

                  {/* Filter chips */}
                  <div className="flex gap-1">
                    {[
                      { id: 'ALL', label: 'All' },
                      { id: 'PAYMENTS', label: 'EMIs / Payments' },
                      { id: 'CREDITS', label: 'Purchases' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setFilterType(f.id)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                          filterType === f.id
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transactions Timeline */}
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {displayedTransactions.length > 0 ? (
                    displayedTransactions.map((t, idx) => {
                      const isCredit = t.type === 'PURCHASE_CREDIT';
                      const { date, time, full } = formatDateTime(t.date);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 text-xs transition"
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon badge */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isCredit ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              {isCredit ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-bold ${isCredit ? 'text-rose-700' : 'text-emerald-700'}`}>
                                  {isCredit ? 'Credit Purchase (Udhaar)' : 'Payment Received (EMI / Jama)'}
                                </span>
                                {t.paymentMode && (
                                  <span className="bg-slate-200/80 text-slate-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                                    {t.paymentMode}
                                  </span>
                                )}
                              </div>

                              {/* Date and Time Log - Prominently Displayed */}
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1" title={full}>
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span className="font-semibold text-slate-700">{date}</span>
                                <span className="text-slate-300">•</span>
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span className="font-semibold text-slate-700">{time}</span>
                              </div>

                              {/* Transaction Note / Remarks */}
                              {t.notes && (
                                <p className="text-[11px] text-slate-600 mt-1 italic">
                                  "{t.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Financials: Amount & Balance Remaining */}
                          <div className="text-right shrink-0 pl-3">
                            <span className={`text-sm font-bold block ${
                              isCredit ? 'text-rose-600' : 'text-emerald-600'
                            }`}>
                              {isCredit ? '+' : '-'}{currency}{Number(t.amount).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Bal: {currency}{(t.calculatedBalanceAfter !== undefined ? t.calculatedBalanceAfter : 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400">No transactions matching this filter.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a customer from the left to view ledger
            </div>
          )}
        </div>
      </div>

      {/* Collect Payment / EMI Modal */}
      {isPayModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Record Payment / EMI</h3>
                <p className="text-xs text-slate-500">
                  Customer: <strong className="text-slate-800">{selectedCustomer.name}</strong> • Current Due: <strong className="text-rose-600">{currency}{selectedCustomer.creditBalance}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount Received ({currency}) *
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  min="1"
                  placeholder="Enter payment amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />

                {/* Quick amount suggestion chips */}
                {selectedCustomer.creditBalance > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(selectedCustomer.creditBalance)}
                      className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-medium hover:bg-emerald-100"
                    >
                      Full Balance ({currency}{selectedCustomer.creditBalance})
                    </button>
                    {selectedCustomer.creditBalance > 1000 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(Math.round(selectedCustomer.creditBalance / 3))}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium hover:bg-slate-200"
                      >
                        1/3 EMI ({currency}{Math.round(selectedCustomer.creditBalance / 3)})
                      </button>
                    )}
                    {selectedCustomer.creditBalance > 500 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(Math.round(selectedCustomer.creditBalance / 2))}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium hover:bg-slate-200"
                      >
                        Half ({currency}{Math.round(selectedCustomer.creditBalance / 2)})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Installment / EMI Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Installment / EMI Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. EMI 1 of 3, March payment, or Cash installment"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />

                {/* Quick Note Presets */}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {[
                    'EMI 1 of 3',
                    'EMI 2 of 3',
                    'EMI 3 of 3 (Final Settlement)',
                    'Partial Payment',
                    'Full Settlement'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPaymentNote(preset)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date and Time Picker */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Payment Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / QR">UPI / QR Code</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Save Payment Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Give Credit (+ Udhaar) Modal */}
      {isCreditModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Give Credit (+ Udhaar)</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add credit entry for <strong className="text-slate-800">{selectedCustomer.name}</strong>
            </p>

            <form onSubmit={handleRecordCredit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Credit Amount ({currency}) *
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  min="1"
                  placeholder="e.g. 5000"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Purchase Description / Item Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5000 Monthly grocery items or Invoice #..."
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Credit Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={creditDate}
                  onChange={(e) => setCreditDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
                >
                  Record Credit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {isAddCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-4">Add Customer to Khata</h3>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Verma"
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number (10 Digits) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={newCust.phone}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Ward 4, Near Temple"
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credit Limit ({currency})</label>
                <input
                  type="number"
                  placeholder="Default 5000"
                  value={newCust.creditLimit}
                  onChange={(e) => setNewCust({ ...newCust, creditLimit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddCustModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
