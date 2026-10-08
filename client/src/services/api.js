// Initial starter grocery & retail catalog for immediate local testing
export const INITIAL_PRODUCTS = [
  { _id: 'p1', barcode: '890103000001', name: 'Aashirvaad Shudh Chakki Atta 5kg', category: 'Staples', costPrice: 210, sellingPrice: 245, mrp: 260, currentStock: 24, minStockAlert: 5, unit: 'packet' },
  { _id: 'p2', barcode: '890103000002', name: 'Tata Salt Vacuum Evaporated 1kg', category: 'Staples', costPrice: 22, sellingPrice: 28, mrp: 28, currentStock: 45, minStockAlert: 10, unit: 'packet' },
  { _id: 'p3', barcode: '890103000003', name: 'Fortune Sunlite Refined Oil 1L', category: 'Oils & Ghee', costPrice: 130, sellingPrice: 148, mrp: 160, currentStock: 18, minStockAlert: 6, unit: 'packet' },
  { _id: 'p4', barcode: '890103000004', name: 'Maggi 2-Minute Masala Noodles 70g', category: 'Snacks', costPrice: 11.5, sellingPrice: 14, mrp: 14, currentStock: 80, minStockAlert: 20, unit: 'packet' },
  { _id: 'p5', barcode: '890103000005', name: 'Amul Butter 100g', category: 'Dairy', costPrice: 50, sellingPrice: 56, mrp: 58, currentStock: 12, minStockAlert: 5, unit: 'pcs' },
  { _id: 'p6', barcode: '890103000006', name: 'Parle-G Glucose Biscuits 250g', category: 'Snacks', costPrice: 25, sellingPrice: 30, mrp: 30, currentStock: 40, minStockAlert: 10, unit: 'packet' },
  { _id: 'p7', barcode: '890103000007', name: 'Thums Up Soft Drink Can 300ml', category: 'Beverages', costPrice: 32, sellingPrice: 40, mrp: 40, currentStock: 30, minStockAlert: 8, unit: 'pcs' },
  { _id: 'p8', barcode: '890103000008', name: 'Dettol Original Soap 75g', category: 'Personal Care', costPrice: 34, sellingPrice: 42, mrp: 45, currentStock: 25, minStockAlert: 5, unit: 'pcs' },
  { _id: 'p9', barcode: '890103000009', name: 'Brooke Bond Red Label Tea 250g', category: 'Beverages', costPrice: 110, sellingPrice: 130, mrp: 140, currentStock: 4, minStockAlert: 5, unit: 'packet' }, // Low stock sample
  { _id: 'p10', barcode: '890103000010', name: 'Surf Excel Quick Wash Powder 1kg', category: 'Household', costPrice: 125, sellingPrice: 145, mrp: 155, currentStock: 15, minStockAlert: 5, unit: 'packet' }
];

export const INITIAL_CUSTOMERS = [
  {
    _id: 'c1',
    name: 'Ramesh Verma',
    phone: '9876543210',
    address: 'Near Shiv Mandir, Ward 4',
    creditBalance: 850,
    creditLimit: 5000,
    transactions: [
      { type: 'PURCHASE_CREDIT', amount: 850, notes: 'Invoice #INV-20260925-0012', date: '2026-09-25T11:20:00Z' }
    ]
  },
  {
    _id: 'c2',
    name: 'Pooja Sharma',
    phone: '9812345678',
    address: 'House #42, Main Road',
    creditBalance: 320,
    creditLimit: 3000,
    transactions: [
      { type: 'PURCHASE_CREDIT', amount: 320, notes: 'Invoice #INV-20260927-0034', date: '2026-09-27T17:45:00Z' }
    ]
  }
];

const LOCAL_STORAGE_KEY_PRODUCTS = 'pos_local_products';
const LOCAL_STORAGE_KEY_ORDERS = 'pos_local_orders';
const LOCAL_STORAGE_KEY_CUSTOMERS = 'pos_local_customers';
const LOCAL_STORAGE_KEY_STORE = 'pos_local_store';

// Helper to seed localStorage
const getLocalData = (key, fallback) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return fallback;
  }
};

