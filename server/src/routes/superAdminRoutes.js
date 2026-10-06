const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');

// Super Admin analytics & management endpoints
router.get('/overview', superAdminController.getOverview);
router.put('/stores/:id', superAdminController.updateStore);
router.post('/stores', superAdminController.createStore);

module.exports = router;
