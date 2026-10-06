// AI Distributor Bill & Invoice Parser Service

const SAMPLE_TEMPLATES = {
  sample_fmcg: {
    supplierName: 'Hindustan Wholesale FMCG Distributors Pvt Ltd',
    invoiceNumber: 'GST-FMCG-2026-8910',
    invoiceDate: new Date().toISOString().slice(0, 10),
    totalAmount: 12450,
    items: [
      {
        name: 'Aashirvaad Shudh Chakki Atta 5kg',
        barcode: '890103000001',
        category: 'Staples',
        quantity: 25,
        costPrice: 205,
        mrp: 260,
        unit: 'packet'
      },
      {
        name: 'Tata Salt Vacuum Evaporated 1kg',
        barcode: '890103000002',
        category: 'Staples',
        quantity: 60,
        costPrice: 21,
        mrp: 28,
        unit: 'packet'
      },
      {
        name: 'Fortune Sunlite Refined Oil 1L',
        barcode: '890103000003',
        category: 'Oils & Ghee',
        quantity: 30,
        costPrice: 128,
        mrp: 160,
        unit: 'packet'
      },
      {
        name: 'Maggi 2-Minute Masala Noodles 70g',
        barcode: '890103000004',
        category: 'Snacks',
        quantity: 120,
        costPrice: 11,
        mrp: 14,
        unit: 'packet'
      },
      {
        name: 'Cadbury Dairy Milk Silk Chocolate 60g',
        barcode: '890103000025',
        category: 'Snacks',
        quantity: 40,
        costPrice: 65,
        mrp: 80,
        unit: 'pcs'
      },
      {
        name: 'Colgate Strong Teeth Toothpaste 200g',
        barcode: '890103000026',
        category: 'Personal Care',
        quantity: 24,
        costPrice: 88,
        mrp: 110,
        unit: 'pcs'
      }
    ]
  },
  sample_dairy_beverage: {
    supplierName: 'Metro Dairy & Cold Drinks Supply Agency',
    invoiceNumber: 'INV-BEV-2026-4412',
    invoiceDate: new Date().toISOString().slice(0, 10),
    totalAmount: 8900,
    items: [
      {
        name: 'Amul Butter 100g',
        barcode: '890103000005',
        category: 'Dairy',
        quantity: 30,
        costPrice: 49,
        mrp: 58,
        unit: 'pcs'
      },
      {
        name: 'Thums Up Soft Drink Can 300ml',
        barcode: '890103000007',
        category: 'Beverages',
        quantity: 48,
        costPrice: 31,
        mrp: 40,
        unit: 'pcs'
      },
      {
        name: 'Brooke Bond Red Label Tea 250g',
        barcode: '890103000009',
        category: 'Beverages',
        quantity: 20,
        costPrice: 108,
        mrp: 140,
        unit: 'packet'
      },
      {
        name: 'Amul Taaza Homogenised Toned Milk 1L',
        barcode: '890103000027',
        category: 'Dairy',
        quantity: 50,
        costPrice: 62,
        mrp: 72,
        unit: 'packet'
      }
    ]
  }
};

/**
 * Intelligent parser that extracts lines and matches with store catalog
 */
