/**
 * utils/sendSMS.js
 * 
 * SMS sending utility using console logging for development
 * In production, integrate with Twilio, MSG91, or other SMS providers
 */

import env from '../config/env.js';

/**
 * Send SMS (development mode: logs to console)
 * 
 * @param {string} phone - Phone number with country code
 * @param {string} message - SMS message
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
export async function sendSMS(phone, message) {
  // Development mode - just log to console
  if (env.NODE_ENV === 'development' || !env.SMS_API_KEY) {
    console.log('\n========================================');
    console.log('📱 SMS (DEV MODE)');
    console.log('----------------------------------------');
    console.log(`To: ${phone}`);
    console.log(`Message: ${message}`);
    console.log('========================================\n');
    
    return {
      success: true,
      messageId: `dev_${Date.now()}`,
      mode: 'development',
    };
  }

  // Production mode - integrate with SMS provider
  // Example with Twilio (uncomment and configure)
  /*
  try {
    const twilio = require('twilio')(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    
    const result = await twilio.messages.create({
      body: message,
      from: env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    
    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error) {
    console.error('[SMS] Failed to send:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
  */

  // Fallback
  return {
    success: true,
    messageId: `mock_${Date.now()}`,
  };
}

/**
 * Send OTP via SMS
 */
export async function sendOTPSMS(phone, otp) {
  const message = `Your MedStore verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
  return sendSMS(phone, message);
}

export default sendSMS;
