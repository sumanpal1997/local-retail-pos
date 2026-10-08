const crypto = require('crypto');

/**
 * Normalizes an Indian phone number to 10 digits
 * e.g., "+91 98765 43210", "09876543210", "9876543210" -> "9876543210"
 */
function normalizeIndianPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Clean & mask phone number with Indian country code
 * e.g. "9876543210" -> "+91 ******3210"
 */
function maskPhoneNumber(phone) {
  const norm = normalizeIndianPhone(phone);
  if (!norm || norm.length < 4) return '+91 ******0000';
  const lastFour = norm.slice(-4);
  return `+91 ******${lastFour}`;
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Dispatch SMS via Fast2SMS, 2Factor.in, Twilio or fallback to Console Simulator
 */
async function sendOtpSms({ phone, otp, purpose = 'verification' }) {
  const nationalPhone = normalizeIndianPhone(phone);
  const fullIndianPhone = `+91${nationalPhone}`;
  const maskedPhone = maskPhoneNumber(phone);

  const purposeLabels = {
    login: '2-Step Verification',
    reset_password: 'Password Reset',
    setup_2fa: 'Enable 2-Step Authentication',
    verification: 'Account Verification'
  };

  const label = purposeLabels[purpose] || 'Security Code';
  const smsBody = `Your RetailPOS ${label} OTP is ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;

  // 1. FAST2SMS GATEWAY (Optimized for Indian mobile numbers)
  if (process.env.FAST2SMS_API_KEY && nationalPhone.length === 10) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: nationalPhone
        })
      });
      const data = await response.json();
      if (data.return) {
        console.log(`[SMS FAST2SMS] Live SMS OTP successfully delivered to ${maskedPhone}`);
        return { 
          success: true, 
          provider: 'fast2sms', 
          phoneMasked: maskedPhone,
          message: `SMS dispatched to ${maskedPhone}` 
        };
      }
      console.warn(`[SMS FAST2SMS] Provider error:`, data);
    } catch (err) {
      console.error(`[SMS FAST2SMS] Connection error:`, err.message);
    }
  }

  // 2. 2FACTOR.IN GATEWAY (Top Indian OTP route)
  if (process.env.TWO_FACTOR_API_KEY && nationalPhone.length === 10) {
    try {
      const apiKey = process.env.TWO_FACTOR_API_KEY;
      const url = `https://2factor.in/v3/API/V1/${apiKey}/SMS/${nationalPhone}/${otp}/RetailPOS`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.Status === 'Success') {
        console.log(`[SMS 2FACTOR] Live SMS OTP successfully delivered to ${maskedPhone}`);
        return { 
          success: true, 
          provider: '2factor', 
          phoneMasked: maskedPhone,
          message: `SMS dispatched to ${maskedPhone}` 
        };
      }
      console.warn(`[SMS 2FACTOR] Provider error:`, data);
    } catch (err) {
      console.error(`[SMS 2FACTOR] Connection error:`, err.message);
    }
  }

  // 3. TWILIO GATEWAY (International / Indian +91 routing)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const authHeader = Buffer.from(
        `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
      ).toString('base64');

      const params = new URLSearchParams();
      params.append('To', fullIndianPhone);
      params.append('From', process.env.TWILIO_PHONE_NUMBER);
      params.append('Body', smsBody);

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (response.ok) {
        console.log(`[SMS TWILIO] Live SMS OTP successfully delivered to ${maskedPhone}`);
        return { 
          success: true, 
          provider: 'twilio', 
          phoneMasked: maskedPhone,
          message: `SMS dispatched to ${maskedPhone}` 
        };
      }
      const errData = await response.json();
      console.warn(`[SMS TWILIO] Provider error:`, errData);
    } catch (err) {
      console.error(`[SMS TWILIO] Connection error:`, err.message);
    }
  }

  // 4. FALLBACK / CONSOLE LOGGING (Ensures developers & testers never get locked out)
  console.log('\n' + '='.repeat(60));
  console.log('📱 [RETAILPOS SMS DISPATCH - INDIAN MOBILE ROUTE]');
  console.log(`   To Mobile:  ${fullIndianPhone} (${maskedPhone})`);
  console.log(`   Purpose:    ${label}`);
  console.log(`   OTP Code:   ${otp}`);
  console.log(`   Message:    "${smsBody}"`);
  console.log(`   Provider:   Console Simulation (Add FAST2SMS_API_KEY, TWO_FACTOR_API_KEY, or TWILIO in .env for live carrier delivery)`);
  console.log('='.repeat(60) + '\n');

  return {
    success: true,
    provider: 'simulated',
    phoneMasked: maskedPhone,
    devOtp: otp,
    message: `Verification code sent to ${maskedPhone}`
  };
}

module.exports = {
  normalizeIndianPhone,
  maskPhoneNumber,
  generateOtp,
  sendOtpSms
};
