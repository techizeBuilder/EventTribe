import { sendPayLaterBookingEmail } from './server/services/emailService.js';

console.log('🧪 Testing Fixed Email Service...\n');

async function testEmailService() {
    try {
        const testEmailData = {
            to: 'jeetu.mj123@gmail.com',
            userName: 'Test User from Fixed Service',
            totalAmount: 200,
            bookings: [
                {
                    eventTitle: 'Test Event 1',
                    bookingCode: 'FIX12345',
                    amount: 100,
                    ticketType: 'General Admission',
                    quantity: 1
                },
                {
                    eventTitle: 'Test Event 2',
                    bookingCode: 'FIX67890',
                    amount: 100,
                    ticketType: 'VIP Ticket',
                    quantity: 1
                }
            ]
        };

        console.log('📧 Testing sendPayLaterBookingEmail function...');
        console.log('📝 Test data:', {
            recipient: testEmailData.to,
            userName: testEmailData.userName,
            totalAmount: testEmailData.totalAmount,
            bookingsCount: testEmailData.bookings.length
        });

        const result = await sendPayLaterBookingEmail(testEmailData);

        console.log('✅ Email service test passed!');
        console.log('📧 Message ID:', result.messageId);

        return { success: true, result };

    } catch (error) {
        console.error('❌ Email service test failed:', error);
        console.error('🔍 Error details:', {
            message: error.message,
            stack: error.stack
        });
        return { success: false, error: error.message };
    }
}

// Run the test
testEmailService().then(result => {
    if (result.success) {
        console.log('\n🎉 Email service is now working correctly!');
        console.log('📬 Check your Mailtrap inbox to see the email.');
    } else {
        console.log('\n❌ Email service still has issues. Check error details above.');
    }
});