import fetch from 'node-fetch';

console.log('🧪 Testing Complete Pay Later Booking Flow...\n');

// Test data that matches the frontend payment flow
const testBookingData = {
    items: [
        {
            eventId: 'test-event-1',
            eventTitle: 'Garba Party Event',
            name: 'General Admission',
            price: 50,
            quantity: 2,
            total: 100
        },
        {
            eventId: 'test-event-2',
            eventTitle: 'Concert Night',
            name: 'VIP Ticket',
            price: 75,
            quantity: 1,
            total: 75
        }
    ],
    amount: 175,
    userEmail: 'jeetu.mj123@gmail.com',
    userName: 'Integration Test User'
};

async function testPayLaterBookingAPI() {
    try {
        console.log('🚀 Testing pay later booking API endpoint...');
        console.log('📝 Request data:', {
            itemCount: testBookingData.items.length,
            totalAmount: testBookingData.amount,
            userEmail: testBookingData.userEmail,
            userName: testBookingData.userName
        });

        // Test the pay later booking creation
        const response = await fetch('http://localhost:3000/api/create-pay-later-booking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testBookingData)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        console.log('✅ API Response received');
        console.log('📊 Result:', {
            success: result.success,
            bookingsCreated: result.bookings?.length || 0,
            bookingCodesGenerated: result.bookingCodes?.length || 0,
            message: result.message
        });

        if (result.success) {
            console.log('\n📧 Booking codes generated:');
            result.bookingCodes?.forEach((code, index) => {
                console.log(`  ${index + 1}. ${code.eventTitle}: ${code.bookingCode} ($${code.amount})`);
            });

            return { success: true, data: result };
        } else {
            throw new Error(result.message || 'Booking creation failed');
        }

    } catch (error) {
        console.error('❌ API test failed:', error);
        return { success: false, error: error.message };
    }
}

async function testPayLaterEmailAPI() {
    try {
        console.log('\n🚀 Testing pay later email API endpoint...');

        const response = await fetch('http://localhost:3000/api/test-pay-later-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        console.log('✅ Email API Response:', {
            success: result.success,
            message: result.message
        });

        return { success: result.success, data: result };

    } catch (error) {
        console.error('❌ Email API test failed:', error);
        return { success: false, error: error.message };
    }
}

async function checkServerHealth() {
    try {
        console.log('🔍 Checking server health...');

        const response = await fetch('http://localhost:3000/api/server-info', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Server not responding: ${response.status}`);
        }

        const info = await response.json();
        console.log('✅ Server is running');
        console.log('📊 Backend info:', {
            running: info.backend?.running || 'unknown',
            timestamp: info.backend?.timestamp || 'unknown'
        });

        return true;

    } catch (error) {
        console.error('❌ Server health check failed:', error.message);
        return false;
    }
}

// Main test runner
async function runIntegrationTests() {
    console.log('🧪 Starting Pay Later Integration Tests...\n');

    // Check if server is running
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
        console.log('\n❌ Server is not running. Please start the server and try again.');
        console.log('💡 Run: npm run dev or node server.js');
        return;
    }

    console.log('');

    // Test email API
    const emailTest = await testPayLaterEmailAPI();

    console.log('');

    // Test complete booking flow
    const bookingTest = await testPayLaterBookingAPI();

    // Summary
    console.log('\n📊 Integration Test Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔧 Server Health:        ✅ Running`);
    console.log(`📧 Email API:           ${emailTest.success ? '✅ Working' : '❌ Failed'}`);
    console.log(`🎫 Booking API:         ${bookingTest.success ? '✅ Working' : '❌ Failed'}`);

    if (emailTest.success && bookingTest.success) {
        console.log('\n🎉 All integration tests passed!');
        console.log('📬 Check your Mailtrap inbox for booking confirmation emails.');
        console.log('💡 The pay later booking flow is working correctly.');
    } else {
        console.log('\n❌ Some tests failed. Check the details above.');
    }
}

// Run tests if this file is executed directly
runIntegrationTests();