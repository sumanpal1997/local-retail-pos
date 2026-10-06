const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', productController.getProducts);
router.get('/barcode/:barcode', productController.lookupByBarcode);
router.get('/low-stock', productController.getLowStock);
router.post('/scan-invoice', productController.scanInvoice);
router.post('/confirm-invoice-restock', productController.confirmInvoiceRestock);
router.get('/purchase-invoices', productController.getPurchaseInvoices);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
