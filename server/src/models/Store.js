const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  storeName: { 
    type: String, 
    required: [true, 'Store name is required'],
    trim: true
  },
  ownerName: { 
    type: String, 
    required: [true, 'Owner name is required'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: { 
    type: String, 
    required: [true, 'Phone number is required'],
    trim: true
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' }
  },
  taxId: { 
    type: String, 
    default: '' // GSTIN / Tax identifier
  },
  currencySymbol: { 
    type: String, 
    default: '₹' 
  },
  discountPresets: {
    type: [Number],
    default: [0, 5, 10]
  },
  receiptSettings: {
    headerMessage: { 
      type: String, 
      default: 'Thank you for shopping with us!' 
    },
    footerMessage: { 
      type: String, 
      default: 'Goods once sold cannot be returned without receipt.' 
    },
    showBarcodeOnReceipt: { 
      type: Boolean, 
      default: true 
    }
  },
  role: { 
    type: String, 
    enum: ['superadmin', 'owner', 'cashier'], 
    default: 'owner' 
  },
  plan: {
    type: String,
    enum: ['starter', 'pro', 'enterprise'],
    default: 'pro'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'trial'],
    default: 'active'
  },
  monthlyFee: {
    type: Number,
    default: 799
  },
  // Two-Step Authentication (SMS OTP via Mobile)
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorOtp: {
    type: String,
    default: null
  },
  twoFactorExpires: {
    type: Date,
    default: null
  },
  twoFactorAttempts: {
    type: Number,
    default: 0
  },
  twoFactorTempToken: {
    type: String,
    default: null
  },
  // Forgot Password Reset via Mobile OTP
  resetPasswordOtp: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  resetPasswordAttempts: {
    type: Number,
    default: 0
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Store', storeSchema);
