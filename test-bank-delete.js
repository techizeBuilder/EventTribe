// Quick test for bank account delete functionality
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testBankAccountDelete() {
    console.log('🧪 Testing Bank Account Delete API...\n');

    // You'll need to replace this with a valid token from your browser's localStorage
    const token = 'your-actual-token-here'; // Get this from browser localStorage
    const bankAccountId = '68c8f5df2415144adda0fe41'; // The ID from your screenshot

    try {
        // Test 1: Check authentication
        console.log('1️⃣ Testing authentication...');
        const authResponse = await fetch(`${BASE_URL}/api/organizer/test-auth`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Auth status:', authResponse.status);
        if (!authResponse.ok) {
            const authText = await authResponse.text();
            console.log('Auth error:', authText);
            return;
        }

        const authData = await authResponse.json();
        console.log('Auth success:', authData.user?.email);

        // Test 2: List bank accounts
        console.log('\n2️⃣ Testing bank accounts list...');
        const listResponse = await fetch(`${BASE_URL}/api/organizer/bank-accounts`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('List status:', listResponse.status);
        const listData = await listResponse.json();
        console.log('Bank accounts found:', listData.bankAccounts?.length || 0);

        // Test 3: Try to delete bank account
        console.log('\n3️⃣ Testing bank account delete...');
        const deleteResponse = await fetch(`${BASE_URL}/api/organizer/bank-accounts/${bankAccountId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Delete status:', deleteResponse.status);
        const deleteContentType = deleteResponse.headers.get('content-type');
        console.log('Delete content-type:', deleteContentType);

        if (deleteContentType?.includes('application/json')) {
            const deleteData = await deleteResponse.json();
            console.log('Delete response:', deleteData);
        } else {
            const deleteText = await deleteResponse.text();
            console.log('Delete response (text):', deleteText.substring(0, 500) + '...');
        }

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

// To use this test:
// 1. Get your JWT token from browser localStorage
// 2. Replace the token variable above
// 3. Run: node test-bank-delete.js

console.log('📋 To run this test:');
console.log('1. Open browser dev tools');
console.log('2. Go to Application > Local Storage');
console.log('3. Copy the "token" value');
console.log('4. Replace the token variable in this file');
console.log('5. Run: node test-bank-delete.js');

// Uncomment to run the test
// testBankAccountDelete();