import sgMail from '@sendgrid/mail';

// Use your SendGrid API key from Replit secrets
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'jakepmwest@gmail.com', // Change this to any email you want to test
  from: 'noreply@thryvin.app', // Must match your verified domain in SendGrid
  subject: 'Test Email from Thryvin ✅',
  text: 'This is a test email from your app!',
  html: '<p><strong>This is a test email from your app! 🎯</strong></p>',
};

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Test email sent!');
  })
  .catch((error) => {
    console.error('❌ Email failed:', error.response.body.errors);
  });