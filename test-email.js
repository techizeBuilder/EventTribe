import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Testing email configuration...');
console.log('Environment variables:');
console.log('MAIL_HOST:', process.env.MAIL_HOST);
console.log('MAIL_PORT:', process.env.MAIL_PORT);
console.log('MAIL_USERNAME:', process.env.MAIL_USERNAME);
console.log('MAIL_FROM_ADDRESS:', process.env.MAIL_FROM_ADDRESS);
console.log('MAIL_FROM_NAME:', process.env.MAIL_FROM_NAME);

async function testEmail() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.MAIL_PORT) || 2525,
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME || '47974993873f54',
        pass: process.env.MAIL_PASSWORD || '1fdcda65438582'
      }
    });

    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    console.log('Sending test email...');
    const testMailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'Event Tribe'}" <${process.env.MAIL_FROM_ADDRESS || 'jeetu.mj123@example.com'}>`,
      to: 'jeetu.mj123@gmail.com',
      subject: 'Test Email - EventTribe Configuration',
      html: `
        <h2>Email Test Successful!</h2>
        <p>This is a test email to verify your email configuration is working.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
        <hr>
        <p>Environment Variables:</p>
        <ul>
          <li>MAIL_HOST: ${process.env.MAIL_HOST}</li>
          <li>MAIL_PORT: ${process.env.MAIL_PORT}</li>
          <li>MAIL_USERNAME: ${process.env.MAIL_USERNAME}</li>
          <li>MAIL_FROM_ADDRESS: ${process.env.MAIL_FROM_ADDRESS}</li>
        </ul>
      `
    };

    const result = await transporter.sendMail(testMailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(result));

  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
  }
}

testEmail();