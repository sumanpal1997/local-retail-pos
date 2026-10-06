const Product = require('../models/Product');
const PurchaseInvoice = require('../models/PurchaseInvoice');
const { parseInvoiceData } = require('../services/aiInvoiceParser');

exports.getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = { storeId: req.storeId, isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query).sort({ name: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving products', error: error.message });
  }
};

exports.lookupByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await Product.findOne({
      storeId: req.storeId,
      barcode: barcode.trim(),
      isActive: true
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found with this barcode' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error looking up barcode', error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { barcode, name, category, costPrice, sellingPrice, mrp, taxRatePercent, currentStock, minStockAlert, unit } = req.body;

    if (!name || costPrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({ message: 'Product name, cost price, and selling price are required' });
    }

    // Check duplicate barcode if barcode is provided
    if (barcode && barcode.trim()) {
      const existing = await Product.findOne({
        storeId: req.storeId,
        barcode: barcode.trim(),
        isActive: true
      });
      if (existing) {
        return res.status(400).json({ message: `A product with barcode "${barcode}" already exists: ${existing.name}` });
      }
    }

    const product = new Product({
      storeId: req.storeId,
      barcode: barcode ? barcode.trim() : '',
      name: name.trim(),
      category: category ? category.trim() : 'General',
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      mrp: mrp ? Number(mrp) : Number(sellingPrice),
      taxRatePercent: taxRatePercent ? Number(taxRatePercent) : 0,
      currentStock: currentStock !== undefined ? Number(currentStock) : 0,
      minStockAlert: minStockAlert !== undefined ? Number(minStockAlert) : 5,
      unit: unit || 'pcs'
    });

    await product.save();
    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: id, storeId: req.storeId },
      { $set: updates },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndUpdate(
      { _id: id, storeId: req.storeId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

exports.getLowStock = async (req, res) => {
  try {
    const products = await Product.find({
      storeId: req.storeId,
      isActive: true,
      $expr: { $lte: ['$currentStock', '$minStockAlert'] }
    }).sort({ currentStock: 1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching low stock alerts', error: error.message });
  }
};

exports.scanInvoice = async (req, res) => {
  try {
    const { templateType, rawText, fileName } = req.body;
    
    // Fetch current store products to cross-reference
    const storeProducts = await Product.find({ storeId: req.storeId, isActive: true });
    
    const parsedData = await parseInvoiceData({ templateType, rawText, fileName }, storeProducts);

    res.json({
      message: 'Invoice scanned and parsed successfully',
      data: parsedData
    });
  } catch (error) {
    res.status(500).json({ message: 'Error parsing invoice', error: error.message });
  }
};

exports.confirmInvoiceRestock = async (req, res) => {
  try {
    const { supplierName, invoiceNumber, invoiceDate, items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'No items provided to restock' });
    }

    let restockedCount = 0;
    let newItemsCount = 0;
    const invoiceItemsRecord = [];

    for (const item of items) {
      const qty = Number(item.quantity || 0);
      const cost = Number(item.costPrice || 0);
      const sell = Number(item.sellingPrice || cost);
      const mrp = Number(item.mrp || sell);

      let productId = item.matchedProductId;

      if (productId) {
        // Increment stock and update cost/selling prices
        const updated = await Product.findOneAndUpdate(
          { _id: productId, storeId: req.storeId },
          { 
            $inc: { currentStock: qty },
            $set: { costPrice: cost, sellingPrice: sell, mrp }
          },
          { new: true }
        );

        if (updated) {
          restockedCount++;
          invoiceItemsRecord.push({
            productId: updated._id,
            name: updated.name,
            barcode: updated.barcode,
            quantityAdded: qty,
            costPrice: cost,
            sellingPrice: sell,
            mrp,
            isNewProduct: false
          });
        }
      } else {
        // Create as a new product in the store
        const newProduct = new Product({
          storeId: req.storeId,
          name: item.name.trim(),
          barcode: item.barcode ? item.barcode.trim() : '',
          category: item.category || 'General',
          costPrice: cost,
          sellingPrice: sell,
          mrp,
          currentStock: qty,
          minStockAlert: 5,
          unit: item.unit || 'pcs'
        });

        await newProduct.save();
        newItemsCount++;
        invoiceItemsRecord.push({
          productId: newProduct._id,
          name: newProduct.name,
          barcode: newProduct.barcode,
          quantityAdded: qty,
          costPrice: cost,
          sellingPrice: sell,
          mrp,
          isNewProduct: true
        });
      }
    }

    // Save purchase invoice record
    const purchaseInvoice = new PurchaseInvoice({
      storeId: req.storeId,
      supplierName: supplierName || 'Wholesale Supplier',
      invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      totalAmount: items.reduce((sum, it) => sum + (Number(it.costPrice || 0) * Number(it.quantity || 0)), 0),
      itemCount: items.length,
      items: invoiceItemsRecord
    });

    await purchaseInvoice.save();

    res.json({
      message: `Successfully processed invoice! Updated ${restockedCount} existing items and created ${newItemsCount} new products.`,
      restockedCount,
      newItemsCount,
      purchaseInvoice
    });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming invoice restock', error: error.message });
  }
};

exports.getPurchaseInvoices = async (req, res) => {
  try {
    const invoices = await PurchaseInvoice.find({ storeId: req.storeId }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving purchase invoices', error: error.message });
  }
};
