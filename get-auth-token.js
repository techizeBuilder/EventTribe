import fetch from 'node-fetch';

async function getAuthToken() {
    try {
        console.log('🔐 Creating test organizer account and getting token...');

        const response = await fetch('http://localhost:5000/api/auth/test-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Success! Test organizer created and logged in');
            console.log('User:', data.user.firstName, data.user.lastName, `(${data.user.email})`);
            console.log('Role:', data.user.role);
            console.log('🎫 Token:', data.accessToken);
            console.log('\n📋 Copy this token for testing:');
            console.log(data.accessToken);
            return data.accessToken;
        } else {
            console.error('❌ Error:', data);
            return null;
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
        return null;
    }
}

getAuthToken();