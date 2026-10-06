const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

exports.getDashboardSummary = async (req, res) => {
  try {
    const storeId = req.storeId;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Today's orders
    const todayOrders = await Order.find({
      storeId,
      createdAt: { $gte: startOfToday, $lt: endOfToday }
    });

    let todaySales = 0;
    let todayEstimatedProfit = 0;
    let paymentBreakdown = { CASH: 0, UPI_QR: 0, CARD: 0, CREDIT_KHATA: 0, SPLIT: 0 };

    todayOrders.forEach(order => {
      todaySales += order.grandTotal;
      if (paymentBreakdown[order.paymentMethod] !== undefined) {
        paymentBreakdown[order.paymentMethod] += order.grandTotal;
      }
      
      // Calculate profit: sellingPrice - costPrice for items
      order.items.forEach(item => {
        const cost = (item.costPrice || 0) * item.quantity;
        const revenue = item.totalPrice;
        todayEstimatedProfit += (revenue - cost);
      });
    });

    // Total outstanding customer credit
    const customersWithCredit = await Customer.find({
      storeId,
      creditBalance: { $gt: 0 }
    });
    const totalCreditOutstanding = customersWithCredit.reduce((acc, c) => acc + c.creditBalance, 0);

    // Low stock count
    const lowStockCount = await Product.countDocuments({
      storeId,
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockAlert'] }
    });

    // Recent orders
    const recentOrders = await Order.find({ storeId })
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      todaySales,
      todayOrderCount: todayOrders.length,
      todayEstimatedProfit: Math.max(0, todayEstimatedProfit),
      totalCreditOutstanding,
      lowStockCount,
      paymentBreakdown,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: 'Error loading dashboard metrics', error: error.message });
  }
};
