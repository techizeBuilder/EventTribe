// Quick test to debug the organizer authentication issue

console.log('🔍 Testing Organizer Authentication...\n');

async function testOrganizerAuth() {
    try {
        // Get token from localStorage (you'll need to replace this with actual token)
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGMyZjVkYzJjZjU1OTFiNjVlNmI4NzAiLCJlbWFpbCI6ImplZXR1Lm1qMTIzQGdtYWlsLmNvbSIsInJvbGUiOiJvcmdhbml6ZXIiLCJpYXQiOjE3MjYxNTI3ODUsImV4cCI6MTcyNjIzOTE4NX0.IojCNXrCKLO0ySlSS_PJbG6TKrvafP4-xGlRWNrjqK8'; // Replace with actual token

        console.log('🔑 Testing with token:', token ? 'Token present' : 'No token');

        // Test authentication endpoint
        console.log('1️⃣ Testing authentication...');
        const authResponse = await fetch('http://localhost:5000/api/organizer/test-auth', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Auth response status:', authResponse.status);
        const authData = await authResponse.json();
        console.log('Auth response:', authData);

        if (!authResponse.ok) {
            console.error('❌ Authentication failed');
            return;
        }

        // Test bank accounts endpoint
        console.log('\n2️⃣ Testing bank accounts endpoint...');
        const bankResponse = await fetch('http://localhost:5000/api/organizer/bank-accounts', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Bank accounts response status:', bankResponse.status);
        const bankData = await bankResponse.json();
        console.log('Bank accounts response:', bankData);

        // Test adding a bank account
        console.log('\n3️⃣ Testing add bank account...');
        const addResponse = await fetch('http://localhost:5000/api/organizer/bank-accounts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accountNumber: '000123456789',
                routingNumber: '110000000',
                accountHolderName: 'Test User',
                accountHolderType: 'individual',
                accountType: 'checking'
            })
        });

        console.log('Add bank account response status:', addResponse.status);
        const addData = await addResponse.json();
        console.log('Add bank account response:', addData);

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testOrganizerAuth();