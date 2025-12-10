/**
 * Email Service using Resend
 * Modern, reliable email delivery
 */

import { Resend } from 'resend';
import { generateSecureToken } from './crypto-utils';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

if (!RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY not set. Email functionality will be disabled.');
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Generate 6-digit reset code
function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!resend) {
    console.error('❌ Cannot send email: RESEND_API_KEY not configured');
    throw new Error('Email service not configured. Please contact support.');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: params.from || FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`✅ Email sent successfully to ${params.to} (ID: ${data?.id})`);
    return true;
  } catch (error) {
    console.error('❌ Resend email error:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string = 'Champion'
): Promise<boolean> {
  // Create deep link for the app
  const resetLink = `exp://localhost:8081/--/(auth)/reset-password?token=${resetToken}`;
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Thryvin Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F5F5F5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F5F5F5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          
          <!-- Header with Gradient & Your Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #A259FF 0%, #FF4EC7 100%); padding: 40px 30px; text-align: center;">
              <!-- Your actual Thryvin logo -->
              <div style="background: rgba(255,255,255,0.95); width: 120px; height: 120px; margin: 0 auto; border-radius: 60px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(0,0,0,0.15);">
                <img src="https://i.imgur.com/placeholder-thryvin-logo.png" alt="Thryvin" style="width: 100px; height: 100px; object-fit: contain;" />
              </div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 45px 35px; background: #ffffff;">
              <div style="text-align: center; margin-bottom: 25px;">
                <span style="font-size: 52px;">🔐</span>
              </div>
              
              <h2 style="margin: 0 0 16px 0; color: #222222; font-size: 28px; font-weight: 800; text-align: center; letter-spacing: -0.5px;">
                Reset Your Password
              </h2>
              
              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.7; text-align: center;">
                Hey ${userName}! 👋<br/>
                We got your request to reset your Thryvin password.<br/>
                Let's get you back to crushing your fitness goals! 💪
              </p>
              
              <!-- Reset Button -->
              <table role="presentation" style="width: 100%; margin: 0 0 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #A259FF 0%, #FF4EC7 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 50px; font-size: 18px; font-weight: 700; box-shadow: 0 8px 25px rgba(162, 89, 255, 0.35); text-align: center;">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="background: #FFF8E1; border-left: 4px solid #FFC107; padding: 16px; border-radius: 10px; margin: 0 0 25px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                  <strong>⏰ This link expires in 1 hour</strong><br/>
                  For security, this reset link can only be used once.
                </p>
              </div>
              
              <div style="background: #F8F9FA; border-radius: 10px; padding: 18px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                  Button not working? Copy and paste this link:
                </p>
                <p style="margin: 0; color: #A259FF; font-size: 12px; word-break: break-all;">
                  ${resetLink}
                </p>
              </div>
              
              <p style="margin: 25px 0 0 0; color: #999999; font-size: 13px; text-align: center; line-height: 1.6;">
                Didn't request this? You can safely ignore this email.<br/>
                Your account is secure and no changes have been made.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #F8F9FA; padding: 30px; text-align: center; border-top: 1px solid #E8E8E8;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                Need help? <a href="mailto:support@thryvin.com" style="color: #A259FF; text-decoration: none; font-weight: 600;">Contact Support</a>
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Thryvin · Keep Thriving! 🚀
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

  return await sendEmail({
    to: email,
    subject: '🔐 Reset Your Thryvin Password',
    html: htmlContent,
  });
}
