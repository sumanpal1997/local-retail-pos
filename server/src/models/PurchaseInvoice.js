const mongoose = require('mongoose');

const purchaseInvoiceSchema = new mongoose.Schema({
  storeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Store', 
    required: true, 
    index: true 
  },
  supplierName: { 
    type: String, 
    required: true,
    trim: true 
  },
  invoiceNumber: { 
    type: String, 
    required: true,
    trim: true 
  },
  invoiceDate: { 
    type: Date, 
    default: Date.now 
  },
  totalAmount: { 
    type: Number, 
    default: 0 
  },
  itemCount: { 
    type: Number, 
    default: 0 
  },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: { type: String, required: true },
      barcode: { type: String, default: '' },
      quantityAdded: { type: Number, required: true },
      costPrice: { type: Number, required: true },
      sellingPrice: { type: Number, required: true },
      mrp: { type: Number, default: 0 },
      isNewProduct: { type: Boolean, default: false }
    }
  ],
  notes: { 
    type: String, 
    default: 'Processed via AI Distributor Invoice Scanner' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema);
