const bcrypt = require('bcryptjs');
const Store = require('./models/Store');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Order = require('./models/Order');

const INITIAL_PRODUCTS = [
  { barcode: '890103000001', name: 'Aashirvaad Shudh Chakki Atta 5kg', category: 'Staples', costPrice: 210, sellingPrice: 245, mrp: 260, currentStock: 24, minStockAlert: 5, unit: 'packet' },
  { barcode: '890103000002', name: 'Tata Salt Vacuum Evaporated 1kg', category: 'Staples', costPrice: 22, sellingPrice: 28, mrp: 28, currentStock: 45, minStockAlert: 10, unit: 'packet' },
  { barcode: '890103000003', name: 'Fortune Sunlite Refined Oil 1L', category: 'Oils & Ghee', costPrice: 130, sellingPrice: 148, mrp: 160, currentStock: 18, minStockAlert: 6, unit: 'packet' },
  { barcode: '890103000004', name: 'Maggi 2-Minute Masala Noodles 70g', category: 'Snacks', costPrice: 11.5, sellingPrice: 14, mrp: 14, currentStock: 80, minStockAlert: 20, unit: 'packet' },
  { barcode: '890103000005', name: 'Amul Butter 100g', category: 'Dairy', costPrice: 50, sellingPrice: 56, mrp: 58, currentStock: 12, minStockAlert: 5, unit: 'pcs' },
  { barcode: '890103000006', name: 'Parle-G Glucose Biscuits 250g', category: 'Snacks', costPrice: 25, sellingPrice: 30, mrp: 30, currentStock: 40, minStockAlert: 10, unit: 'packet' },
  { barcode: '890103000007', name: 'Thums Up Soft Drink Can 300ml', category: 'Beverages', costPrice: 32, sellingPrice: 40, mrp: 40, currentStock: 30, minStockAlert: 8, unit: 'pcs' },
  { barcode: '890103000008', name: 'Dettol Original Soap 75g', category: 'Personal Care', costPrice: 34, sellingPrice: 42, mrp: 45, currentStock: 25, minStockAlert: 5, unit: 'pcs' },
  { barcode: '890103000009', name: 'Brooke Bond Red Label Tea 250g', category: 'Beverages', costPrice: 110, sellingPrice: 130, mrp: 140, currentStock: 4, minStockAlert: 5, unit: 'packet' },
  { barcode: '890103000010', name: 'Surf Excel Quick Wash Powder 1kg', category: 'Household', costPrice: 125, sellingPrice: 145, mrp: 155, currentStock: 15, minStockAlert: 5, unit: 'packet' }
];

const INITIAL_CUSTOMERS = [
  {
    name: 'Ramesh Verma',
    phone: '9876543210',
    address: 'Near Shiv Mandir, Ward 4',
    creditBalance: 850,
    creditLimit: 5000,
    transactions: [
      { type: 'PURCHASE_CREDIT', amount: 850, notes: 'Invoice #INV-20260925-0012', date: new Date('2026-09-25T11:20:00Z') }
    ]
  },
  {
    name: 'Pooja Sharma',
    phone: '9812345678',
    address: 'House #42, Main Road',
    creditBalance: 320,
    creditLimit: 3000,
    transactions: [
      { type: 'PURCHASE_CREDIT', amount: 320, notes: 'Invoice #INV-20260927-0034', date: new Date('2026-09-27T17:45:00Z') }
    ]
  }
];

let defaultStoreCache = null;

async function getOrCreateDefaultStore() {
  if (defaultStoreCache) return defaultStoreCache;

  const storePasswordHash = bcrypt.hashSync('store123', 10);
  let store = await Store.findOne({ email: 'apnasupermart@localpos.com' });
  if (!store) {
    store = await Store.create({
      storeName: 'Apna Super Mart',
      ownerName: 'Sunil Kumar',
      email: 'apnasupermart@localpos.com',
      phone: '9876500000',
      passwordHash: storePasswordHash,
      address: {
        street: 'Station Road, Market Yard',
        city: 'Kolkata',
        state: 'WB',
        pincode: '700001'
      },
      plan: 'pro',
      status: 'active',
      monthlyFee: 799,
      taxId: '19ABCDE1234F1Z5',
      currencySymbol: '₹',
      receiptSettings: {
        headerMessage: 'Apna Super Mart - Quality & Savings Daily',
        footerMessage: 'Thank you for shopping local! Visit again.',
        showBarcodeOnReceipt: true
      }
    });
    console.log('Created default store profile: Apna Super Mart');
  } else {
    // Update hash so store123 login works
    store.passwordHash = storePasswordHash;
    await store.save();
  }

  // Create or update Super Admin account
  let adminStore = await Store.findOne({ email: 'admin@retailpos.com' });
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  if (!adminStore) {
    adminStore = await Store.create({
      storeName: 'SaaS Super Admin HQ',
      ownerName: 'Platform Owner',
      email: 'admin@retailpos.com',
      phone: '9999999999',
      passwordHash: adminPasswordHash,
      role: 'superadmin',
      plan: 'enterprise',
      status: 'active',
      monthlyFee: 0,
      currencySymbol: '₹'
    });
    console.log('Created Super Admin user: admin@retailpos.com (Password: admin123)');
  } else {
    adminStore.passwordHash = adminPasswordHash;
    adminStore.role = 'superadmin';
    await adminStore.save();
  }

  // Seed products if empty
  const prodCount = await Product.countDocuments({ storeId: store._id });
  if (prodCount === 0) {
    const productsToInsert = INITIAL_PRODUCTS.map(p => ({
      ...p,
      storeId: store._id
    }));
    await Product.insertMany(productsToInsert);
    console.log(`Seeded ${productsToInsert.length} starter retail products`);
  }

  // Seed customers if empty
  const custCount = await Customer.countDocuments({ storeId: store._id });
  if (custCount === 0) {
    const customersToInsert = INITIAL_CUSTOMERS.map(c => ({
      ...c,
      storeId: store._id
    }));
    await Customer.insertMany(customersToInsert);
    console.log(`Seeded ${customersToInsert.length} starter Khata ledger customers`);
  }

  // Seed other SaaS organizations for the Super Admin
  await seedAdditionalOrganizations();

  defaultStoreCache = store;
  return store;
}

