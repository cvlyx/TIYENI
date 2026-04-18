import config from '@/config/environments';
import { Platform } from 'react-native';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface SMSSOptions {
  to: string;
  message: string;
}

export interface NotificationServiceResponse {
  success: boolean;
  message: string;
  error?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private emailConfig = config.emailConfig;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Email Service Methods
  async sendEmail(options: EmailOptions): Promise<NotificationServiceResponse> {
    try {
      if (!this.emailConfig) {
        throw new Error('Email configuration not available');
      }

      // For mobile app, we'll use a backend API endpoint
      if (Platform.OS !== 'web') {
        return this.sendEmailViaAPI(options);
      }

      // For web, we can use nodemailer through the backend
      return this.sendEmailViaAPI(options);
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async sendEmailViaAPI(options: EmailOptions): Promise<NotificationServiceResponse> {
    try {
      const response = await fetch(`${config.apiUrl}/notifications/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
          attachments: options.attachments,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: 'Email sent successfully',
        ...result,
      };
    } catch (error) {
      console.error('API email send failed:', error);
      return {
        success: false,
        message: 'Failed to send email via API',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // SMS Service Methods
  async sendSMS(options: SMSSOptions): Promise<NotificationServiceResponse> {
    try {
      // For mobile app, we'll use a backend API endpoint
      if (Platform.OS !== 'web') {
        return this.sendSMSViaAPI(options);
      }

      // For web, use API as well
      return this.sendSMSViaAPI(options);
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return {
        success: false,
        message: 'Failed to send SMS',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async sendSMSViaAPI(options: SMSSOptions): Promise<NotificationServiceResponse> {
    try {
      const response = await fetch(`${config.apiUrl}/notifications/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: options.to,
          message: options.message,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: 'SMS sent successfully',
        ...result,
      };
    } catch (error) {
      console.error('API SMS send failed:', error);
      return {
        success: false,
        message: 'Failed to send SMS via API',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // OTP Sending Methods
  async sendOTP(phone: string, email: string, otp: string, method: 'sms' | 'email' | 'both' = 'both'): Promise<NotificationServiceResponse> {
    const results: NotificationServiceResponse[] = [];

    // Send SMS OTP
    if (method === 'sms' || method === 'both') {
      const smsResult = await this.sendSMS({
        to: phone,
        message: `Your Tiyeni verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`,
      });
      results.push(smsResult);
    }

    // Send Email OTP
    if (method === 'email' || method === 'both') {
      const emailResult = await this.sendEmail({
        to: email,
        subject: 'Tiyeni - Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Tiyeni</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your Trusted Transport Partner</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Verification Code</h2>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #059669; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 5px;">${otp}</span>
              </div>
              
              <p style="color: #64748b; margin: 20px 0; line-height: 1.6;">
                This verification code will expire in <strong>10 minutes</strong>. 
                Please do not share this code with anyone for your security.
              </p>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Security Notice:</strong> If you didn't request this code, please ignore this email 
                  and consider securing your account.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 14px;">
              <p>© 2024 Tiyeni. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        `,
      });
      results.push(emailResult);
    }

    // Return combined result
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return {
      success: successCount > 0,
      message: `OTP sent via ${successCount}/${totalCount} methods`,
      error: successCount === 0 ? 'All methods failed' : undefined,
    };
  }

  // Welcome Email
  async sendWelcomeEmail(email: string, name: string): Promise<NotificationServiceResponse> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Tiyeni! Your Journey Starts Here',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Tiyeni!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${name}, we're excited to have you on board</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Your Adventure Begins!</h2>
            
            <p style="color: #64748b; margin: 20px 0; line-height: 1.6;">
              Thank you for joining Tiyeni, Malawi's premier transport and parcel delivery platform. 
              You're now ready to:
            </p>
            
            <ul style="color: #64748b; line-height: 1.8; margin: 20px 0;">
              <li>Find reliable transport across Malawi</li>
              <li>Send parcels safely and affordably</li>
              <li>Connect with verified drivers and couriers</li>
              <li>Track your deliveries in real-time</li>
            </ul>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
              <h3 style="color: #065f46; margin: 0 0 10px 0;">Getting Started</h3>
              <p style="color: #047857; margin: 0; line-height: 1.6;">
                Download our mobile app and complete your profile to start using all features. 
                Make sure to verify your identity for enhanced security and trust.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 14px;">
            <p>© 2024 Tiyeni. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
    });
  }

  // Trip Confirmation Email
  async sendTripConfirmation(email: string, tripDetails: any): Promise<NotificationServiceResponse> {
    return this.sendEmail({
      to: email,
      subject: 'Trip Confirmation - Tiyeni',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Trip Confirmed!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your journey is all set</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Trip Details</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0; color: #64748b;"><strong>From:</strong> ${tripDetails.from}</p>
              <p style="margin: 10px 0; color: #64748b;"><strong>To:</strong> ${tripDetails.to}</p>
              <p style="margin: 10px 0; color: #64748b;"><strong>Date:</strong> ${tripDetails.date}</p>
              <p style="margin: 10px 0; color: #64748b;"><strong>Time:</strong> ${tripDetails.time}</p>
              <p style="margin: 10px 0; color: #64748b;"><strong>Price:</strong> MWK ${tripDetails.price}</p>
            </div>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;">
                <strong>Important:</strong> Please arrive 15 minutes before departure time. 
                Keep this confirmation handy for boarding.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 14px;">
            <p>© 2024 Tiyeni. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
    });
  }

  // Password Reset Email
  async sendPasswordReset(email: string, resetToken: string): Promise<NotificationServiceResponse> {
    return this.sendEmail({
      to: email,
      subject: 'Password Reset - Tiyeni',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Secure your account</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
            
            <p style="color: #64748b; margin: 20px 0; line-height: 1.6;">
              We received a request to reset your password. Click the button below to set a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${config.apiUrl}/auth/reset-password?token=${resetToken}" 
                 style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Security Notice:</strong> This link will expire in 1 hour. 
                If you didn't request this reset, please ignore this email.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 14px;">
            <p>© 2024 Tiyeni. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
    });
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
