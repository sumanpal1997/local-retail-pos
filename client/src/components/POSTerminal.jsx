import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  QrCode, 
  Banknote, 
  BookOpen, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Percent,
  Receipt,
  Settings2,
  Edit3,
  X,
  Check
} from 'lucide-react';

export default function POSTerminal({ products, onOrderCompleted, storeInfo, onUpdateStoreInfo }) {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashTendered, setCashTendered] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  // Customizable discount presets state
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isCustomDiscountOpen, setIsCustomDiscountOpen] = useState(false);
  const [customDiscountInput, setCustomDiscountInput] = useState('');
  const [isSavingPresets, setIsSavingPresets] = useState(false);

  const rawPresets = storeInfo?.discountPresets && storeInfo.discountPresets.length > 0 
    ? storeInfo.discountPresets 
    : [0, 5, 10];
  const activeDiscountPresets = rawPresets.includes(0) ? rawPresets : [0, ...rawPresets];

  const [presetSlot1, setPresetSlot1] = useState('5');
  const [presetSlot2, setPresetSlot2] = useState('10');
  const [presetSlot3, setPresetSlot3] = useState('15');
  const [presetSlot4, setPresetSlot4] = useState('');

  useEffect(() => {
    const nonZero = rawPresets.filter(p => p > 0);
    setPresetSlot1(nonZero[0] !== undefined ? String(nonZero[0]) : '5');
    setPresetSlot2(nonZero[1] !== undefined ? String(nonZero[1]) : '10');
    setPresetSlot3(nonZero[2] !== undefined ? String(nonZero[2]) : '15');
    setPresetSlot4(nonZero[3] !== undefined ? String(nonZero[3]) : '');
  }, [storeInfo?.discountPresets]);

  const handleSaveDiscountPresets = async (e) => {
    e?.preventDefault();
    const values = [presetSlot1, presetSlot2, presetSlot3, presetSlot4]
      .map(v => Number(v))
      .filter(v => !isNaN(v) && v > 0 && v <= 100);

    const uniqueSorted = [0, ...new Set(values)].sort((a, b) => a - b);

    try {
      setIsSavingPresets(true);
      if (onUpdateStoreInfo) {
        await onUpdateStoreInfo({
          ...storeInfo,
          discountPresets: uniqueSorted
        });
      }
      setIsDiscountModalOpen(false);
      setMessage({ type: 'success', text: `Discount buttons updated: ${uniqueSorted.map(p => p + '%').join(', ')}` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not update discount buttons' });
    } finally {
      setIsSavingPresets(false);
    }
  };

  const applyPresetTemplate = (p1, p2, p3, p4 = '') => {
    setPresetSlot1(String(p1));
    setPresetSlot2(String(p2));
    setPresetSlot3(String(p3));
    setPresetSlot4(p4 ? String(p4) : '');
  };

  const barcodeInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Extract unique categories
  const categories = ['All', ...new Set(products.map(p => p.category || 'General'))];

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  // Handle barcode scanning via Enter key or scanner device
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(p => p.barcode === barcodeInput.trim());
    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
      setMessage({ type: 'success', text: `Added ${matched.name}` });
    } else {
      setMessage({ type: 'error', text: `No item found with barcode "${barcodeInput}"` });
    }
  };

  const addToCart = (product) => {
    if (product.currentStock <= 0) {
      setMessage({ type: 'error', text: `"${product.name}" is out of stock!` });
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          setMessage({ type: 'error', text: `Cannot exceed available stock (${product.currentStock})` });
          return prevCart;
        }
        return prevCart.map(item =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            productId: product._id,
            name: product.name,
            barcode: product.barcode,
            unitPrice: product.sellingPrice,
            costPrice: product.costPrice,
            quantity: 1,
            unit: product.unit,
            totalPrice: product.sellingPrice
          }
        ];
      }
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prevCart => {
      return prevCart
        .map(item => {
          if (item.productId === productId) {
            const product = products.find(p => p._id === productId);
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (product && newQty > product.currentStock) {
              setMessage({ type: 'error', text: `Max available stock is ${product.currentStock}` });
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice
            };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCashTendered('');
    setDiscountPercent(0);
    setMessage(null);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const cashChange = cashTendered ? Math.max(0, Number(cashTendered) - grandTotal) : 0;

  // Checkout submission
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'CREDIT_KHATA' && !customerPhone.trim()) {
      setMessage({ type: 'error', text: 'Customer Phone number is required for Khata (Credit) sales' });
      return;
    }

    setIsProcessing(true);
    try {
      const orderPayload = {
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        items: cart,
        subtotal,
        totalDiscount: discountAmount,
        taxAmount: 0,
        grandTotal,
        paymentMethod,
        paymentDetails: {
          cashReceived: paymentMethod === 'CASH' ? Number(cashTendered || grandTotal) : 0,
          changeReturned: paymentMethod === 'CASH' ? cashChange : 0
        }
      };

      await onOrderCompleted(orderPayload);
      clearCart();
    } catch (err) {
      setMessage({ type: 'error', text: 'Checkout failed. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard shortcut support: F2 to search, F4 for Cash, Esc to clear
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-5rem)]">
      {/* LEFT: Product Catalog & Fast Search (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {/* Top Controls: Barcode Scanner & Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
          {/* Barcode Quick Input */}
          <form onSubmit={handleBarcodeSubmit} className="relative sm:w-1/3">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan Barcode (Enter)"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </form>

          {/* Product Name Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search items by name or category (F2)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notification Alert */}
        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between transition-all ${
              message.type === 'error'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xs font-bold px-1">✕</button>
          </div>
        )}

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100vh-16rem)] pr-1">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.currentStock <= 0;
            const isLowStock = p.currentStock > 0 && p.currentStock <= p.minStockAlert;

            return (
              <div
                key={p._id}
                onClick={() => !isOutOfStock && addToCart(p)}
                className={`group bg-white p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between select-none ${
                  isOutOfStock
                    ? 'opacity-50 border-slate-200 cursor-not-allowed'
                    : 'border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer active:scale-98'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {p.category}
                    </span>
                    {isOutOfStock ? (
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        Out of stock
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        {p.currentStock} left
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500">
                        Stock: {p.currentStock}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition">
                    {p.name}
                  </h3>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-slate-900 text-base">
                      {storeInfo?.currencySymbol || '₹'}{p.sellingPrice}
                    </span>
                    {p.mrp && p.mrp > p.sellingPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        {storeInfo?.currencySymbol || '₹'}{p.mrp}
                      </span>
                    )}
                  </div>
                  <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold group-hover:bg-emerald-600 group-hover:text-white transition">
                    +
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Active Cart & Checkout Panel (5 cols) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Current Cart</h2>
            <p className="text-xs text-slate-500">{cart.length} item{cart.length !== 1 ? 's' : ''} added</p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Cart
            </button>
          )}
        </div>

        {/* Customer Info (Optional for Cash, Required for Khata) */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2">
          <div className="relative flex-1">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="relative flex-1">
            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="tel"
              placeholder="Phone (WhatsApp/Khata)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Cart Item Rows */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[180px] max-h-[300px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
              <Receipt className="w-12 h-12 stroke-[1.25] text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">Cart is empty</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                Scan a barcode or tap products from the left to start billing
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex-1 pr-2">
                  <h4 className="font-medium text-slate-800 text-xs leading-tight line-clamp-1">{item.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    {storeInfo?.currencySymbol || '₹'}{item.unitPrice} × {item.quantity}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-semibold text-slate-800 text-xs w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Total & Remove */}
                <div className="flex items-center gap-2 pl-3">
                  <span className="font-bold text-slate-900 text-xs w-14 text-right">
                    {storeInfo?.currencySymbol || '₹'}{item.totalPrice}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-slate-300 hover:text-rose-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary & Payment Modes */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          {/* Discount & Subtotal */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">{storeInfo?.currencySymbol || '₹'}{subtotal}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Percent className="w-3 h-3 text-slate-400" /> Discount
              </span>
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {activeDiscountPresets.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDiscountPercent(d);
                      setIsCustomDiscountOpen(false);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                      discountPercent === d && !isCustomDiscountOpen
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {d}%
                  </button>
                ))}

                {/* Custom discount button or inline input */}
                {isCustomDiscountOpen ? (
                  <div className="flex items-center gap-0.5 bg-white border border-emerald-500 rounded px-1 py-0.5">
                    <input
                      type="number"
                      autoFocus
                      min="0"
                      max="100"
                      placeholder="%"
                      value={customDiscountInput}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                        setCustomDiscountInput(e.target.value);
                        setDiscountPercent(val);
                      }}
                      className="w-8 text-[10px] font-bold text-center focus:outline-none"
                    />
                    <span className="text-[9px] text-slate-400">%</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomDiscountOpen(false)}
                      className="text-slate-400 hover:text-slate-600 ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDiscountOpen(true);
                      setCustomDiscountInput(
                        discountPercent > 0 && !activeDiscountPresets.includes(discountPercent)
                          ? String(discountPercent)
                          : ''
                      );
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition border ${
                      discountPercent > 0 && !activeDiscountPresets.includes(discountPercent)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                    title="Enter custom discount percentage"
                  >
                    {discountPercent > 0 && !activeDiscountPresets.includes(discountPercent)
                      ? `${discountPercent}%`
                      : 'Custom'}
                  </button>
                )}

                {/* Settings / Customize button */}
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(true)}
                  className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                  title="Customize Store Discount Buttons"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>

                {discountAmount > 0 && (
                  <span className="text-emerald-600 font-bold ml-1 text-xs whitespace-nowrap">
                    -{storeInfo?.currencySymbol || '₹'}{discountAmount}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total</span>
              <span className="text-emerald-700">{storeInfo?.currencySymbol || '₹'}{grandTotal}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'UPI_QR', label: 'UPI / QR', icon: QrCode },
                { id: 'CARD', label: 'Card', icon: CreditCard },
                { id: 'CREDIT_KHATA', label: 'Khata', icon: BookOpen },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tendered & Change calculator (Visible when Cash selected) */}
          {paymentMethod === 'CASH' && (
            <div className="flex items-center gap-2 pt-1 text-xs">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Cash Received (₹)"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              {cashTendered && Number(cashTendered) >= grandTotal && (
                <div className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-bold text-xs">
                  Change: {storeInfo?.currencySymbol || '₹'}{cashChange}
                </div>
              )}
            </div>
          )}

          {/* Complete Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              cart.length === 0 || isProcessing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 active:scale-99'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            {isProcessing ? 'Processing Sale...' : `Charge ${storeInfo?.currencySymbol || '₹'}${grandTotal}`}
          </button>
        </div>
      </div>

      {/* Customize Discount Presets Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Customize Discount Buttons</h3>
                  <p className="text-[11px] text-slate-500">For {storeInfo?.storeName || 'your store'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiscountPresets} className="space-y-4 pt-3 text-xs">
              {/* Quick Preset Templates */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quick Industry Templates
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate(3, 5, 7)}
                    className="p-2 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg transition"
                  >
                    <div className="font-bold text-slate-800 text-xs">3%, 5%, 7%</div>
                    <div className="text-[10px] text-slate-500">Daily Grocery & Sweets</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate(5, 10, 15)}
                    className="p-2 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg transition"
                  >
                    <div className="font-bold text-slate-800 text-xs">5%, 10%, 15%</div>
                    <div className="text-[10px] text-slate-500">General Retail & FMCG</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate(2, 5, 10)}
                    className="p-2 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg transition"
                  >
                    <div className="font-bold text-slate-800 text-xs">2%, 5%, 10%</div>
                    <div className="text-[10px] text-slate-500">Supermarket / Mart</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate(10, 15, 20)}
                    className="p-2 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg transition"
                  >
                    <div className="font-bold text-slate-800 text-xs">10%, 15%, 20%</div>
                    <div className="text-[10px] text-slate-500">Fashion & Seasonal</div>
                  </button>
                </div>
              </div>

              {/* Custom Percentage Slots */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Or Set Custom Percentages (%)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Button 1</span>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="3"
                        value={presetSlot1}
                        onChange={(e) => setPresetSlot1(e.target.value)}
                        className="w-full pl-2 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Button 2</span>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="5"
                        value={presetSlot2}
                        onChange={(e) => setPresetSlot2(e.target.value)}
                        className="w-full pl-2 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Button 3</span>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="7"
                        value={presetSlot3}
                        onChange={(e) => setPresetSlot3(e.target.value)}
                        className="w-full pl-2 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Button 4</span>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="Opt"
                        value={presetSlot4}
                        onChange={(e) => setPresetSlot4(e.target.value)}
                        className="w-full pl-2 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Note: 0% (No discount) is always included automatically.</p>
              </div>

              {/* Live Preview */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Preview on your POS Screen:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white">0%</span>
                  {[presetSlot1, presetSlot2, presetSlot3, presetSlot4].filter(Boolean).map((p, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-300 text-slate-700">
                      {p}%
                    </span>
                  ))}
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-300 text-slate-500">Custom</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPresets}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSavingPresets ? 'Saving...' : 'Save For Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
