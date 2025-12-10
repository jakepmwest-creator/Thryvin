/**
 * Mock Email Service for Testing
 * This will log emails to console and save them to a file
 * Use this when SendGrid is not configured
 */

import * as fs from 'fs';
import * as path from 'path';

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Store sent emails for testing
const EMAILS_LOG_PATH = path.join(__dirname, 'sent-emails.log');

export async function sendEmailMock(params: EmailParams): Promise<boolean> {
  console.log('\n========================================');
  console.log('📧 MOCK EMAIL SENT (Testing Mode)');
  console.log('========================================');
  console.log('To:', params.to);
  console.log('From:', params.from);
  console.log('Subject:', params.subject);
  console.log('\n--- Email Content ---');
  if (params.text) {
    console.log(params.text);
  }
  if (params.html) {
    console.log('\n(HTML version also available)');
  }
  console.log('========================================\n');

  // Save to log file
  const logEntry = `
================================================================================
Date: ${new Date().toISOString()}
To: ${params.to}
From: ${params.from}
Subject: ${params.subject}
--------------------------------------------------------------------------------
${params.text || '(HTML only)'}
================================================================================

`;

  try {
    fs.appendFileSync(EMAILS_LOG_PATH, logEntry);
    console.log(`✅ Email logged to: ${EMAILS_LOG_PATH}`);
  } catch (error) {
    console.error('Error logging email:', error);
  }

  return true;
}

export async function sendPasswordResetEmailMock(
  email: string,
  resetToken: string,
  userName: string = 'User'
): Promise<boolean> {
  const FROM_EMAIL = 'noreply@thryvin.com';

  const textContent = `
Hi ${userName},

You requested to reset your password for your Thryvin account.

Your password reset code is: ${resetToken}

This code will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

Thanks,
The Thryvin Team
`;

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
        <table role="presentation" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
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
              
              <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                <strong>This code will expire in 1 hour.</strong>
              </p>
              
              <p style="margin: 0 0 20px 0; color: #888888; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background: #F8F9FA; padding: 30px; text-align: center; border-top: 1px solid #E0E0E0;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
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

  return await sendEmailMock({
    to: email,
    from: FROM_EMAIL,
    subject: 'Reset Your Thryvin Password',
    text: textContent,
    html: htmlContent,
  });
}
