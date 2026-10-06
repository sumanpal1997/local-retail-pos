import React, { useState } from 'react';
import { Package, Plus, Search, AlertTriangle, ArrowUpDown, Filter, Barcode, Sparkles } from 'lucide-react';

export default function Inventory({ products, onAddProduct, onUpdateStock, storeInfo, onOpenAIScanner }) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'LOW_STOCK'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    barcode: '',
    category: 'Staples',
    costPrice: '',
    sellingPrice: '',
    mrp: '',
    currentStock: '',
    minStockAlert: 5,
    unit: 'pcs'
  });

  const categories = ['Staples', 'Snacks', 'Beverages', 'Dairy', 'Personal Care', 'Household', 'Oils & Ghee', 'General'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(search));
    const isLow = p.currentStock <= p.minStockAlert;
    if (filterMode === 'LOW_STOCK') return matchesSearch && isLow;
    return matchesSearch;
  });

  const lowStockCount = products.filter(p => p.currentStock <= p.minStockAlert).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.costPrice || !newProduct.sellingPrice) return;

    onAddProduct(newProduct);
    setIsAddModalOpen(false);
    setNewProduct({
      name: '',
      barcode: '',
      category: 'Staples',
      costPrice: '',
      sellingPrice: '',
      mrp: '',
      currentStock: '',
      minStockAlert: 5,
      unit: 'pcs'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory & Stock Catalog</h1>
          <p className="text-xs text-slate-500">
            Manage your items, barcodes, cost vs selling prices, and reorder alerts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenAIScanner && (
            <button
              onClick={onOpenAIScanner}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition"
              title="Auto-restock inventory from wholesale bill photos or PDFs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Bill Scanner</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-emerald-200 transition"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Stats Summary & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Products</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{products.length}</p>
        </div>

        <div 
          onClick={() => setFilterMode(filterMode === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filterMode === 'LOW_STOCK'
              ? 'bg-amber-100 border-amber-300'
              : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-900 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Low Stock Alerts
            </span>
            {filterMode === 'LOW_STOCK' && (
              <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-bold">Active Filter</span>
            )}
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-1">{lowStockCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Stock Quantity</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {products.reduce((acc, p) => acc + (p.currentStock || 0), 0)} units
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              filterMode === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilterMode('LOW_STOCK')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              filterMode === 'LOW_STOCK'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            Low Stock Only ({lowStockCount})
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Barcode</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-right">Margin</th>
                <th className="px-4 py-3 text-center">In Stock</th>
                <th className="px-4 py-3 text-center">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minStockAlert;
                  const marginPct = p.sellingPrice > 0 
                    ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100) 
                    : 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {p.name}
                        {isLow && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {p.barcode ? (
                          <span className="flex items-center gap-1">
                            <Barcode className="w-3.5 h-3.5 text-slate-400" /> {p.barcode}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 font-medium">
                        {storeInfo?.currencySymbol || '₹'}{p.costPrice}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {storeInfo?.currencySymbol || '₹'}{p.sellingPrice}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        {marginPct}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold px-2 py-0.5 rounded ${
                          isLow ? 'bg-amber-100 text-amber-800' : 'text-slate-800'
                        }`}>
                          {p.currentStock} {p.unit || 'pcs'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onUpdateStock(p._id, -1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-bold flex items-center justify-center transition"
                            title="Decrement 1"
                          >
                            -
                          </button>
                          <button
                            onClick={() => onUpdateStock(p._id, 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-700 font-bold flex items-center justify-center transition"
                            title="Increment 1"
                          >
                            +
                          </button>
                          <button
                            onClick={() => onUpdateStock(p._id, 10)}
                            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition"
                            title="Add Box (+10)"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-4">Add Product to Inventory</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fortune Mustard Oil 1L"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Barcode / SKU</label>
                  <input
                    type="text"
                    placeholder="Scan or enter code"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Buy price"
                    value={newProduct.costPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Sale price"
                    value={newProduct.sellingPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    placeholder="Printed MRP"
                    value={newProduct.mrp}
                    onChange={(e) => setNewProduct({ ...newProduct, mrp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Starting Stock</label>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={newProduct.currentStock}
                    onChange={(e) => setNewProduct({ ...newProduct, currentStock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    value={newProduct.minStockAlert}
                    onChange={(e) => setNewProduct({ ...newProduct, minStockAlert: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="packet">Packet</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="ltr">Liter (ltr)</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
