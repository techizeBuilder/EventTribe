import fetch from 'node-fetch';

console.log('🔍 Debugging Bank Account DELETE Issue...\n');

async function debugBankAccountDelete() {
    try {
        // Step 1: Get an auth token
        console.log('1️⃣ Getting auth token...');
        const authResponse = await fetch('http://localhost:5000/api/auth/test-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        if (!authResponse.ok) {
            console.error('❌ Failed to get auth token');
            const errorText = await authResponse.text();
            console.log('Response:', errorText);
            return;
        }

        const authData = await authResponse.json();
        const token = authData.accessToken;
        console.log('✅ Got token for:', authData.user.email);

        // Step 2: Test authentication with organizer routes
        console.log('\n2️⃣ Testing organizer authentication...');
        const testAuthResponse = await fetch('http://localhost:5000/api/organizer/test-auth', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!testAuthResponse.ok) {
            console.error('❌ Auth test failed');
            const errorText = await testAuthResponse.text();
            console.log('Response:', errorText);
            return;
        }

        const authTestData = await testAuthResponse.json();
        console.log('✅ Auth test passed for user:', authTestData.user.email);

        // Step 3: Get bank accounts
        console.log('\n3️⃣ Getting bank accounts...');
        const bankAccountsResponse = await fetch('http://localhost:5000/api/organizer/bank-accounts', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!bankAccountsResponse.ok) {
            console.error('❌ Failed to get bank accounts');
            const errorText = await bankAccountsResponse.text();
            console.log('Response:', errorText);
            return;
        }

        const bankAccountsData = await bankAccountsResponse.json();
        console.log('✅ Got bank accounts:', bankAccountsData.bankAccounts?.length || 0);

        if (bankAccountsData.bankAccounts && bankAccountsData.bankAccounts.length > 0) {
            const testAccountId = bankAccountsData.bankAccounts[0].id;
            console.log('📋 Using account ID for delete test:', testAccountId);

            // Step 4: Test DELETE request
            console.log('\n4️⃣ Testing DELETE request...');
            const deleteResponse = await fetch(`http://localhost:5000/api/organizer/bank-accounts/${testAccountId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('🔍 DELETE Response status:', deleteResponse.status);
            console.log('🔍 DELETE Response headers:', Object.fromEntries(deleteResponse.headers.entries()));

            const responseText = await deleteResponse.text();
            console.log('🔍 DELETE Response body:', responseText);

            // Try to parse as JSON
            try {
                const deleteData = JSON.parse(responseText);
                console.log('✅ DELETE Response (JSON):', deleteData);
            } catch (parseError) {
                console.log('❌ DELETE Response is not JSON (this is the problem!)');
                console.log('📄 Raw response:', responseText.substring(0, 500) + '...');
            }

        } else {
            console.log('ℹ️ No bank accounts found to test deletion');

            // Step 4: Add a test bank account first
            console.log('\n4️⃣ Adding a test bank account...');
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

            console.log('🔍 ADD Response status:', addResponse.status);
            const addResponseText = await addResponse.text();
            console.log('🔍 ADD Response body:', addResponseText);

            try {
                const addData = JSON.parse(addResponseText);
                console.log('✅ ADD Response (JSON):', addData);
            } catch (parseError) {
                console.log('❌ ADD Response is not JSON');
                console.log('📄 Raw response:', addResponseText.substring(0, 500) + '...');
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

debugBankAccountDelete();