const mongoose = require('mongoose');

const customerTransactionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['PURCHASE_CREDIT', 'PAYMENT_RECEIVED'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  },
  notes: { 
    type: String, 
    default: '' 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
});

const customerSchema = new mongoose.Schema({
  storeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Store', 
    required: true, 
    index: true 
  },
  name: { 
    type: String, 
    required: [true, 'Customer name is required'],
    trim: true 
  },
  phone: { 
    type: String, 
    required: [true, 'Customer phone number is required'],
    trim: true,
    index: true 
  },
  address: { 
    type: String, 
    default: '' 
  },
  creditBalance: { 
    type: Number, 
    default: 0 // positive = customer owes store money
  },
  creditLimit: { 
    type: Number, 
    default: 5000 
  },
  transactions: [customerTransactionSchema],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Unique phone per store
customerSchema.index({ storeId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);
