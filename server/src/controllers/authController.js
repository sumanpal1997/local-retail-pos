const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Store = require('../models/Store');
const smsService = require('../services/smsService');

const JWT_SECRET = process.env.JWT_SECRET || 'local_retail_pos_dev_secret_key_2026_change_in_production';
const isDev = process.env.NODE_ENV !== 'production' || process.env.EXPOSE_DEV_OTP === 'true';

// Helper to format safe store object
function formatStore(store) {
  return {
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
    discountPresets: store.discountPresets || [0, 5, 10],
    isTwoFactorEnabled: Boolean(store.isTwoFactorEnabled)
  };
}

// REGISTER NEW STORE
exports.register = async (req, res) => {
  try {
    const { storeName, ownerName, email, phone, password, address, city, taxId, currencySymbol, plan, isTwoFactorEnabled } = req.body;

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
      phone: phone.trim(),
      passwordHash,
      role: 'owner',
      plan: storePlan,
      status: 'active',
      monthlyFee: storePlan === 'enterprise' ? 1999 : storePlan === 'pro' ? 799 : 0,
      address: address || { city: city || '' },
      taxId: taxId || '',
      currencySymbol: currencySymbol || '₹',
      isTwoFactorEnabled: Boolean(isTwoFactorEnabled)
    });

    await store.save();

    const token = jwt.sign(
      { storeId: store._id, email: store.email, role: store.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Store registered successfully',
      token,
      store: formatStore(store)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// LOGIN WITH TWO-STEP AUTHENTICATION DETECTION
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const store = await Store.findOne({ email: email.toLowerCase().trim() });
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

    // IF TWO-STEP AUTHENTICATION IS ENABLED
    if (store.isTwoFactorEnabled) {
      const otp = smsService.generateOtp();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const tempToken = jwt.sign(
        { storeId: store._id, purpose: '2fa_login' },
        JWT_SECRET,
        { expiresIn: '10m' }
      );

      store.twoFactorOtp = otp;
      store.twoFactorExpires = expires;
      store.twoFactorAttempts = 0;
      store.twoFactorTempToken = tempToken;
      await store.save();

      // Dispatch OTP via SMS
      await smsService.sendOtpSms({
        phone: store.phone,
        otp,
        purpose: 'login'
      });

      return res.json({
        twoFactorRequired: true,
        message: `Two-Step verification code sent to registered mobile number ending in ${store.phone.slice(-4)}`,
        tempToken,
        phoneMasked: smsService.maskPhoneNumber(store.phone),
        devOtp: isDev ? otp : undefined
      });
    }

    // STANDARD IMMEDIATE LOGIN
    const token = jwt.sign(
      { storeId: store._id, email: store.email, role: store.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      store: formatStore(store)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// VERIFY 2-STEP AUTHENTICATION OTP
exports.verifyTwoFactor = async (req, res) => {
  try {
    const { tempToken, otp } = req.body;
    if (!tempToken || !otp) {
      return res.status(400).json({ message: 'Session token and 6-digit OTP code are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Verification session expired. Please sign in again.' });
    }

    if (decoded.purpose !== '2fa_login') {
      return res.status(401).json({ message: 'Invalid verification token' });
    }

    const store = await Store.findById(decoded.storeId);
    if (!store || store.twoFactorTempToken !== tempToken) {
      return res.status(401).json({ message: 'Session expired or invalid. Please sign in again.' });
    }

    if (!store.twoFactorOtp || !store.twoFactorExpires || store.twoFactorExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    if (store.twoFactorAttempts >= 5) {
      return res.status(400).json({ message: 'Too many incorrect attempts. Please sign in again to receive a fresh code.' });
    }

    if (store.twoFactorOtp !== String(otp).trim()) {
      store.twoFactorAttempts += 1;
      await store.save();
      return res.status(400).json({ 
        message: 'Invalid verification code. Please check and try again.',
        attemptsRemaining: Math.max(0, 5 - store.twoFactorAttempts)
      });
    }

    // OTP Verified! Clear 2FA temporary fields
    store.twoFactorOtp = null;
    store.twoFactorExpires = null;
    store.twoFactorAttempts = 0;
    store.twoFactorTempToken = null;
    await store.save();

    const token = jwt.sign(
      { storeId: store._id, email: store.email, role: store.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Two-Step verification successful! Welcome back.',
      token,
      store: formatStore(store)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying 2FA OTP', error: error.message });
  }
};

// RESEND 2-STEP AUTHENTICATION OTP
exports.resendTwoFactorOtp = async (req, res) => {
  try {
    const { tempToken } = req.body;
    if (!tempToken) {
      return res.status(400).json({ message: 'Verification session token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Verification session expired. Please sign in again.' });
    }

    const store = await Store.findById(decoded.storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const otp = smsService.generateOtp();
    store.twoFactorOtp = otp;
    store.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000);
    store.twoFactorAttempts = 0;
    await store.save();

    await smsService.sendOtpSms({
      phone: store.phone,
      otp,
      purpose: 'login'
    });

    res.json({
      message: `A fresh 6-digit code has been sent to your mobile ending in ${store.phone.slice(-4)}`,
      phoneMasked: smsService.maskPhoneNumber(store.phone),
      devOtp: isDev ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error resending 2FA OTP', error: error.message });
  }
};

// FORGOT PASSWORD: REQUEST RESET OTP VIA SMS
exports.forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: 'Registered email or mobile number is required' });
    }

    const clean = identifier.trim();
    const cleanLower = clean.toLowerCase();

    const store = await Store.findOne({
      $or: [
        { email: cleanLower },
        { phone: clean },
        { phone: clean.replace(/\D/g, '').slice(-10) }
      ]
    });

    if (!store) {
      return res.status(404).json({ message: 'No registered store account found with this email or mobile number.' });
    }

    const otp = smsService.generateOtp();
    store.resetPasswordOtp = otp;
    store.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    store.resetPasswordAttempts = 0;
    await store.save();

    await smsService.sendOtpSms({
      phone: store.phone,
      otp,
      purpose: 'reset_password'
    });

    res.json({
      message: `Password reset verification code sent to your registered mobile ending in ${store.phone.slice(-4)}`,
      identifier: store.email,
      phoneMasked: smsService.maskPhoneNumber(store.phone),
      devOtp: isDev ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error requesting password reset', error: error.message });
  }
};

// VERIFY FORGOT PASSWORD OTP
exports.verifyResetOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Account identifier and OTP code are required' });
    }

    const clean = identifier.trim();
    const cleanLower = clean.toLowerCase();

    const store = await Store.findOne({
      $or: [
        { email: cleanLower },
        { phone: clean },
        { phone: clean.replace(/\D/g, '').slice(-10) }
      ]
    });

    if (!store) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (!store.resetPasswordOtp || !store.resetPasswordExpires || store.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Password reset code has expired. Please request a new code.' });
    }

    if (store.resetPasswordAttempts >= 5) {
      return res.status(400).json({ message: 'Too many incorrect attempts. Please request a new code.' });
    }

    if (store.resetPasswordOtp !== String(otp).trim()) {
      store.resetPasswordAttempts += 1;
      await store.save();
      return res.status(400).json({ 
        message: 'Invalid verification code. Please check and try again.',
        attemptsRemaining: Math.max(0, 5 - store.resetPasswordAttempts)
      });
    }

    res.json({
      valid: true,
      message: 'Code verified successfully! You may now set your new password.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying reset code', error: error.message });
  }
};

// RESET PASSWORD WITH OTP
exports.resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: 'Identifier, verification code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const clean = identifier.trim();
    const cleanLower = clean.toLowerCase();

    const store = await Store.findOne({
      $or: [
        { email: cleanLower },
        { phone: clean },
        { phone: clean.replace(/\D/g, '').slice(-10) }
      ]
    });

    if (!store) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (!store.resetPasswordOtp || !store.resetPasswordExpires || store.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Password reset code has expired. Please request a new code.' });
    }

    if (store.resetPasswordAttempts >= 5) {
      return res.status(400).json({ message: 'Too many incorrect attempts. Please request a new code.' });
    }

    if (store.resetPasswordOtp !== String(otp).trim()) {
      store.resetPasswordAttempts += 1;
      await store.save();
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }

    // Encrypt new password
    const salt = await bcrypt.genSalt(10);
    store.passwordHash = await bcrypt.hash(newPassword, salt);

    // Clear reset OTP fields
    store.resetPasswordOtp = null;
    store.resetPasswordExpires = null;
    store.resetPasswordAttempts = 0;
    await store.save();

    res.json({
      message: 'Password reset successfully! You can now log in with your new password.',
      email: store.email
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error resetting password', error: error.message });
  }
};

// REQUEST 2-STEP AUTHENTICATION SETUP (MERCHANT LOGGED IN)
exports.requestTwoFactorSetup = async (req, res) => {
  try {
    const store = await Store.findById(req.storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const otp = smsService.generateOtp();
    store.twoFactorOtp = otp;
    store.twoFactorExpires = new Date(Date.now() + 10 * 60 * 1000);
    store.twoFactorAttempts = 0;
    await store.save();

    await smsService.sendOtpSms({
      phone: store.phone,
      otp,
      purpose: 'setup_2fa'
    });

    res.json({
      message: `Verification code sent to your mobile ending in ${store.phone.slice(-4)}`,
      phoneMasked: smsService.maskPhoneNumber(store.phone),
      devOtp: isDev ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error sending 2FA setup code', error: error.message });
  }
};

// CONFIRM AND ENABLE 2-STEP AUTHENTICATION
exports.confirmTwoFactorEnable = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'Verification OTP code is required' });
    }

    const store = await Store.findById(req.storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (!store.twoFactorOtp || !store.twoFactorExpires || store.twoFactorExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    if (store.twoFactorOtp !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    store.isTwoFactorEnabled = true;
    store.twoFactorOtp = null;
    store.twoFactorExpires = null;
    store.twoFactorAttempts = 0;
    await store.save();

    res.json({
      message: 'Two-Step Authentication has been enabled successfully on your account!',
      store: formatStore(store)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error enabling 2FA', error: error.message });
  }
};

// DISABLE 2-STEP AUTHENTICATION
exports.disableTwoFactor = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Current password is required to disable Two-Step Authentication' });
    }

    const store = await Store.findById(req.storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const isMatch = await bcrypt.compare(password, store.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Cannot disable Two-Step Authentication.' });
    }

    store.isTwoFactorEnabled = false;
    store.twoFactorOtp = null;
    store.twoFactorExpires = null;
    store.twoFactorAttempts = 0;
    await store.save();

    res.json({
      message: 'Two-Step Authentication has been disabled.',
      store: formatStore(store)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error disabling 2FA', error: error.message });
  }
};

// GET STORE PROFILE
exports.getProfile = async (req, res) => {
  try {
    const store = await Store.findById(req.storeId).select('-passwordHash');
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.json(formatStore(store));
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};

// UPDATE STORE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { storeName, ownerName, phone, address, taxId, currencySymbol, receiptSettings, discountPresets } = req.body;

    const updateFields = {};
    if (storeName) updateFields.storeName = storeName;
    if (ownerName) updateFields.ownerName = ownerName;
    if (phone) updateFields.phone = phone.trim();
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
    );

    res.json({ message: 'Settings updated successfully', store: formatStore(store) });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};
