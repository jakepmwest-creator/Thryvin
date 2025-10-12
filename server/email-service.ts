import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set. Email functionality will be disabled.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('Cannot send email: SENDGRID_API_KEY not configured');
    throw new Error('Email service not configured. Please contact support.');
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset - Thryvin' AI Coaching</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏋️ Thryvin' AI Coaching</h1>
          <h2>Password Reset Request</h2>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>We received a request to reset your password for your Thryvin' AI Coaching account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset My Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
          <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          <p>Keep thriving!<br>The Thryvin' Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Thryvin' AI Coaching. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Password Reset - Thryvin' AI Coaching
    
    Hi there,
    
    We received a request to reset your password for your Thryvin' AI Coaching account.
    
    To reset your password, click on this link or copy and paste it into your browser:
    ${resetUrl}
    
    This link will expire in 1 hour for security reasons.
    
    If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
    
    Keep thriving!
    The Thryvin' Team
  `;

  return await sendEmail({
    to: email,
    from: 'noreply@thryvin.app',
    subject: 'Reset Your Thryvin\' Password',
    text: textContent,
    html: htmlContent,
  });
}