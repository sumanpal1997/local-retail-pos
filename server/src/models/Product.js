const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  storeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Store', 
    required: true, 
    index: true 
  },
  barcode: { 
    type: String, 
    trim: true,
    index: true 
  },
  name: { 
    type: String, 
    required: [true, 'Product name is required'], 
    trim: true,
    index: true 
  },
  category: { 
    type: String, 
    default: 'General',
    trim: true 
  },
  costPrice: { 
    type: Number, 
    required: [true, 'Cost price is required'],
    min: 0 
  },
  sellingPrice: { 
    type: Number, 
    required: [true, 'Selling price is required'],
    min: 0 
  },
  mrp: { 
    type: Number,
    min: 0 
  },
  taxRatePercent: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100 
  },
  currentStock: { 
    type: Number, 
    default: 0 
  },
  minStockAlert: { 
    type: Number, 
    default: 5 
  },
  unit: { 
    type: String, 
    enum: ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'packet'], 
    default: 'pcs' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Composite index to ensure unique barcode per store if barcode is provided
productSchema.index({ storeId: 1, barcode: 1 });

module.exports = mongoose.model('Product', productSchema);
