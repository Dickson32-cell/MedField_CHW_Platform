/**
 * SMS Gateway Service
 * Supports Africa's Talking and Twilio for SMS notifications
 */

const axios = require('axios');

class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'africastalking';
    this.apiKey = process.env.SMS_API_KEY || '';
    this.shortCode = process.env.SMS_SHORTCODE || '';
    this.from = process.env.SMS_SENDER || 'MedField';
  }

  /**
   * Send SMS via Africa's Talking
   */
  async sendViaAfricasTalking(to, message) {
    try {
      const response = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        {
          username: 'sandbox',
          to: to,
          message: message,
          from: this.from
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': this.apiKey
          }
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendViaTwilio(to, message) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        new URLSearchParams({
          To: to,
          From: this.from,
          Body: message
        }),
        {
          auth: {
            username: accountSid,
            password: authToken
          }
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Send SMS (provider agnostic)
   */
  async send(to, message) {
    // Format phone number
    const formattedTo = this.formatPhoneNumber(to);

    if (this.provider === 'africastalking') {
      return this.sendViaAfricasTalking(formattedTo, message);
    } else if (this.provider === 'twilio') {
      return this.sendViaTwilio(formattedTo, message);
    } else {
      return { success: false, error: 'Unknown SMS provider' };
    }
  }

  /**
   * Format phone number to E.164 format
   */
  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Add country code if not present (default to +254 for Kenya)
    if (!phone.startsWith('+')) {
      if (digits.length === 10) {
        return `+1${digits}`; // US
      } else if (digits.length === 12) {
        return `+${digits}`;
      }
    }
    return phone;
  }

  /**
   * Send referral notification
   */
  async sendReferralNotification(referral, patient, facility) {
    const message = `MedField Alert: Referral for ${patient.first_name} ${patient.last_name}. ` +
      `Please expect patient at your facility. Reference: ${referral.referral_number}. ` +
      `Reason: ${referral.referral_reason}`;

    return this.send(facility.phone, message);
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(patient, date, facility) {
    const message = `MedField Reminder: ${patient.first_name}, you have an appointment at ${facility.name} on ${new Date(date).toLocaleDateString()}. Please arrive on time.`;

    return this.send(patient.phone, message);
  }

  /**
   * Send stock alert
   */
  async sendStockAlert(chw, supply, currentLevel) {
    const message = `MedField Alert: Low stock alert for ${supply.name}. Current level: ${currentLevel}. Please restock soon.`;

    return this.send(chw.phone, message);
  }
}

module.exports = new SMSService();
