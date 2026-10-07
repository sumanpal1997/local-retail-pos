const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Store = require('../models/Store');

exports.register = async (req, res) => {
  try {
    const { storeName, ownerName, email, phone, password, address, city, taxId, currencySymbol, plan } = req.body;

    if (!storeName || !ownerName || !email || !phone || !password) {
      return res.status(400).json({ message: 'Store name, owner name, email, phone, and password are required' });
    }

    const existingStore = await Store.findOne({ email: email.toLowerCase() });
    if (existingStore) {
      return res.status(400).json({ message: 'A store with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const storePlan = plan || 'pro';
    const store = new Store({
      storeName,
      ownerName,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: 'owner',
      plan: storePlan,
      status: 'active',
      monthlyFee: storePlan === 'enterprise' ? 1999 : storePlan === 'pro' ? 799 : 0,
      address: address || { city: city || '' },
      taxId: taxId || '',
      currencySymbol: currencySymbol || '₹'
    });

    await store.save();

    const token = jwt.sign(
      { storeId: store._id, email: store.email, role: store.role },
      process.env.JWT_SECRET || 'local_retail_pos_dev_secret_key_2026_change_in_production',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Store registered successfully',
      token,
      store: {
        id: store._id,
        storeName: store.storeName,
        ownerName: store.ownerName,
        email: store.email,
        phone: store.phone,
        role: store.role,
        plan: store.plan,
        status: store.status,
        address: store.address,
        taxId: store.taxId,
        currencySymbol: store.currencySymbol,
        receiptSettings: store.receiptSettings
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const store = await Store.findOne({ email: email.toLowerCase() });
    if (!store) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, store.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (store.status === 'suspended') {
      return res.status(403).json({ 
        message: 'Your organization account is suspended. Please contact the platform Super Admin.' 
      });
    }

    const token = jwt.sign(
      { storeId: store._id, email: store.email, role: store.role },
      process.env.JWT_SECRET || 'local_retail_pos_dev_secret_key_2026_change_in_production',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      store: {
        id: store._id,
        storeName: store.storeName,
        ownerName: store.ownerName,
        email: store.email,
        phone: store.phone,
        role: store.role || 'owner',
        plan: store.plan || 'pro',
        status: store.status || 'active',
        address: store.address,
        taxId: store.taxId,
        currencySymbol: store.currencySymbol,
        receiptSettings: store.receiptSettings,
        discountPresets: store.discountPresets || [0, 5, 10]
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const store = await Store.findById(req.storeId).select('-passwordHash');
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { storeName, ownerName, phone, address, taxId, currencySymbol, receiptSettings, discountPresets } = req.body;

    const updateFields = {};
    if (storeName) updateFields.storeName = storeName;
    if (ownerName) updateFields.ownerName = ownerName;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (taxId !== undefined) updateFields.taxId = taxId;
    if (currencySymbol) updateFields.currencySymbol = currencySymbol;
    if (receiptSettings) updateFields.receiptSettings = receiptSettings;
    if (discountPresets && Array.isArray(discountPresets)) {
      updateFields.discountPresets = discountPresets
        .map(n => Math.max(0, Math.min(100, Number(n) || 0)))
        .filter((val, idx, arr) => arr.indexOf(val) === idx)
        .sort((a, b) => a - b);
    }

    const store = await Store.findByIdAndUpdate(
      req.storeId,
      { $set: updateFields },
      { new: true }
    ).select('-passwordHash');

    res.json({ message: 'Settings updated successfully', store });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};
