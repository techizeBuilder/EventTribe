import { authenticator } from 'otplib';
import crypto from 'crypto';

class OTPService {
  constructor() {
    // Store OTPs temporarily (in production, use Redis or database)
    this.otpStore = new Map();
    this.maxRetries = 3;
    this.otpExpiryMinutes = 10;
  }

  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  storeOTP(identifier, otp, type = 'verification') {
    const key = `${identifier}:${type}`;
    
    this.otpStore.set(key, {
      otp,
      attempts: 0,
      type
    });

    return { otp };
  }

  verifyOTP(identifier, inputOTP, type = 'verification') {
    const key = `${identifier}:${type}`;
    const otpData = this.otpStore.get(key);

    if (!otpData) {
      return { 
        success: false, 
        error: 'OTP not found',
        remainingAttempts: 0
      };
    }

    otpData.attempts += 1;

    if (otpData.attempts > this.maxRetries) {
      this.otpStore.delete(key);
      return { 
        success: false, 
        error: 'Maximum OTP attempts exceeded',
        remainingAttempts: 0
      };
    }

    if (otpData.otp === inputOTP) {
      this.otpStore.delete(key);
      return { 
        success: true, 
        message: 'OTP verified successfully'
      };
    }

    const remainingAttempts = this.maxRetries - otpData.attempts;
    return { 
      success: false, 
      error: 'Invalid OTP',
      remainingAttempts
    };
  }

  getOTPStatus(identifier, type = 'verification') {
    const key = `${identifier}:${type}`;
    const otpData = this.otpStore.get(key);

    if (!otpData) {
      return { exists: false };
    }

    const now = new Date();
    const timeRemaining = Math.max(0, Math.floor((otpData.expiresAt - now) / 1000));
    const attemptsRemaining = this.maxRetries - otpData.attempts;

    return {
      exists: true,
      timeRemaining,
      attemptsRemaining,
      expired: now > otpData.expiresAt
    };
  }

  clearOTP(identifier, type = 'verification') {
    const key = `${identifier}:${type}`;
    return this.otpStore.delete(key);
  }

  // Generate TOTP secret for 2FA setup (future enhancement)
  generateTOTPSecret() {
    return authenticator.generateSecret();
  }

  // Verify TOTP token (future enhancement)
  verifyTOTP(secret, token) {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      return false;
    }
  }
}

export const otpService = new OTPService();