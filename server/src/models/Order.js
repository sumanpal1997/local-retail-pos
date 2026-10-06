const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  },
  name: { type: String, required: true },
  barcode: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 0.01 },
  unitPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  taxRatePercent: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  storeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Store', 
    required: true, 
    index: true 
  },
  invoiceNumber: { 
    type: String, 
    required: true,
    index: true 
  },
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer' 
  },
  customerPhone: { type: String, default: '' },
  customerName: { type: String, default: 'Walk-in Customer' },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  totalDiscount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, min: 0 },
  paymentMethod: { 
    type: String, 
    enum: ['CASH', 'UPI_QR', 'CARD', 'CREDIT_KHATA', 'SPLIT'], 
    default: 'CASH' 
  },
  paymentDetails: {
    cashReceived: { type: Number, default: 0 },
    changeReturned: { type: Number, default: 0 },
    upiRefNumber: { type: String, default: '' }
  },
  creditStatus: {
    type: String,
    enum: ['NONE', 'PARTIAL', 'UNPAID', 'PAID'],
    default: 'NONE'
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    index: true 
  }
});

module.exports = mongoose.model('Order', orderSchema);
