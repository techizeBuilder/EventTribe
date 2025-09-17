/**
 * Test Script for Bank Account Verification Flow
 * This script demonstrates the complete bank account verification flow
 */

const BASE_URL = 'http://localhost:3000';

async function testBankAccountFlow() {
  console.log('🏦 Testing Bank Account Verification Flow\n');

  // Test data
  const testOrganizerToken = 'your-organizer-jwt-token-here';
  const testBankAccount = {
    accountNumber: '000123456789',
    routingNumber: '110000000',
    accountHolderName: 'John Doe',
    accountHolderType: 'individual'
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${testOrganizerToken}`
  };

  try {
    // Step 1: Add Bank Account
    console.log('📝 Step 1: Adding bank account...');
    const addResponse = await fetch(`${BASE_URL}/api/organizer/bank-accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testBankAccount)
    });

    const addResult = await addResponse.json();
    console.log('✅ Add bank account result:', addResult);

    if (!addResponse.ok) {
      throw new Error(`Failed to add bank account: ${addResult.error}`);
    }

    const bankAccountId = addResult.bankAccount.id;
    console.log(`📋 Bank Account ID: ${bankAccountId}\n`);

    // Step 2: Check Initial Status
    console.log('🔍 Step 2: Checking initial verification status...');
    const statusResponse = await fetch(`${BASE_URL}/api/organizer/bank-accounts/${bankAccountId}/status`, {
      headers
    });

    const statusResult = await statusResponse.json();
    console.log('✅ Initial status:', statusResult.status);
    console.log(`🔄 Verification Status: ${statusResult.status.verificationStatus}`);
    console.log(`⏳ Attempts Remaining: ${statusResult.status.attemptsRemaining}\n`);

    // Step 3: Simulate Verification (Mock micro-deposits)
    console.log('💰 Step 3: Attempting verification with mock micro-deposits...');
    const verificationAmounts = [32, 45]; // Mock amounts

    const verifyResponse = await fetch(`${BASE_URL}/api/organizer/bank-accounts/${bankAccountId}/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amounts: verificationAmounts })
    });

    const verifyResult = await verifyResponse.json();
    console.log('✅ Verification result:', verifyResult);

    if (verifyResponse.ok) {
      console.log('🎉 Bank account verified successfully!');
    } else {
      console.log('❌ Verification failed:', verifyResult.error);
    }

    // Step 4: Check Final Status
    console.log('\n🔍 Step 4: Checking final verification status...');
    const finalStatusResponse = await fetch(`${BASE_URL}/api/organizer/bank-accounts/${bankAccountId}/status`, {
      headers
    });

    const finalStatusResult = await finalStatusResponse.json();
    console.log('✅ Final status:', finalStatusResult.status);

    // Step 5: Get Verification Logs
    console.log('\n📊 Step 5: Getting verification logs...');
    const logsResponse = await fetch(`${BASE_URL}/api/organizer/bank-accounts/${bankAccountId}/logs`, {
      headers
    });

    const logsResult = await logsResponse.json();
    console.log('✅ Verification logs:');
    logsResult.logs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.action} - ${log.status} (${new Date(log.timestamp).toLocaleString()})`);
      console.log(`      Message: ${log.message}`);
    });

    // Step 6: List All Bank Accounts
    console.log('\n📋 Step 6: Listing all bank accounts...');
    const listResponse = await fetch(`${BASE_URL}/api/organizer/bank-accounts`, {
      headers
    });

    const listResult = await listResponse.json();
    console.log('✅ Bank accounts list:');
    listResult.bankAccounts.forEach((account, index) => {
      console.log(`   ${index + 1}. ****${account.last4} - ${account.verified ? '✅ Verified' : '⏳ Pending'}`);
      console.log(`      Holder: ${account.accountHolderName} (${account.accountHolderType})`);
      console.log(`      Status: ${account.verificationStatus}`);
    });

    console.log('\n🎉 Bank Account Verification Flow Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Instructions for running the test
console.log(`
🚀 Bank Account Verification Flow Test

Instructions:
1. Make sure your server is running on ${BASE_URL}
2. Replace 'your-organizer-jwt-token-here' with a valid organizer JWT token
3. Ensure your Stripe API keys are configured in the .env file
4. Run this script: node test-bank-verification.js

Features being tested:
✅ Create Payment Method with Stripe
✅ Attach bank account to Stripe Connect account
✅ Store bank account details in MongoDB
✅ Verification status tracking
✅ Micro-deposit verification simulation
✅ Verification attempt limits
✅ Comprehensive logging
✅ Error handling and validation

Press Ctrl+C to cancel or wait 5 seconds to start the test...
`);

// Uncomment the line below to run the test automatically after 5 seconds
// setTimeout(testBankAccountFlow, 5000);