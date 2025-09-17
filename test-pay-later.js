import nodemailer from 'nodemailer';

console.log('🧪 Testing Pay Later Email Functionality...\n');

// Test the email service directly
async function testPayLaterEmail() {
    try {
        // Create transporter with existing Mailtrap configuration
        const transporter = nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            secure: false,
            auth: {
                user: '47974993873f54',
                pass: '1fdcda65438582'
            }
        });

        console.log('📧 Created email transporter');

        // Test data matching the pay-later booking flow
        const testEmailData = {
            to: 'jeetu.mj123@gmail.com',
            userName: 'Test User',
            totalAmount: 150,
            bookings: [
                {
                    eventTitle: 'Garba Party Event',
                    bookingCode: 'ABC12345',
                    amount: 75,
                    ticketType: 'General Admission',
                    quantity: 1
                },
                {
                    eventTitle: 'Concert Night',
                    bookingCode: 'XYZ67890',
                    amount: 75,
                    ticketType: 'VIP Ticket',
                    quantity: 1
                }
            ]
        };

        console.log('📝 Test data prepared:', {
            recipient: testEmailData.to,
            userName: testEmailData.userName,
            totalAmount: testEmailData.totalAmount,
            bookingsCount: testEmailData.bookings.length
        });

        // Generate booking codes list HTML
        const bookingsList = testEmailData.bookings.map(booking => `
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #dc2626;">
                <h4 style="margin: 0 0 8px 0; color: #dc2626; font-size: 18px;">${booking.eventTitle}</h4>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Ticket Type:</strong> ${booking.ticketType}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Quantity:</strong> ${booking.quantity}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Amount:</strong> $${booking.amount}</p>
                <div style="background: #fef3c7; padding: 10px; border-radius: 5px; margin: 10px 0;">
                    <p style="margin: 0; font-size: 20px; font-weight: bold; color: #92400e; text-align: center; letter-spacing: 2px;">
                        ${booking.bookingCode}
                    </p>
                </div>
            </div>
        `).join('');

        // Create mail options
        const mailOptions = {
            from: '"Event Tribe" <jeetu.mj123@example.com>',
            to: testEmailData.to,
            subject: '🎫 Pay Later Booking Confirmed - Show Your Codes at Events',
            html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8f9fa;">
                    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">EVENT TRIBE</h1>
                        <p style="margin: 15px 0 0 0; font-size: 18px;">💳 Pay Later Booking Confirmed!</p>
                    </div>
                    
                    <div style="padding: 30px; background: white;">
                        <h2 style="color: #059669; margin: 0 0 20px 0; font-size: 24px;">Hi ${testEmailData.userName}!</h2>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #333;">
                            Your Pay Later booking has been confirmed! Below are your verification codes that you'll need to show at each event.
                        </p>
                        
                        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                            <h3 style="color: #dc2626; margin: 0 0 15px 0;">🚨 Important Instructions:</h3>
                            <ul style="color: #991b1b; margin: 10px 0; padding-left: 20px; line-height: 1.6;">
                                <li><strong>Show these codes to the organizer at each event</strong></li>
                                <li><strong>Bring cash to pay the amount due</strong></li>
                                <li><strong>Codes expire in 30 days</strong></li>
                                <li><strong>Bring a valid ID for verification</strong></li>
                            </ul>
                        </div>
                        
                        <h3 style="color: #059669; margin: 25px 0 15px 0;">Your Verification Codes:</h3>
                        ${bookingsList}
                        
                        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                            <h3 style="color: #0369a1; margin: 0 0 15px 0;">📱 Payment Process at Event:</h3>
                            <ol style="color: #0369a1; margin: 10px 0; padding-left: 20px; line-height: 1.6;">
                                <li>Arrive at the event venue</li>
                                <li>Find the organizer or registration desk</li>
                                <li>Show your verification code (screenshot this email or write it down)</li>
                                <li>Present your ID for verification</li>
                                <li>Pay the amount due in cash</li>
                                <li>Receive your ticket/entry</li>
                            </ol>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #dc2626; margin: 0 0 15px 0;">Booking Summary:</h3>
                            <p style="margin: 5px 0;"><strong>Total Amount Due:</strong> $${testEmailData.totalAmount}</p>
                            <p style="margin: 5px 0;"><strong>Payment Method:</strong> Cash at Events</p>
                            <p style="margin: 5px 0;"><strong>Booking Date:</strong> ${new Date().toLocaleDateString()}</p>
                            <p style="margin: 5px 0;"><strong>Code Expiry:</strong> ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <p style="font-size: 14px; color: #6b7280; margin: 0 0 15px 0;">
                                Keep this email safe - you'll need these codes at the events!
                            </p>
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">
                            Questions? Contact the event organizer or our support team.<br>
                            <strong>Remember:</strong> Codes are valid for 30 days from booking date.
                        </p>
                    </div>
                </div>
            `
        };

        console.log('📤 Sending test email...');

        // Send the email
        const result = await transporter.sendMail(mailOptions);

        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', result.messageId);
        console.log('🎯 Email sent to:', testEmailData.to);
        console.log('📝 Subject:', mailOptions.subject);

        return { success: true, messageId: result.messageId };

    } catch (error) {
        console.error('❌ Email test failed:', error);
        console.error('🔍 Error details:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        });
        return { success: false, error: error.message };
    }
}

// Test the email connection first
async function testEmailConnection() {
    try {
        console.log('🔌 Testing email connection...');

        const transporter = nodemailer.createTransport({
            host: 'sandbox.smtp.mailtrap.io',
            port: 2525,
            secure: false,
            auth: {
                user: '47974993873f54',
                pass: '1fdcda65438582'
            }
        });

        await transporter.verify();
        console.log('✅ Email connection successful!');
        return true;
    } catch (error) {
        console.error('❌ Email connection failed:', error.message);
        return false;
    }
}

// Run the tests
async function runTests() {
    console.log('🚀 Starting Pay Later Email Tests...\n');

    // Test connection first
    const connectionTest = await testEmailConnection();

    if (!connectionTest) {
        console.log('❌ Email connection test failed. Please check your configuration.');
        return;
    }

    console.log('');

    // Test sending email
    const emailTest = await testPayLaterEmail();

    if (emailTest.success) {
        console.log('\n🎉 All tests passed! Pay Later email functionality is working.');
        console.log('📬 Check your Mailtrap inbox to see the email.');
    } else {
        console.log('\n❌ Email test failed. Check the error details above.');
    }
}

// Run the tests if this file is executed directly
runTests();

export { testPayLaterEmail, testEmailConnection };
