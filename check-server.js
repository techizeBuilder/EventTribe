import fetch from 'node-fetch';

async function checkServer() {
    try {
        console.log('🔍 Checking what is running on port 5000...\n');

        const response = await fetch('http://localhost:5000');
        const responseText = await response.text();

        console.log('📊 Status Code:', response.status);
        console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
        console.log('📄 Response (first 500 chars):', responseText.substring(0, 500));

        // Check if it's a frontend app by looking for common patterns
        if (responseText.includes('<html') || responseText.includes('<!DOCTYPE') || responseText.includes('<!doctype')) {
            console.log('\n❌ Port 5000 is serving a frontend/HTML app, not the API server!');
            console.log('🔧 This explains why DELETE requests return HTML instead of JSON');
        }

    } catch (error) {
        console.error('❌ Failed to check server:', error);
    }
}

checkServer();