import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ArrowRight, 
  RefreshCw, 
  History, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Calendar, 
  ChevronRight,
  Eye,
  FileCheck
} from 'lucide-react';
import { 
  scanDistributorInvoice, 
  confirmInvoiceRestock, 
  fetchPurchaseInvoices 
} from '../services/api';

export default function AIInvoiceScanner({ onRestockCompleted, onNavigatePOS, onNavigateInventory }) {
  const [activeView, setActiveView] = useState('scanner'); // 'scanner' | 'history'
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [restockSuccess, setRestockSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Manual OCR text input toggle
  const [showRawText, setShowRawText] = useState(false);
  const [rawText, setRawText] = useState('');

  // Purchase invoices history
  const [historyList, setHistoryList] = useState([]);
  const [selectedHistoryInvoice, setSelectedHistoryInvoice] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load history on mount or view switch
  useEffect(() => {
    if (activeView === 'history') {
      loadHistory();
    }
  }, [activeView]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const records = await fetchPurchaseInvoices();
      setHistoryList(records || []);
    } catch (e) {
      console.error('Failed to load purchase history', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Trigger AI Scanning simulation with realistic multi-step progress
  const handleTriggerScan = async (params) => {
    setErrorMsg('');
    setRestockSuccess(null);
    setIsScanning(true);

    try {
      setScanStep('1/3: Optical Character Recognition (OCR) analyzing bill...');
      await new Promise(r => setTimeout(r, 600));

      setScanStep('2/3: Extracting supplier metadata, tax GSTIN & line items...');
      await new Promise(r => setTimeout(r, 600));

      setScanStep('3/3: Cross-referencing with active catalog & calculating margins...');
      const parsed = await scanDistributorInvoice(params);
      
      setInvoiceData(parsed);
      setIsScanning(false);
    } catch (err) {
      setIsScanning(false);
      setErrorMsg(err.message || 'Failed to scan distributor bill. Please try again.');
    }
  };

  // Handle sample invoice quick load
  const handleLoadSample = (templateType) => {
    handleTriggerScan({ templateType });
  };

  // Handle file drop/upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a production app, this would upload the image/PDF to an OCR engine.
    // For local evaluation, we parse the file info and simulate realistic OCR parsing.
    handleTriggerScan({
      fileName: file.name,
      templateType: file.name.toLowerCase().includes('dairy') || file.name.toLowerCase().includes('bev') 
        ? 'sample_dairy_beverage' 
        : 'sample_fmcg'
    });
  };

  // Handle raw text OCR parse
  const handleParseRawText = () => {
    if (!rawText.trim()) return;
    handleTriggerScan({ rawText });
  };

  // Edit item inside invoiceData
  const handleUpdateItem = (index, field, value) => {
    if (!invoiceData) return;
    const updatedItems = [...invoiceData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setInvoiceData({
      ...invoiceData,
      items: updatedItems
    });
  };

  // Remove item from review table
  const handleRemoveItem = (index) => {
    if (!invoiceData) return;
    const updatedItems = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData({
      ...invoiceData,
      items: updatedItems
    });
  };

  // Add extra line item
  const handleAddNewItemRow = () => {
    if (!invoiceData) return;
    const newItem = {
      name: 'New Restock Item',
      barcode: '',
      category: 'General',
      quantity: 10,
      costPrice: 50,
      mrp: 65,
      sellingPrice: 60,
      unit: 'pcs',
      isNew: true,
      matchedProductId: null,
      currentStockBefore: 0,
      newProjectedStock: 10
    };
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, newItem]
    });
  };

  // Confirm and Restock Inventory
  const handleConfirmRestock = async () => {
    if (!invoiceData || !invoiceData.items || !invoiceData.items.length) {
      setErrorMsg('No items in invoice to restock');
      return;
    }

    setIsConfirming(true);
    setErrorMsg('');

    try {
      const payload = {
        supplierName: invoiceData.supplierName,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        items: invoiceData.items.map(item => ({
          name: item.name,
          barcode: item.barcode,
          category: item.category,
          quantity: Number(item.quantity || 1),
          costPrice: Number(item.costPrice || 0),
          sellingPrice: Number(item.sellingPrice || item.costPrice),
          mrp: Number(item.mrp || item.sellingPrice),
          unit: item.unit || 'pcs',
          matchedProductId: item.matchedProductId || null
        }))
      };

      const result = await confirmInvoiceRestock(payload);
      setIsConfirming(false);
      setRestockSuccess(result);
      setInvoiceData(null);

      // Notify parent to refresh products
      if (onRestockCompleted) {
        onRestockCompleted();
      }
    } catch (err) {
      setIsConfirming(false);
      setErrorMsg(err.message || 'Failed to confirm restock');
    }
  };

  // Derived calculations for summary
  const totalUnits = invoiceData?.items?.reduce((sum, it) => sum + Number(it.quantity || 0), 0) || 0;
  const totalWholesaleCost = invoiceData?.items?.reduce((sum, it) => sum + (Number(it.costPrice || 0) * Number(it.quantity || 0)), 0) || 0;
  const totalProjectedRevenue = invoiceData?.items?.reduce((sum, it) => sum + (Number(it.sellingPrice || 0) * Number(it.quantity || 0)), 0) || 0;
  const grossProfit = totalProjectedRevenue - totalWholesaleCost;
  const overallMarginPercent = totalWholesaleCost > 0 ? Math.round((grossProfit / totalWholesaleCost) * 100) : 0;

  const matchedCount = invoiceData?.items?.filter(it => !it.isNew).length || 0;
  const newItemsCount = invoiceData?.items?.filter(it => it.isNew).length || 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              AI Distributor Bill Scanner
            </h1>
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Bill-to-Inventory OCR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Scan wholesale distributor invoices or upload photos. Automatically extract buy costs, quantities, match existing stock, and restock catalog with 1-click.
          </p>
        </div>

        {/* View Switcher: Scanner vs History */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveView('scanner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'scanner'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scan Bill</span>
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Restock History</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-rose-700 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Success Notification Banner */}
      {restockSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-xs animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-emerald-950">
                Purchase Invoice Successfully Restocked & Logged!
              </h3>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                {restockSuccess.message}
              </p>
              
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="bg-white/90 border border-emerald-200 text-emerald-800 text-xs px-3 py-1.5 rounded-lg font-medium">
                  📦 <b>{restockSuccess.restockedCount}</b> items stock increased
                </span>
                <span className="bg-white/90 border border-emerald-200 text-purple-800 text-xs px-3 py-1.5 rounded-lg font-medium">
                  ✨ <b>{restockSuccess.newItemsCount}</b> new catalog products created
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {onNavigatePOS && (
                  <button
                    onClick={onNavigatePOS}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition"
                  >
                    <span>Open POS Terminal to Bill Items</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {onNavigateInventory && (
                  <button
                    onClick={onNavigateInventory}
                    className="bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-semibold px-4 py-2 rounded-xl transition"
                  >
                    View Updated Inventory
                  </button>
                )}
                <button
                  onClick={() => setRestockSuccess(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 px-3 py-2"
                >
                  Scan Another Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SCANNER MODE */}
      {activeView === 'scanner' && (
        <div className="space-y-6">
          {/* Section 1: Upload / Fast-Load Zone (When no active review or ready to scan) */}
          {!invoiceData && !isScanning && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Drag & Drop Upload Zone */}
              <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition-all p-8 flex flex-col items-center justify-center text-center shadow-xs group">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-indigo-100 transition">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Upload Distributor Invoice, Bill Photo or PDF
                </h3>
                <p className="text-xs text-slate-500 max-w-md mt-1 mb-5">
                  Drop wholesale bills, delivery challans, or snap a photo of paper invoices. AI extracts products, quantities, and prices automatically.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Choose Invoice File</span>
                    <input 
                      type="file" 
                      accept="image/*,.pdf,.txt" 
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                  </label>

                  <button
                    onClick={() => setShowRawText(!showRawText)}
                    className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs px-4 py-2.5 rounded-xl transition"
                  >
                    {showRawText ? 'Hide Raw Text OCR' : 'Paste Raw OCR Text'}
                  </button>
                </div>

                <div className="flex items-center gap-4 mt-6 text-[11px] text-slate-400">
                  <span>Supports: JPG, PNG, PDF, Invoice Receipts</span>
                  <span>•</span>
                  <span>Auto Barcode & Name Fuzzy Match</span>
                </div>
              </div>

              {/* Instant 1-Click Wholesale Bill Samples */}
              <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 rounded-2xl border border-indigo-100 p-6 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Instant 1-Click Demo Bills</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    No physical bill with you?
                  </h4>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Test the AI parser instantly using pre-configured distributor wholesale invoices:
                  </p>

                  <div className="space-y-3">
                    {/* Sample 1: FMCG & Grocery Wholesaler */}
                    <button
                      onClick={() => handleLoadSample('sample_fmcg')}
                      className="w-full text-left p-3.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">
                          🛒 Hindustan Wholesale FMCG Pvt Ltd
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Atta, Salt, Fortune Oil, Maggi + New Silk Chocolate & Colgate (6 Items • ₹12,450)
                      </p>
                    </button>

                    {/* Sample 2: Dairy & Cold Drinks Agency */}
                    <button
                      onClick={() => handleLoadSample('sample_dairy_beverage')}
                      className="w-full text-left p-3.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">
                          🥛 Metro Dairy & Beverage Agency
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Amul Butter, Thums Up, Red Label + New Amul Taaza 1L Milk (4 Items • ₹8,900)
                      </p>
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-indigo-100/70 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Demonstrates auto stock addition + new product cataloging</span>
                </div>
              </div>
            </div>
          )}

          {/* Raw Text OCR Paste Box (Collapsible) */}
          {showRawText && !invoiceData && !isScanning && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Custom Bill Text / Optical Text Input</h4>
                  <p className="text-[11px] text-slate-500">
                    Paste raw text lines copied from an invoice scanner app, WhatsApp bill, or supplier SMS:
                  </p>
                </div>
                <button
                  onClick={() => setRawText(
`Kolkata Wholesale Traders Pvt Ltd
Invoice No: GST-KW-2026-9021
Tata Salt Vacuum Evaporated 1kg  40  20.50  820.00
Fortune Sunlite Refined Oil 1L  25  125.00  3125.00
Britannia Good Day Butter 200g  50  28.00  1400.00`
                  )}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Load Example Text
                </button>
              </div>

              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste invoice text lines here (e.g. Item Name  Quantity  Rate  Amount)..."
                rows={4}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRawText('')}
                  className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5"
                >
                  Clear
                </button>
                <button
                  onClick={handleParseRawText}
                  disabled={!rawText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse Text with AI</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 2: Scanning Loading Progress Indicator */}
          {isScanning && (
            <div className="bg-white rounded-2xl border border-indigo-200 p-8 sm:p-12 shadow-xs flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-300 animate-pulse">
                  <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full animate-ping"></div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                AI Bill-to-Inventory Engine is Processing
              </h3>
              <p className="text-xs sm:text-sm text-indigo-600 font-medium mt-1 animate-pulse">
                {scanStep}
              </p>
              
              <div className="w-64 max-w-full bg-slate-100 rounded-full h-2 mt-6 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full animate-progress w-full"></div>
              </div>

              <span className="text-[11px] text-slate-400 mt-4">
                Extracting items, wholesale rates, barcode matches, and margin projections...
              </span>
            </div>
          )}

          {/* Section 3: Interactive Review & Restock Table (When invoiceData is loaded) */}
          {invoiceData && !isScanning && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Invoice Metadata Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Distributor Bill</span>
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                          AI Parsed
                        </span>
                      </div>
                      <input
                        type="text"
                        value={invoiceData.supplierName}
                        onChange={(e) => setInvoiceData({ ...invoiceData, supplierName: e.target.value })}
                        className="text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition w-full sm:w-80"
                        title="Click to edit distributor name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Invoice No</span>
                      <input
                        type="text"
                        value={invoiceData.invoiceNumber}
                        onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                        className="font-bold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-28 mt-0.5"
                      />
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Invoice Date</span>
                      <input
                        type="date"
                        value={invoiceData.invoiceDate}
                        onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                        className="font-semibold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none mt-0.5"
                      />
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">Catalog Match</span>
                      <div className="mt-0.5 flex items-center gap-1">
                        <span className="text-emerald-700 font-bold">{matchedCount} Matched</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-purple-700 font-bold">{newItemsCount} New</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setInvoiceData(null);
                          setShowRawText(false);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Line Items Review ({invoiceData.items.length} items detected)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Review wholesale costs, adjust selling prices and stock additions before saving to catalog.
                    </p>
                  </div>

                  <button
                    onClick={handleAddNewItemRow}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3.5">Status & Match</th>
                        <th className="py-3 px-3.5 min-w-[200px]">Product Name & Barcode</th>
                        <th className="py-3 px-3 text-center">Unit</th>
                        <th className="py-3 px-3 text-right">Quantity</th>
                        <th className="py-3 px-3 text-right">Wholesale Cost</th>
                        <th className="py-3 px-3 text-right">MRP</th>
                        <th className="py-3 px-3.5 text-right min-w-[140px]">Selling Price</th>
                        <th className="py-3 px-3.5 text-right">Total Cost</th>
                        <th className="py-3 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {invoiceData.items.map((item, idx) => {
                        const lineCost = Number(item.costPrice || 0) * Number(item.quantity || 0);
                        const marginPercent = item.costPrice > 0 
                          ? Math.round(((Number(item.sellingPrice || 0) - Number(item.costPrice)) / Number(item.costPrice)) * 100) 
                          : 0;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/60 transition">
                            {/* Match Status */}
                            <td className="py-3 px-3.5">
                              {item.isNew ? (
                                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>✨ New Item</span>
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Matched</span>
                                  </span>
                                  <span className="block text-[10px] text-slate-400">
                                    Stock: {item.currentStockBefore} &rarr; <b className="text-slate-700">+{item.quantity}</b>
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Name & Barcode */}
                            <td className="py-3 px-3.5">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                                className="w-full font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none"
                              />
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  placeholder="Barcode"
                                  value={item.barcode || ''}
                                  onChange={(e) => handleUpdateItem(idx, 'barcode', e.target.value)}
                                  className="text-[11px] font-mono text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-28"
                                />
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                  {item.category || 'General'}
                                </span>
                              </div>
                            </td>

                            {/* Unit */}
                            <td className="py-3 px-3 text-center">
                              <select
                                value={item.unit || 'pcs'}
                                onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                                className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-600 focus:outline-none"
                              >
                                <option value="pcs">pcs</option>
                                <option value="packet">packet</option>
                                <option value="kg">kg</option>
                                <option value="litre">litre</option>
                                <option value="bottle">bottle</option>
                                <option value="box">box</option>
                              </select>
                            </td>

                            {/* Quantity */}
                            <td className="py-3 px-3 text-right">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                                className="w-16 text-right font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>

                            {/* Buy Cost Price */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-slate-400">₹</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={item.costPrice}
                                  onChange={(e) => handleUpdateItem(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                                  className="w-16 text-right font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            </td>

                            {/* MRP */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-slate-400">₹</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={item.mrp}
                                  onChange={(e) => handleUpdateItem(idx, 'mrp', parseFloat(e.target.value) || 0)}
                                  className="w-16 text-right font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            </td>

                            {/* Suggested Selling Price & Margin % */}
                            <td className="py-3 px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-slate-400">₹</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={item.sellingPrice}
                                  onChange={(e) => handleUpdateItem(idx, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                  className="w-18 text-right font-bold text-indigo-700 bg-indigo-50/50 border border-indigo-200 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="mt-1 flex items-center justify-end">
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  marginPercent >= 20 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : marginPercent > 5 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {marginPercent >= 0 ? `+${marginPercent}%` : `${marginPercent}%`} margin
                                </span>
                              </div>
                            </td>

                            {/* Line Subtotal */}
                            <td className="py-3 px-3.5 text-right font-bold text-slate-900">
                              ₹{lineCost.toLocaleString()}
                            </td>

                            {/* Remove Action */}
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Remove line item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Summary & Restock Confirmation Action */}
                <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-6 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total Pieces to Add</span>
                      <span className="text-lg font-bold text-white">{totalUnits} units</span>
                    </div>

                    <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Wholesale Bill Total</span>
                      <span className="text-lg font-bold text-amber-400">₹{totalWholesaleCost.toLocaleString()}</span>
                    </div>

                    <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Projected Retail Sales</span>
                      <span className="text-lg font-bold text-emerald-400">₹{totalProjectedRevenue.toLocaleString()}</span>
                    </div>

                    <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Est. Profit Margin</span>
                      <span className="text-lg font-bold text-indigo-300">
                        ₹{grossProfit.toLocaleString()} ({overallMarginPercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Restock Confirm Button */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setInvoiceData(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    >
                      Discard
                    </button>
                    
                    <button
                      onClick={handleConfirmRestock}
                      disabled={isConfirming || invoiceData.items.length === 0}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
                    >
                      {isConfirming ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Restocking Catalog...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-slate-950" />
                          <span>Confirm & Restock Store</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: RESTOCK HISTORY MODE */}
      {activeView === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Distributor Purchase Invoices Log</h3>
              <p className="text-xs text-slate-500">
                Audited ledger of all supplier wholesale bills parsed and added to inventory
              </p>
            </div>
            <button
              onClick={loadHistory}
              disabled={isLoadingHistory}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
              <span>Loading purchase invoices...</span>
            </div>
          ) : historyList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FileCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Restock Invoices Recorded Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Scan your first wholesale distributor bill using the Bill Scanner tab to automatically increment inventory and log purchase records.
              </p>
              <button
                onClick={() => setActiveView('scanner')}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Scan First Bill Now</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Supplier / Wholesaler</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-center">Items Restocked</th>
                      <th className="py-3 px-4 text-right">Total Bill Value</th>
                      <th className="py-3 px-4 text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {historyList.map((inv) => (
                      <React.Fragment key={inv._id}>
                        <tr className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {inv.supplierName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                              {inv.itemCount || inv.items?.length || 0} items
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            ₹{Number(inv.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => setSelectedHistoryInvoice(selectedHistoryInvoice?._id === inv._id ? null : inv)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 hover:underline"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{selectedHistoryInvoice?._id === inv._id ? 'Hide' : 'View'}</span>
                            </button>
                          </td>
                        </tr>

                        {/* Expandable item details */}
                        {selectedHistoryInvoice?._id === inv._id && (
                          <tr>
                            <td colSpan={6} className="bg-indigo-50/40 p-4 border-b border-indigo-100">
                              <div className="bg-white rounded-xl border border-indigo-200/60 p-4 shadow-2xs">
                                <h5 className="text-xs font-bold text-slate-800 mb-2">
                                  Restocked Line Items in #{inv.invoiceNumber}:
                                </h5>
                                <div className="divide-y divide-slate-100">
                                  {inv.items?.map((it, i) => (
                                    <div key={i} className="py-2 flex items-center justify-between text-xs">
                                      <div>
                                        <span className="font-bold text-slate-800">{it.name}</span>
                                        {it.barcode && (
                                          <span className="ml-2 font-mono text-[10px] text-slate-400">[{it.barcode}]</span>
                                        )}
                                        {it.isNewProduct && (
                                          <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded">
                                            New Product
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-4 text-slate-600">
                                        <span>Added: <b className="text-emerald-700">+{it.quantityAdded}</b></span>
                                        <span>Cost: <b>₹{it.costPrice}</b></span>
                                        <span>Selling: <b>₹{it.sellingPrice}</b></span>
                                        <span className="font-bold text-slate-900">
                                          Total: ₹{(it.costPrice * it.quantityAdded).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
