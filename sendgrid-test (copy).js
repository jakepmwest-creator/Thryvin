const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'jakepmwest@gmail.com',
  from: 'noreply@thriven.app', // must match your verified domain
  subject: 'Test Email from Thryvin ✅',
  text: 'It works!',
  html: '<p><strong>It works!</strong></p>',
};

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Test email sent!');
  })
  .catch((error) => {
    console.error('❌ Email failed:', error.response.body.errors);
  });
