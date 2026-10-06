const Customer = require('../models/Customer');

exports.getCustomers = async (req, res) => {
  try {
    const { search, withBalanceOnly } = req.query;
    const query = { storeId: req.storeId };

    if (withBalanceOnly === 'true') {
      query.creditBalance = { $gt: 0 };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query).sort({ creditBalance: -1, name: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving customers', error: error.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, storeId: req.storeId })
      .populate('transactions.orderId');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer profile', error: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, address, creditLimit } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    const existing = await Customer.findOne({ storeId: req.storeId, phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ message: 'A customer with this phone number already exists' });
    }

    const customer = new Customer({
      storeId: req.storeId,
      name: name.trim(),
      phone: phone.trim(),
      address: address || '',
      creditLimit: creditLimit ? Number(creditLimit) : 5000
    });

    await customer.save();
    res.status(201).json({ message: 'Customer added successfully', customer });
  } catch (error) {
    res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, notes, paymentMode } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'A positive payment amount is required' });
    }

    const customer = await Customer.findOne({ _id: id, storeId: req.storeId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const payAmount = Number(amount);
    customer.creditBalance = Math.max(0, customer.creditBalance - payAmount);

    customer.transactions.push({
      type: 'PAYMENT_RECEIVED',
      amount: payAmount,
      notes: notes || `Payment received via ${paymentMode || 'Cash'}`,
      date: new Date()
    });

    await customer.save();

    res.json({
      message: 'Payment recorded successfully',
      customer
    });
  } catch (error) {
    res.status(500).json({ message: 'Error recording payment', error: error.message });
  }
};
