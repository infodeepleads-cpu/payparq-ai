const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail() {
  try {
    const templateFile = process.argv[2] || 'email-template-outreach.html';
    const htmlPath = path.join(__dirname, templateFile);
    const html = fs.readFileSync(htmlPath, 'utf-8');

    const subject = templateFile.includes('hr')
      ? 'Payparq - Više od parkiranja. Više mogućnosti.'
      : 'Payparq - More than parking. More possibilities.';

    const response = await resend.emails.send({
      from: 'Payparq <onboarding@resend.dev>',
      to: 'kzamic@gmail.com',
      subject: subject,
      html: html,
    });

    if (response && response.id) {
      console.log('✓ Email sent successfully!');
      console.log('Email ID:', response.id);
      console.log('To: payparq@outlook.com');
      process.exit(0);
    } else {
      console.log('✓ Email sent!');
      console.log('Response:', JSON.stringify(response, null, 2));
      process.exit(0);
    }
  } catch (error) {
    console.error('✗ Error sending email:', error.message);
    process.exit(1);
  }
}

sendEmail();
