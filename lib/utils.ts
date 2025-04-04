import nodemailer from 'nodemailer';

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email sending function
interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string; // Plain text alternative
  replyTo?: string;
  attachments?: any[];
}

export async function sendEmail({ 
  to, 
  subject, 
  html, 
  text, 
  replyTo, 
  attachments = [] 
}: EmailParams): Promise<boolean> {
  try {
    // Create a test account if no SMTP credentials provided
    // In production, use real SMTP credentials
    let testAccount;
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      testAccount = await nodemailer.createTestAccount();
    }

    const transportConfig: any = {
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || testAccount?.user,
        pass: process.env.SMTP_PASS || testAccount?.pass,
      },
      // Enhanced security and deliverability settings
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false
      }
    };

    // Add DKIM configuration if available in environment
    if (process.env.DKIM_PRIVATE_KEY && process.env.DKIM_DOMAIN_NAME && process.env.DKIM_KEY_SELECTOR) {
      transportConfig.dkim = {
        domainName: process.env.DKIM_DOMAIN_NAME,
        keySelector: process.env.DKIM_KEY_SELECTOR,
        privateKey: process.env.DKIM_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    // Create plaintext version if not provided
    const plainText = text || html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Prepare email with best-practices headers
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Gurukul Learning Platform" <noreply@${process.env.DKIM_DOMAIN_NAME || 'gurukul.com'}>`,
      to,
      subject,
      html,
      text: plainText,
      replyTo: replyTo || process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM,
      attachments,
      // Email headers for better deliverability
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
        'X-Mailer': 'Gurukul Learning Platform Mailer',
        'List-Unsubscribe': `<mailto:unsubscribe@${process.env.DKIM_DOMAIN_NAME || 'gurukul.com'}?subject=Unsubscribe>`,
      }
    });

    console.log('Email sent:', info.messageId);
    
    // If using Ethereal, log URL to preview the email
    if (testAccount) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Other utility functions can be added here
export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Function to validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
} 