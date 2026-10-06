const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/dashboard-summary', reportController.getDashboardSummary);

module.exports = router;
