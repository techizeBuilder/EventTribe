// Quick working email test
const nodemailer = require('nodemailer');

console.log('🧪 Testing Pay Later Email (Simple Version)...\n');

// Create transporter
const transporter = nodemailer.createTransporter({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '47974993873f54',
    pass: '1fdcda65438582'
  }
});

const testData = {
  to: 'jeetu.mj123@gmail.com',
  userName: 'Test User',
  totalAmount: 100,
  bookings: [
    {
      eventTitle: 'Garba Party Event',
      ticketType: 'General Admission',
      quantity: 1,
      amount: 50,
      bookingCode: 'ABC123'
    }
  ]
};

console.log('📧 Sending test email to:', testData.to);

const emailOptions = {
  from: '"Event Tribe" <jeetu.mj123@example.com>',
  to: testData.to,
  subject: '🎫 Pay Later Booking Confirmed - Your Verification Codes',
  html: `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: #059669; color: white; padding: 20px; text-align: center;">
        <h1>EVENT TRIBE</h1>
        <p>💳 Pay Later Booking Confirmed!</p>
      </div>
      
      <div style="padding: 20px; background: white;">
        <h2>Hi ${testData.userName}!</h2>
        <p>Your Pay Later booking has been confirmed! Show these codes at each event:</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <h4 style="color: #dc2626;">${testData.bookings[0].eventTitle}</h4>
          <p><strong>Ticket:</strong> ${testData.bookings[0].ticketType}</p>
          <p><strong>Amount:</strong> $${testData.bookings[0].amount}</p>
          <div style="background: #fef3c7; padding: 10px; text-align: center;">
            <p style="font-size: 24px; font-weight: bold; color: #92400e;">
              ${testData.bookings[0].bookingCode}
            </p>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px;">
          <p><strong>Total Amount Due:</strong> $${testData.totalAmount}</p>
          <p><strong>Booking Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  `
};

transporter.sendMail(emailOptions)
  .then((result) => {
    console.log('\n✅ SUCCESS! Email sent successfully!');
    console.log('📮 Message ID:', result.messageId);
    console.log('📧 Email sent to:', testData.to);
    console.log('\n🎯 Check your Mailtrap inbox now!');
    console.log('🌐 Go to: https://mailtrap.io/inboxes');
  })
  .catch((error) => {
    console.log('\n❌ FAILED! Email could not be sent:');
    console.error('Error:', error.message);
  });