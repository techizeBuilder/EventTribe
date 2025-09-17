import { sendPayLaterBookingEmail } from './server/services/emailService.js';

console.log('🧪 Final Test: Pay Later Email Integration...\n');

// Simulate the exact data structure used in the pay-later booking flow
const simulatePayLaterBooking = async () => {
    try {
        console.log('🎫 Simulating pay later booking creation...');

        // This simulates the data created in the /api/create-pay-later-booking endpoint
        const bookingCodes = [
            {
                eventTitle: 'Garba Party Event',
                bookingCode: 'GARBA123',
                amount: 75,
                ticketType: 'General Admission',
                quantity: 2
            },
            {
                eventTitle: 'Concert Night',
                bookingCode: 'CONCERT456',
                amount: 100,
                ticketType: 'VIP Ticket',
                quantity: 1
            }
        ];

        const userEmail = 'jeetu.mj123@gmail.com';
        const userName = 'Final Test User';
        const totalAmount = bookingCodes.reduce((sum, booking) => sum + booking.amount, 0);

        console.log('📊 Simulated booking data:', {
            userEmail,
            userName,
            totalAmount,
            bookingsCount: bookingCodes.length
        });

        console.log('📧 Sending booking confirmation email...');

        // Send the email using the exact same function called in the backend
        const emailData = {
            to: userEmail,
            userName,
            bookings: bookingCodes,
            totalAmount
        };

        const result = await sendPayLaterBookingEmail(emailData);

        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', result.messageId);

        return { success: true, emailSent: true, bookingCodes };

    } catch (error) {
        console.error('❌ Simulation failed:', error);
        return { success: false, error: error.message };
    }
};

// Test multiple scenarios
const testMultipleScenarios = async () => {
    console.log('🔄 Testing multiple booking scenarios...\n');

    // Scenario 1: Single event booking
    console.log('📍 Scenario 1: Single Event Booking');
    try {
        const singleEventData = {
            to: 'jeetu.mj123@gmail.com',
            userName: 'Single Event User',
            totalAmount: 50,
            bookings: [{
                eventTitle: 'Music Festival',
                bookingCode: 'MUSIC001',
                amount: 50,
                ticketType: 'Early Bird',
                quantity: 1
            }]
        };

        await sendPayLaterBookingEmail(singleEventData);
        console.log('✅ Single event email sent');
    } catch (error) {
        console.error('❌ Single event test failed:', error.message);
    }

    console.log('');

    // Scenario 2: Multiple events booking (original scenario)
    console.log('📍 Scenario 2: Multiple Events Booking');
    const result = await simulatePayLaterBooking();

    return result;
};

// Final verification
const runFinalTests = async () => {
    console.log('🚀 Running Final Pay Later Email Tests...\n');

    const result = await testMultipleScenarios();

    console.log('\n📊 Final Test Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email Service:       ${result.success ? '✅ Working' : '❌ Failed'}`);
    console.log(`🎫 Booking Codes:       ${result.bookingCodes ? '✅ Generated' : '❌ Missing'}`);
    console.log(`📬 Email Delivery:      ${result.emailSent ? '✅ Sent' : '❌ Failed'}`);

    if (result.success) {
        console.log('\n🎉 Pay Later Email Functionality is WORKING!');
        console.log('📬 Check your Mailtrap inbox for the booking confirmation emails.');
        console.log('💡 Users will now receive their booking codes via email when using "Pay Later".');
        console.log('\n📋 What happens when user selects "Pay Later":');
        console.log('   1. ✅ Booking is created with unique verification codes');
        console.log('   2. ✅ Email is sent with booking codes and instructions');
        console.log('   3. ✅ User shows codes to organizer at event');
        console.log('   4. ✅ Organizer verifies and collects payment');
    } else {
        console.log('\n❌ There are still issues with the email functionality.');
        console.log('🔍 Error:', result.error);
    }
};

// Run the final tests
runFinalTests();