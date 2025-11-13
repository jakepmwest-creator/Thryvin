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

export async function sendPasswordResetEmail(email: string, resetToken: string, userName: string = 'User'): Promise<boolean> {
  const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@thryvin.com';
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Thryvin Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #a259ff 0%, #3a86ff 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                THRYVIN
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">
                YOUR FITNESS JOURNEY
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #222222; font-size: 24px; font-weight: 700;">
                Reset Your Password
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                Hi ${userName},
              </p>
              
              <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your Thryvin account. If you didn't make this request, you can safely ignore this email.
              </p>
              
              <!-- Reset Token Box -->
              <table role="presentation" style="width: 100%; background: #F8F9FA; border-radius: 12px; padding: 20px; margin: 0 0 30px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Your Reset Code:
                    </p>
                    <p style="margin: 0; color: #a259ff; font-size: 28px; font-weight: 700; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                      ${resetToken}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                Enter this code in the app to reset your password. This code will expire in <strong>15 minutes</strong> for your security.
              </p>
              
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you're having trouble, you can also manually open the Thryvin app and go to the password reset screen.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #F8F9FA; padding: 30px; text-align: center; border-top: 1px solid #E8E8E8;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">
                Questions? Contact us at <a href="mailto:support@thryvin.com" style="color: #a259ff; text-decoration: none;">support@thryvin.com</a>
              </p>
              <p style="margin: 0; color: #CCCCCC; font-size: 12px;">
                © ${new Date().getFullYear()} Thryvin. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `Hi ${userName},\n\nWe received a request to reset your password for your Thryvin account.\n\nYour reset code: ${resetToken}\n\nEnter this code in the app to reset your password. This code will expire in 15 minutes.\n\nIf you didn't request this, you can safely ignore this email.\n\nThanks,\nThe Thryvin Team`;

  return sendEmail({
    to: email,
    from: FROM_EMAIL,
    subject: '🔐 Reset Your Thryvin Password',
    html: htmlContent,
    text: textContent,
  });
}
