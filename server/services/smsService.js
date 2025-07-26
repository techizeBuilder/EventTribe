import twilio from 'twilio';

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async sendOTP(phoneNumber, otp) {
    const message = `Your Event Management Platform verification code is: ${otp}. This code expires in 10 minutes.`;
    
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });
      
      console.log('OTP SMS sent:', result.sid);
      return { success: true, messageSid: result.sid };
    } catch (error) {
      console.error('Error sending OTP SMS:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPhoneChangeNotification(phoneNumber, userName) {
    const message = `Hi ${userName}, your phone number has been successfully updated on Event Management Platform. If this wasn't you, please contact support immediately.`;
    
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });
      
      console.log('Phone change notification sent:', result.sid);
      return { success: true, messageSid: result.sid };
    } catch (error) {
      console.error('Error sending phone change notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendSecurityAlert(phoneNumber, userName, activity) {
    const message = `Security Alert: ${activity} detected on your Event Management Platform account (${userName}). If this wasn't you, secure your account immediately.`;
    
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });
      
      console.log('Security alert SMS sent:', result.sid);
      return { success: true, messageSid: result.sid };
    } catch (error) {
      console.error('Error sending security alert SMS:', error);
      return { success: false, error: error.message };
    }
  }
}

export const smsService = new SMSService();