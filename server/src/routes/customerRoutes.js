const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.createCustomer);
router.post('/:id/pay', customerController.recordPayment);
router.post('/:id/credit', customerController.recordCredit);

module.exports = router;