export const AUTH_TOKEN_KEY = 'pos_auth_token';
export const AUTH_USER_KEY = 'pos_auth_user';

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const getCurrentUser = () => {
  const data = localStorage.getItem(AUTH_USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const apiUrl = (path) => `${API_BASE}${path}`;

export const loginUser = async ({ email, password }) => {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }
  // If 2FA is required, return challenge details without setting token yet
  if (data.twoFactorRequired) {
    return data;
  }
  if (data.token && data.store) {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.store));
    localStorage.setItem(LOCAL_STORAGE_KEY_STORE, JSON.stringify(data.store));
  }
  return data;
};

export const verifyTwoFactorOtp = async ({ tempToken, otp }) => {
  const res = await fetch(apiUrl('/api/auth/verify-2fa'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken, otp })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Verification failed');
  }
  if (data.token && data.store) {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.store));
    localStorage.setItem(LOCAL_STORAGE_KEY_STORE, JSON.stringify(data.store));
  }
  return data;
};

export const resendTwoFactorOtp = async ({ tempToken }) => {
  const res = await fetch(apiUrl('/api/auth/resend-2fa-otp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to resend code');
  }
  return data;
};

export const requestPasswordReset = async ({ identifier }) => {
  const res = await fetch(apiUrl('/api/auth/forgot-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to request reset code');
  }
  return data;
};

export const verifyPasswordResetOtp = async ({ identifier, otp }) => {
  const res = await fetch(apiUrl('/api/auth/verify-reset-otp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, otp })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Invalid verification code');
  }
  return data;
};

export const resetPasswordWithOtp = async ({ identifier, otp, newPassword }) => {
  const res = await fetch(apiUrl('/api/auth/reset-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, otp, newPassword })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to reset password');
  }
  return data;
};

export const requestTwoFactorSetup = async () => {
  const res = await fetch(apiUrl('/api/auth/2fa/request-setup'), {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to request 2FA setup');
  }
  return data;
};

export const confirmTwoFactorEnable = async ({ otp }) => {
  const res = await fetch(apiUrl('/api/auth/2fa/confirm-enable'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ otp })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to enable Two-Step Authentication');
  }
  if (data.store) {
    const curr = getCurrentUser() || {};
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ ...curr, ...data.store }));
    localStorage.setItem(LOCAL_STORAGE_KEY_STORE, JSON.stringify({ ...curr, ...data.store }));
  }
  return data;
};

export const disableTwoFactor = async ({ password }) => {
  const res = await fetch(apiUrl('/api/auth/2fa/disable'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to disable Two-Step Authentication');
  }
  if (data.store) {
    const curr = getCurrentUser() || {};
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ ...curr, ...data.store }));
    localStorage.setItem(LOCAL_STORAGE_KEY_STORE, JSON.stringify({ ...curr, ...data.store }));
  }
  return data;
};

export const registerUser = async (registrationData) => {
  const res = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  if (data.token && data.store) {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.store));
    localStorage.setItem(LOCAL_STORAGE_KEY_STORE, JSON.stringify(data.store));
  }
  return data;
};

export const logoutUser = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const getStoreProfile = () => {
  const user = getCurrentUser();
  if (user && user.storeName) {
    return {
      discountPresets: [0, 5, 10],
      ...user
    };
  }
  return getLocalData(LOCAL_STORAGE_KEY_STORE, {
    storeName: 'Apna Super Mart',
    ownerName: 'Sunil Kumar',
    phone: '9876500000',
    discountPresets: [0, 5, 10],
    address: { street: 'Station Road, Market Yard', city: 'Local Town', state: 'WB', pincode: '700001' },
    taxId: '19ABCDE1234F1Z5',
    currencySymbol: '₹',
    receiptSettings: {
      headerMessage: 'Apna Super Mart - Quality & Savings Daily',
      footerMessage: 'Thank you for shopping local! Visit again.',
      showBarcodeOnReceipt: true
    }
  });
};

export const fetchStoreProfile = async () => {
  try {
    const res = await fetch(apiUrl('/api/auth/profile'), {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(LOCAL_STORAGE_KEY_STORE, JSON.stringify(data));
      const curr = getCurrentUser();
      if (curr) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ ...curr, ...data }));
      }
      return data;
    }
  } catch (err) {}
  return getStoreProfile();
};

export const updateStoreProfile = async (newProfile) => {
  try {
    const res = await fetch(apiUrl('/api/auth/profile'), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(newProfile)
    });
    if (res.ok) {
      const data = await res.json();
      const updated = data.store;
      localStorage.setItem(LOCAL_STORAGE_KEY_STORE, JSON.stringify(updated));
      const curr = getCurrentUser();
      if (curr) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ ...curr, ...updated }));
      }
      return updated;
    }
  } catch (err) {}

  const current = getStoreProfile();
  const merged = { ...current, ...newProfile };
  localStorage.setItem(LOCAL_STORAGE_KEY_STORE, JSON.stringify(merged));
  const curr = getCurrentUser();
  if (curr) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ ...curr, ...merged }));
  }
  return merged;
};

