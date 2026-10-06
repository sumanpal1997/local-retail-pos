const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

exports.createOrder = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      subtotal,
      totalDiscount,
      taxAmount,
      grandTotal,
      paymentMethod,
      paymentDetails
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    // Generate unique invoice number for today
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await Order.countDocuments({
      storeId: req.storeId,
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    });
    const invoiceNumber = `INV-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;

    let resolvedCustomerId = customerId || null;
    let creditStatus = 'NONE';

    // Handle Khata / Credit Payment
    if (paymentMethod === 'CREDIT_KHATA') {
      creditStatus = 'UNPAID';
      if (!customerPhone) {
        return res.status(400).json({ message: 'Customer phone is required for credit (Khata) sales' });
      }

      let customer = null;
      if (resolvedCustomerId) {
        customer = await Customer.findOne({ _id: resolvedCustomerId, storeId: req.storeId });
      }
      if (!customer && customerPhone) {
        customer = await Customer.findOne({ phone: customerPhone.trim(), storeId: req.storeId });
      }

      // If customer doesn't exist yet, auto-create
      if (!customer) {
        customer = new Customer({
          storeId: req.storeId,
          name: customerName || 'Valued Customer',
          phone: customerPhone.trim(),
          creditBalance: 0
        });
      }

      // Add to credit balance & log transaction
      customer.creditBalance += Number(grandTotal);
      resolvedCustomerId = customer._id;

      await customer.save();
    } else if (customerPhone && !resolvedCustomerId) {
      // Find or create customer for record keeping
      let customer = await Customer.findOne({ phone: customerPhone.trim(), storeId: req.storeId });
      if (!customer) {
        customer = new Customer({
          storeId: req.storeId,
          name: customerName || 'Walk-in Customer',
          phone: customerPhone.trim()
        });
        await customer.save();
      }
      resolvedCustomerId = customer._id;
    }

    // Create the order
    const order = new Order({
      storeId: req.storeId,
      invoiceNumber,
      customerId: resolvedCustomerId,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone ? customerPhone.trim() : '',
      items,
      subtotal: Number(subtotal),
      totalDiscount: Number(totalDiscount || 0),
      taxAmount: Number(taxAmount || 0),
      grandTotal: Number(grandTotal),
      paymentMethod: paymentMethod || 'CASH',
      paymentDetails: paymentDetails || {},
      creditStatus
    });

    await order.save();

    // If Khata, append transaction entry with order reference
    if (paymentMethod === 'CREDIT_KHATA' && resolvedCustomerId) {
      await Customer.findByIdAndUpdate(resolvedCustomerId, {
        $push: {
          transactions: {
            type: 'PURCHASE_CREDIT',
            amount: Number(grandTotal),
            orderId: order._id,
            notes: `Invoice #${invoiceNumber}`,
            date: new Date()
          }
        }
      });
    }

    // Automatically decrement inventory stock
    for (const item of items) {
      if (item.productId) {
        await Product.updateOne(
          { _id: item.productId, storeId: req.storeId },
          { $inc: { currentStock: -Number(item.quantity) } }
        );
      }
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing order', error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { limit = 50, page = 1, startDate, endDate } = req.query;
    const filter = { storeId: req.storeId };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, storeId: req.storeId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order details', error: error.message });
  }
};
