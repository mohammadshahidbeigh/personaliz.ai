import twilio from 'twilio';

interface WhatsAppMessageRequest {
  to: string;
  mediaUrl: string;
  body: string;
}

interface WhatsAppMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  mediaUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

class WhatsAppService {
  private client: twilio.Twilio | null = null;
  private config: {
    accountSid: string;
    authToken: string;
    whatsappNumber: string;
  };

  constructor() {
    this.config = {
      accountSid: process.env.TWILIO_SID || '',
      authToken: process.env.TWILIO_TOKEN || '',
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || ''
    };

    if (this.config.accountSid && this.config.authToken) {
      this.client = twilio(this.config.accountSid, this.config.authToken);
      console.log('✅ Twilio WhatsApp client initialized');
    } else {
      console.warn('⚠️ Twilio credentials not found in environment variables');
    }
  }

  /**
   * Send WhatsApp message with media using Twilio
   */
  async sendMessage({ to, mediaUrl, body }: WhatsAppMessageRequest): Promise<WhatsAppMessageResponse> {
    if (!this.client) {
      throw new Error('Twilio client not initialized. Check your TWILIO_SID and TWILIO_TOKEN environment variables.');
    }

    if (!this.config.whatsappNumber) {
      throw new Error('TWILIO_WHATSAPP_NUMBER not configured');
    }

    try {
      console.log(`📱 Sending WhatsApp message to ${to} with media: ${mediaUrl}`);

      // Format phone number for WhatsApp (ensure it starts with whatsapp:)
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const formattedFrom = this.config.whatsappNumber.startsWith('whatsapp:') 
        ? this.config.whatsappNumber 
        : `whatsapp:${this.config.whatsappNumber}`;

      const message = await this.client.messages.create({
        from: formattedFrom,
        to: formattedTo,
        body: body,
        mediaUrl: [mediaUrl], // Twilio supports array of media URLs
        // Additional WhatsApp-specific parameters
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID, // Optional
        statusCallback: process.env.WEBHOOK_BASE_URL + '/api/webhook/whatsapp' // Webhook for status updates
      });

      console.log(`✅ WhatsApp message sent successfully: ${message.sid}`);

      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        mediaUrl: mediaUrl
      };

    } catch (error: any) {
      console.error('❌ Error sending WhatsApp message:', error.message);
      
      return {
        sid: '',
        status: 'failed',
        to: to,
        from: this.config.whatsappNumber,
        body: body,
        mediaUrl: mediaUrl,
        errorCode: error.code,
        errorMessage: error.message
      };
    }
  }

  /**
   * Alternative implementation using WATI API
   */
  async sendMessageWithWATI({ to, mediaUrl, body }: WhatsAppMessageRequest): Promise<WhatsAppMessageResponse> {
    const watiApiKey = process.env.WATI_API_KEY;
    const watiBaseUrl = process.env.WATI_BASE_URL;

    if (!watiApiKey || !watiBaseUrl) {
      throw new Error('WATI credentials not configured. Set WATI_API_KEY and WATI_BASE_URL environment variables.');
    }

    try {
      console.log(`📱 Sending WhatsApp message via WATI to ${to}`);

      // WATI API implementation
      const response = await fetch(`${watiBaseUrl}/api/v1/sendSessionMessage/${to}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${watiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageText: body,
          mediaURL: mediaUrl,
          messageType: 'video' // or 'audio' based on media type
        })
      });

      const data = await response.json() as any;

      if (!response.ok) {
        throw new Error(`WATI API error: ${data.message || 'Unknown error'}`);
      }

      console.log(`✅ WhatsApp message sent via WATI successfully`);

      return {
        sid: data.id || data.messageId || '',
        status: 'sent',
        to: to,
        from: 'WATI',
        body: body,
        mediaUrl: mediaUrl
      };

    } catch (error: any) {
      console.error('❌ Error sending WhatsApp message via WATI:', error.message);
      
      return {
        sid: '',
        status: 'failed',
        to: to,
        from: 'WATI',
        body: body,
        mediaUrl: mediaUrl,
        errorMessage: error.message
      };
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): boolean {
    // Basic phone number validation (international format)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[^\d+]/g, ''));
  }

  /**
   * Format phone number for WhatsApp
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let formatted = phone.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, add it
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    
    return formatted;
  }
}

export default new WhatsAppService();