// API Services with automatic offline/local storage fallback
export const fetchProducts = async () => {
  try {
    const res = await fetch(apiUrl('/api/products'), {
      headers: getAuthHeaders()
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // Backend offline, fallback to local storage
  }
  return getLocalData(LOCAL_STORAGE_KEY_PRODUCTS, INITIAL_PRODUCTS);
};

export const saveProduct = async (product) => {
  try {
    const res = await fetch(apiUrl('/api/products'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(product)
    });
    if (res.ok) {
      const data = await res.json();
      return data.product;
    }
  } catch (err) {}

  // Local storage fallback
  const products = getLocalData(LOCAL_STORAGE_KEY_PRODUCTS, INITIAL_PRODUCTS);
  const newProduct = {
    ...product,
    _id: 'p_' + Date.now(),
    currentStock: Number(product.currentStock || 0),
    costPrice: Number(product.costPrice || 0),
    sellingPrice: Number(product.sellingPrice || 0),
    minStockAlert: Number(product.minStockAlert || 5)
  };
  products.unshift(newProduct);
  localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  return newProduct;
};

export const updateProductStock = async (id, stockDelta) => {
  const products = getLocalData(LOCAL_STORAGE_KEY_PRODUCTS, INITIAL_PRODUCTS);
  const prod = products.find(p => p._id === id);
  const newStock = Math.max(0, (prod ? prod.currentStock : 0) + stockDelta);

  try {
    const res = await fetch(apiUrl(`/api/products/${id}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentStock: newStock })
    });
    if (res.ok) {
      const data = await res.json();
      if (prod) {
        prod.currentStock = data.product.currentStock;
        localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(products));
      }
      return data.product;
    }
  } catch (err) {}

  const idx = products.findIndex(p => p._id === id);
  if (idx !== -1) {
    products[idx].currentStock = newStock;
    localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }
};

export const fetchCustomers = async () => {
  try {
    const res = await fetch(apiUrl('/api/customers'), {
      headers: getAuthHeaders()
    });
    if (res.ok) return await res.json();
  } catch (err) {}
  return getLocalData(LOCAL_STORAGE_KEY_CUSTOMERS, INITIAL_CUSTOMERS);
};

export const saveCustomer = async (customer) => {
  try {
    const res = await fetch(apiUrl('/api/customers'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customer)
    });
    if (res.ok) {
      const data = await res.json();
      return data.customer;
    }
  } catch (err) {}

  const customers = getLocalData(LOCAL_STORAGE_KEY_CUSTOMERS, INITIAL_CUSTOMERS);
  const newCustomer = {
    ...customer,
    _id: 'c_' + Date.now(),
    creditBalance: 0,
    transactions: []
  };
  customers.unshift(newCustomer);
  localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
  return newCustomer;
};

export const recordCustomerPayment = async (customerId, amount, paymentMode, notes, date) => {
  try {
    const res = await fetch(apiUrl(`/api/customers/${customerId}/pay`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        amount: Number(amount),
        paymentMode: paymentMode || 'Cash',
        notes: notes || '',
        date: date || new Date().toISOString()
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data.customer;
    }
  } catch (err) {}

  const customers = getLocalData(LOCAL_STORAGE_KEY_CUSTOMERS, INITIAL_CUSTOMERS);
  const cust = customers.find(c => c._id === customerId);
  if (cust) {
    cust.creditBalance = Math.max(0, cust.creditBalance - Number(amount));
    cust.transactions = cust.transactions || [];
    cust.transactions.push({
      type: 'PAYMENT_RECEIVED',
      amount: Number(amount),
      paymentMode: paymentMode || 'Cash',
      notes: notes || `Received via ${paymentMode || 'Cash'}`,
      balanceAfter: cust.creditBalance,
      date: date ? new Date(date).toISOString() : new Date().toISOString()
    });
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    return cust;
  }
  return null;
};

export const recordCustomerCredit = async (customerId, amount, notes, date) => {
  try {
    const res = await fetch(apiUrl(`/api/customers/${customerId}/credit`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        amount: Number(amount),
        notes: notes || 'Credit purchase',
        date: date || new Date().toISOString()
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data.customer;
    }
  } catch (err) {}

  const customers = getLocalData(LOCAL_STORAGE_KEY_CUSTOMERS, INITIAL_CUSTOMERS);
  const cust = customers.find(c => c._id === customerId);
  if (cust) {
    cust.creditBalance = (cust.creditBalance || 0) + Number(amount);
    cust.transactions = cust.transactions || [];
    cust.transactions.push({
      type: 'PURCHASE_CREDIT',
      amount: Number(amount),
      notes: notes || 'Credit purchase',
      balanceAfter: cust.creditBalance,
      date: date ? new Date(date).toISOString() : new Date().toISOString()
    });
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    return cust;
  }
  return null;
};

export const submitOrder = async (orderData) => {
  try {
    const res = await fetch(apiUrl('/api/orders'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData)
    });
    if (res.ok) {
      const data = await res.json();
      return data.order;
    }
  } catch (err) {}

  // Local storage fallback
  const orders = getLocalData(LOCAL_STORAGE_KEY_ORDERS, []);
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const invoiceNumber = `INV-${today}-${String(orders.length + 1).padStart(4, '0')}`;

  const createdOrder = {
    ...orderData,
    _id: 'ord_' + Date.now(),
    invoiceNumber,
    createdAt: new Date().toISOString()
  };

  orders.unshift(createdOrder);
  localStorage.setItem(LOCAL_STORAGE_KEY_ORDERS, JSON.stringify(orders));

  // Decrement product stock in local storage
  const products = getLocalData(LOCAL_STORAGE_KEY_PRODUCTS, INITIAL_PRODUCTS);
  orderData.items.forEach(item => {
    const p = products.find(prod => prod._id === item.productId);
    if (p) {
      p.currentStock = Math.max(0, p.currentStock - Number(item.quantity));
    }
  });
  localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(products));

  // If Khata credit, update customer balance
  if (orderData.paymentMethod === 'CREDIT_KHATA' && orderData.customerPhone) {
    const customers = getLocalData(LOCAL_STORAGE_KEY_CUSTOMERS, INITIAL_CUSTOMERS);
    let cust = customers.find(c => c.phone === orderData.customerPhone);
    if (!cust) {
      cust = {
        _id: 'c_' + Date.now(),
        name: orderData.customerName || 'Valued Customer',
        phone: orderData.customerPhone,
        creditBalance: 0,
        transactions: []
      };
      customers.push(cust);
    }
    cust.creditBalance += Number(orderData.grandTotal);
    cust.transactions = cust.transactions || [];
    cust.transactions.push({
      type: 'PURCHASE_CREDIT',
      amount: Number(orderData.grandTotal),
      notes: `Invoice #${invoiceNumber}`,
      balanceAfter: cust.creditBalance,
      date: new Date().toISOString()
    });
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
  }

  return createdOrder;
};

export const fetchOrders = async () => {
  try {
    const res = await fetch(apiUrl('/api/orders'), {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return data.orders || [];
    }
  } catch (err) {}
  return getLocalData(LOCAL_STORAGE_KEY_ORDERS, []);
};

// Super Admin SaaS Platform APIs
export const fetchSuperAdminOverview = async () => {
  try {
    const res = await fetch(apiUrl('/api/super-admin/overview'), {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error fetching super admin stats:', err);
  }
  return null;
};

export const updateStoreStatus = async (storeId, updates) => {
  try {
    const res = await fetch(apiUrl(`/api/super-admin/stores/${storeId}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error updating store:', err);
  }
  return null;
};

export const createOrganization = async (orgData) => {
  try {
    const res = await fetch(apiUrl('/api/super-admin/stores'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orgData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error creating organization:', err);
  }
  return null;
};

// AI Invoice & Distributor Bill OCR APIs
export const scanDistributorInvoice = async ({ templateType, rawText, fileName }) => {
  const res = await fetch(apiUrl('/api/products/scan-invoice'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ templateType, rawText, fileName })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to scan invoice');
  }
  return data.data;
};

export const confirmInvoiceRestock = async (payload) => {
  const res = await fetch(apiUrl('/api/products/confirm-invoice-restock'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to restock invoice items');
  }
  return data;
};

export const fetchPurchaseInvoices = async () => {
  try {
    const res = await fetch(apiUrl('/api/products/purchase-invoices'), {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error fetching purchase invoices:', err);
  }
  return [];
};