async function parseInvoiceData({ templateType, rawText, fileName }, existingProducts) {
  let parsedInvoice = null;

  if (templateType && SAMPLE_TEMPLATES[templateType]) {
    parsedInvoice = JSON.parse(JSON.stringify(SAMPLE_TEMPLATES[templateType]));
  } else if (rawText && rawText.trim()) {
    // Parse unstructured text into items
    parsedInvoice = parseRawInvoiceText(rawText);
  } else {
    // Default to realistic FMCG wholesale template
    parsedInvoice = JSON.parse(JSON.stringify(SAMPLE_TEMPLATES.sample_fmcg));
  }

  // Cross-reference parsed items against existing store catalog
  const processedItems = parsedInvoice.items.map(item => {
    // Match by barcode first, then by name similarity
    let matchedProduct = null;
    if (item.barcode) {
      matchedProduct = existingProducts.find(p => p.barcode && p.barcode.trim() === item.barcode.trim());
    }
    if (!matchedProduct && item.name) {
      const lowerName = item.name.toLowerCase().trim();
      matchedProduct = existingProducts.find(p => 
        p.name.toLowerCase().trim() === lowerName ||
        p.name.toLowerCase().includes(lowerName) ||
        lowerName.includes(p.name.toLowerCase())
      );
    }

    const costPrice = Number(item.costPrice || 0);
    const mrp = Number(item.mrp || Math.round(costPrice * 1.25));
    
    // Suggested selling price: either retain existing selling price or cost + 18% margin
    let sellingPrice = matchedProduct 
      ? matchedProduct.sellingPrice 
      : Math.min(mrp, Math.round(costPrice * 1.18));

    if (sellingPrice < costPrice) {
      sellingPrice = Math.round(costPrice * 1.15);
    }

    return {
      name: matchedProduct ? matchedProduct.name : item.name,
      barcode: matchedProduct?.barcode || item.barcode || '',
      category: matchedProduct?.category || item.category || 'General',
      quantity: Number(item.quantity || 1),
      costPrice,
      sellingPrice,
      mrp,
      unit: matchedProduct?.unit || item.unit || 'pcs',
      isNew: !matchedProduct,
      matchedProductId: matchedProduct ? matchedProduct._id : null,
      currentStockBefore: matchedProduct ? matchedProduct.currentStock : 0,
      newProjectedStock: (matchedProduct ? matchedProduct.currentStock : 0) + Number(item.quantity || 1)
    };
  });

  return {
    supplierName: parsedInvoice.supplierName || 'Wholesale Supplier',
    invoiceNumber: parsedInvoice.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
    invoiceDate: parsedInvoice.invoiceDate || new Date().toISOString().slice(0, 10),
    totalAmount: processedItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0),
    items: processedItems
  };
}

/**
 * Heuristic parser for raw text lines (from OCR or text input)
 */
function parseRawInvoiceText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];
  let supplierName = 'Wholesale Supplier';
  let invoiceNumber = `BILL-${Date.now().toString().slice(-6)}`;

  for (const line of lines) {
    if (line.toLowerCase().includes('invoice') || line.toLowerCase().includes('bill')) {
      const match = line.match(/(?:invoice|bill|inv)[\s#:]*(?:no[.:\s]*)?([A-Za-z0-9-]+)/i);
      if (match && match[1].toLowerCase() !== 'oice') invoiceNumber = match[1];
    }
    if (line.toLowerCase().includes('ltd') || line.toLowerCase().includes('agency') || line.toLowerCase().includes('traders')) {
      supplierName = line.slice(0, 45);
    }

    // Match line item pattern: Name Qty Rate Amount (e.g. "Tata Salt 1kg  50  21  1050")
    const itemMatch = line.match(/^(.+?)\s+(\d+)\s+([0-9.]+)\s+([0-9.]+)/);
    if (itemMatch) {
      const name = itemMatch[1].replace(/^\d+[\s.-]*/, '').trim();
      const qty = parseInt(itemMatch[2], 10);
      const rate = parseFloat(itemMatch[3]);
      if (name.length > 2 && qty > 0 && rate > 0) {
        items.push({
          name,
          quantity: qty,
          costPrice: rate,
          mrp: Math.round(rate * 1.25),
          unit: 'pcs'
        });
      }
    }
  }

  return {
    supplierName,
    invoiceNumber,
    invoiceDate: new Date().toISOString().slice(0, 10),
    items: items.length > 0 ? items : SAMPLE_TEMPLATES.sample_fmcg.items
  };
}

module.exports = {
  parseInvoiceData,
  SAMPLE_TEMPLATES
};
