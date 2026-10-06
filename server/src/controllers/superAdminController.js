const Store = require('../models/Store');
const Order = require('../models/Order');

exports.getOverview = async (req, res) => {
  try {
    const stores = await Store.find({}).sort({ createdAt: -1 });

    const totalOrganizations = stores.length;
    const activeOrganizationsCount = stores.filter(s => s.status === 'active').length;

    // SaaS MRR calculation from store plans
    const estimatedSaaSMRR = stores.reduce((sum, s) => {
      if (s.status === 'active') {
        return sum + (s.monthlyFee || (s.plan === 'enterprise' ? 1999 : s.plan === 'pro' ? 799 : 0));
      }
      return sum;
    }, 0);

    // Date filters for today
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // All orders
    const allOrders = await Order.find({}).sort({ createdAt: -1 });

    const totalOrdersCount = allOrders.length;
    const totalPlatformGMV = allOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    // Today's orders
    const todayOrders = allOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= startOfToday && orderDate < endOfToday;
    });

    const todayPlatformGMV = todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const todayOrderCount = todayOrders.length;

    // Distinct active stores transacting today
    const activeStoreIdsToday = new Set(todayOrders.map(o => String(o.storeId)));
    const activeOrganizationsToday = activeStoreIdsToday.size;

    // Daily transaction trend for the past 7 days
    const dailyTransactionsMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyTransactionsMap[dateKey] = {
        date: dateKey,
        label: dayLabel,
        totalAmount: 0,
        orderCount: 0
      };
    }

    allOrders.forEach(o => {
      const dateKey = new Date(o.createdAt).toISOString().slice(0, 10);
      if (dailyTransactionsMap[dateKey]) {
        dailyTransactionsMap[dateKey].totalAmount += o.grandTotal || 0;
        dailyTransactionsMap[dateKey].orderCount += 1;
      }
    });

    const dailyTransactions = Object.values(dailyTransactionsMap);

    // Breakdown per store
    const storeMap = {};
    stores.forEach(s => {
      storeMap[String(s._id)] = {
        _id: s._id,
        storeName: s.storeName,
        ownerName: s.ownerName,
        email: s.email,
        phone: s.phone,
        city: s.address?.city || 'Local Store',
        state: s.address?.state || '',
        plan: s.plan || 'pro',
        status: s.status || 'active',
        monthlyFee: s.monthlyFee || (s.plan === 'enterprise' ? 1999 : s.plan === 'pro' ? 799 : 0),
        currencySymbol: s.currencySymbol || '₹',
        createdAt: s.createdAt,
        totalOrders: 0,
        totalVolume: 0,
        todayOrders: 0,
        todayVolume: 0
      };
    });

    allOrders.forEach(o => {
      const sId = String(o.storeId);
      if (storeMap[sId]) {
        storeMap[sId].totalOrders += 1;
        storeMap[sId].totalVolume += o.grandTotal || 0;

        const isToday = new Date(o.createdAt) >= startOfToday;
        if (isToday) {
          storeMap[sId].todayOrders += 1;
          storeMap[sId].todayVolume += o.grandTotal || 0;
        }
      }
    });

    const storesBreakdown = Object.values(storeMap).sort((a, b) => b.totalVolume - a.totalVolume);

    // Recent 10 orders across platform with store names
    const recentPlatformOrders = allOrders.slice(0, 10).map(o => {
      const s = storeMap[String(o.storeId)];
      return {
        _id: o._id,
        invoiceNumber: o.invoiceNumber,
        storeName: s ? s.storeName : 'Unknown Store',
        city: s ? s.city : '',
        customerName: o.customerName || 'Walk-in Customer',
        grandTotal: o.grandTotal,
        paymentMethod: o.paymentMethod,
        itemCount: o.items ? o.items.length : 0,
        createdAt: o.createdAt
      };
    });

    res.json({
      summary: {
        totalOrganizations,
        activeOrganizationsCount,
        activeOrganizationsToday,
        totalPlatformGMV,
        todayPlatformGMV,
        totalOrdersCount,
        todayOrderCount,
        estimatedSaaSMRR
      },
      dailyTransactions,
      storesBreakdown,
      recentPlatformOrders
    });
  } catch (error) {
    console.error('Super Admin Overview Error:', error);
    res.status(500).json({ message: 'Error retrieving super admin analytics', error: error.message });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, plan, monthlyFee } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (plan) updates.plan = plan;
    if (monthlyFee !== undefined) updates.monthlyFee = Number(monthlyFee);

    const updated = await Store.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-passwordHash');

    if (!updated) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json({ message: 'Organization updated successfully', store: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating organization', error: error.message });
  }
};

exports.createStore = async (req, res) => {
  try {
    const { storeName, ownerName, email, phone, city, plan, monthlyFee } = req.body;

    if (!storeName || !ownerName || !email || !phone) {
      return res.status(400).json({ message: 'Store name, owner name, email, and phone are required' });
    }

    const existing = await Store.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'A store with this email already exists' });
    }

    const newStore = await Store.create({
      storeName,
      ownerName,
      email: email.toLowerCase(),
      phone,
      passwordHash: '$2a$10$defaultPasswordHashForCreatedTenant',
      address: { city: city || 'Local Town' },
      plan: plan || 'pro',
      status: 'active',
      monthlyFee: monthlyFee !== undefined ? Number(monthlyFee) : (plan === 'enterprise' ? 1999 : plan === 'pro' ? 799 : 0)
    });

    res.status(201).json({ message: 'Organization provisioned successfully', store: newStore });
  } catch (error) {
    res.status(500).json({ message: 'Error provisioning organization', error: error.message });
  }
};
