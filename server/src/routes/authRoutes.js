const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public Authentication Endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-2fa', authController.verifyTwoFactor);
router.post('/resend-2fa-otp', authController.resendTwoFactorOtp);

// Forgot Password & Reset Endpoints via Mobile OTP
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

// Protected Two-Factor Security Settings (Logged-in Store)
router.post('/2fa/request-setup', auth, authController.requestTwoFactorSetup);
router.post('/2fa/confirm-enable', auth, authController.confirmTwoFactorEnable);
router.post('/2fa/disable', auth, authController.disableTwoFactor);

// Protected Profile Endpoints
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);

module.exports = router;