async function seedAdditionalOrganizations() {
  const storeCount = await Store.countDocuments({});
  if (storeCount >= 5) return; // Already seeded

  const extraStores = [
    {
      storeName: 'Sharma Kirana Store',
      ownerName: 'Rajesh Sharma',
      email: 'sharmakirana@retail.com',
      phone: '9829012345',
      passwordHash: '$2a$10$demoHash',
      address: { city: 'Jaipur', state: 'RJ', street: 'MI Road' },
      plan: 'starter',
      status: 'active',
      monthlyFee: 0,
      currencySymbol: '₹'
    },
    {
      storeName: 'Metro Daily Supermart',
      ownerName: 'Priya Nair',
      email: 'metrodaily@retail.com',
      phone: '9845012345',
      passwordHash: '$2a$10$demoHash',
      address: { city: 'Bengaluru', state: 'KA', street: 'Indiranagar 100ft Rd' },
      plan: 'enterprise',
      status: 'active',
      monthlyFee: 1999,
      currencySymbol: '₹'
    },
    {
      storeName: 'Gupta Medicos & Wellness',
      ownerName: 'Amit Gupta',
      email: 'guptamed@retail.com',
      phone: '9811012345',
      passwordHash: '$2a$10$demoHash',
      address: { city: 'New Delhi', state: 'DL', street: 'Karol Bagh' },
      plan: 'pro',
      status: 'active',
      monthlyFee: 799,
      currencySymbol: '₹'
    },
    {
      storeName: 'Verma Organic Groceries',
      ownerName: 'Sneha Verma',
      email: 'vermaorganic@retail.com',
      phone: '9822012345',
      passwordHash: '$2a$10$demoHash',
      address: { city: 'Pune', state: 'MH', street: 'Koregaon Park' },
      plan: 'pro',
      status: 'trial',
      monthlyFee: 799,
      currencySymbol: '₹'
    }
  ];

  for (const storeData of extraStores) {
    const existing = await Store.findOne({ email: storeData.email });
    if (!existing) {
      const createdStore = await Store.create(storeData);
      
      // Generate realistic order history across past 7 days
      const paymentMethods = ['CASH', 'UPI_QR', 'CARD', 'CREDIT_KHATA'];
      const customerNames = ['Vikas Singh', 'Sunita Rao', 'Karan Patel', 'Meena Joshi', 'Alok Jain'];
      
      for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
        const orderCountForDay = Math.floor(Math.random() * 4) + 2; // 2 to 5 orders/day
        
        for (let j = 0; j < orderCountForDay; j++) {
          const orderDate = new Date();
          orderDate.setDate(orderDate.getDate() - dayOffset);
          orderDate.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));

          const amount = Math.floor(Math.random() * 850) + 150;
          const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
          const cust = customerNames[Math.floor(Math.random() * customerNames.length)];
          const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, '');
          const invNum = `INV-${createdStore.storeName.slice(0, 3).toUpperCase()}-${dateStr}-${String(j + 1).padStart(3, '0')}`;

          await Order.create({
            storeId: createdStore._id,
            invoiceNumber: invNum,
            customerName: cust,
            customerPhone: '98' + Math.floor(10000000 + Math.random() * 90000000),
            items: [
              {
                name: 'Grocery Pack Item',
                quantity: 1,
                unitPrice: amount,
                costPrice: Math.round(amount * 0.8),
                totalPrice: amount
              }
            ],
            subtotal: amount,
            grandTotal: amount,
            paymentMethod: method,
            createdAt: orderDate
          });
        }
      }
    }
  }

  console.log('Seeded multi-tenant organizations with 7-day transaction histories');
}

module.exports = {
  getOrCreateDefaultStore
};
