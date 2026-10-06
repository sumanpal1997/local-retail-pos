import React, { useState } from 'react';
import { BookOpen, User, Phone, ArrowDownLeft, Share2, Plus, CheckCircle2, History } from 'lucide-react';

export default function KhataLedger({ customers, onAddCustomer, onRecordPayment, storeInfo }) {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0] || null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', address: '', creditLimit: 5000 });

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.creditBalance || 0), 0);
  const customersWithCredit = customers.filter(c => c.creditBalance > 0);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0 || !selectedCustomer) return;

    onRecordPayment(selectedCustomer._id, paymentAmount, paymentMode);
    setPaymentAmount('');
    setIsPayModalOpen(false);
  };

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCust.name || !newCust.phone) return;

    onAddCustomer(newCust);
    setNewCust({ name: '', phone: '', address: '', creditLimit: 5000 });
    setIsAddCustModalOpen(false);
  };

  const sendWhatsAppReminder = (customer) => {
    const text = encodeURIComponent(
      `Namaste ${customer.name} ji,\n\nThis is a gentle reminder from *${storeInfo?.storeName || 'our shop'}*. Your current outstanding credit balance is *${storeInfo?.currencySymbol || '₹'}${customer.creditBalance}*.\n\nKindly clear this at your earliest convenience via Cash or UPI.\n\nThank you for your patronage! 🙏`
    );
    const phone = customer.phone.replace(/\D/g, '');
    const url = phone.length >= 10
      ? `https://wa.me/91${phone.slice(-10)}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Credit (Khata) Ledger</h1>
          <p className="text-xs text-slate-500">
            Digitally track customer credit, record settlements, and send WhatsApp payment reminders
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
            {storeInfo?.currencySymbol || '₹'}{totalOutstanding.toLocaleString()}
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
        {/* Left: Customer Directory (5 cols) */}
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

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
            {filteredCustomers.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No customers found</p>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?._id === cust._id;
                return (
                  <div
                    key={cust._id}
                    onClick={() => setSelectedCustomer(cust)}
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
                        {storeInfo?.currencySymbol || '₹'}{cust.creditBalance}
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
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500">
                    Ph: {selectedCustomer.phone} {selectedCustomer.address ? `• ${selectedCustomer.address}` : ''}
                  </p>
                </div>

                <div className="flex gap-2">
                  {selectedCustomer.creditBalance > 0 && (
                    <button
                      onClick={() => sendWhatsAppReminder(selectedCustomer)}
                      className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      title="Send WhatsApp Reminder"
                    >
                      <Share2 className="w-3.5 h-3.5" /> WhatsApp Reminder
                    </button>
                  )}
                  <button
                    onClick={() => setIsPayModalOpen(true)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" /> Collect Payment
                  </button>
                </div>
              </div>

              {/* Balance Summary Box */}
              <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Current Balance Owed
                  </span>
                  <p className="text-2xl font-bold text-rose-600 mt-0.5">
                    {storeInfo?.currencySymbol || '₹'}{selectedCustomer.creditBalance}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Credit Limit</span>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    {storeInfo?.currencySymbol || '₹'}{selectedCustomer.creditLimit || 5000}
                  </p>
                </div>
              </div>

              {/* Ledger History */}
              <div className="p-4">
                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" /> Transaction Timeline
                </h4>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {selectedCustomer.transactions && selectedCustomer.transactions.length > 0 ? (
                    selectedCustomer.transactions.map((t, idx) => {
                      const isCredit = t.type === 'PURCHASE_CREDIT';
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div>
                            <span className={`font-semibold ${isCredit ? 'text-rose-700' : 'text-emerald-700'}`}>
                              {isCredit ? 'Credit Purchase (Billed)' : 'Payment Received'}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(t.date).toLocaleDateString()} • {t.notes || 'Counter entry'}
                            </p>
                          </div>
                          <span className={`font-bold ${isCredit ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isCredit ? '+' : '-'}{storeInfo?.currencySymbol || '₹'}{t.amount}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No previous credit transactions.</p>
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

      {/* Collect Payment Modal */}
      {isPayModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Receive Khata Settlement</h3>
            <p className="text-xs text-slate-500 mb-4">
              Recording payment for <strong className="text-slate-800">{selectedCustomer.name}</strong>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount Received ({storeInfo?.currencySymbol || '₹'})
                </label>
                <input
                  type="number"
                  required
                  placeholder={`Max ₹${selectedCustomer.creditBalance}`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

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
                  Record Settlement
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
                <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
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
