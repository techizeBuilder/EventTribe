import express from 'express';

const bankAccountRouter = express.Router();

// ==================== CLEAN BANK ACCOUNT ROUTES ====================

// GET /api/organizer/bank-accounts - Get organizer's bank accounts
bankAccountRouter.get('/', async (req, res) => {
    try {
        const organizerId = req.user._id;
        console.log('=== GET BANK ACCOUNTS ===');
        console.log('Organizer ID:', organizerId);
        console.log('Organizer ID type:', typeof organizerId);

        // Import ObjectId properly
        const { mongoStorage } = await import('../mongodb-storage.js');
        await mongoStorage.connect();
        const { ObjectId } = await import('mongodb');

        console.log('Is ObjectId:', organizerId instanceof ObjectId);
        console.log('Full req.user:', JSON.stringify(req.user, null, 2));
        const bankAccountsCollection = mongoStorage.db.collection('bank_accounts');

        // Ensure organizerId is converted to ObjectId if it's a string
        let queryId = organizerId;
        if (typeof organizerId === 'string') {
            queryId = new ObjectId(organizerId);
        }

        const bankAccounts = await bankAccountsCollection
            .find({ organizerId: queryId })
            .sort({ createdAt: -1 })
            .toArray();

        const sanitizedAccounts = bankAccounts.map(account => {
            // Ensure verification fields are always present with default values
            const verified = account.verified === true; // Only true if explicitly set to true
            const verificationStatus = account.verificationStatus || 'pending';

            return {
                id: account._id,
                last4: account.last4,
                bankName: account.bankName,
                routingNumber: account.routingNumber,
                accountHolderName: account.accountHolderName,
                accountHolderType: account.accountHolderType || 'individual', // Individual or Company
                accountType: account.accountType || 'checking', // Checking or Savings
                isDefault: account.isDefault || false,
                verified: verified,
                verificationStatus: verificationStatus,
                verificationAttempts: account.verificationAttempts || 0,
                status: account.status || 'active',
                createdAt: account.createdAt,
                // Add these fields for better debugging
                canVerify: !verified && verificationStatus !== 'verified'
            };
        });

        console.log('Found bank accounts:', sanitizedAccounts.length);
        console.log('Account verification statuses:', sanitizedAccounts.map(acc => ({
            id: acc.id,
            last4: acc.last4,
            verified: acc.verified,
            verificationStatus: acc.verificationStatus
        })));
        res.json({ success: true, bankAccounts: sanitizedAccounts });
    } catch (error) {
        console.error('Error fetching bank accounts:', error);
        res.status(500).json({
            error: 'Failed to fetch bank accounts',
            message: error.message
        });
    }
});

// POST /api/organizer/bank-accounts - Add bank account with Stripe Payment Method
bankAccountRouter.post('/', async (req, res) => {
    try {
        const organizerId = req.user._id;
        const { accountNumber, routingNumber, accountHolderName, accountHolderType = 'individual', accountType = 'checking' } = req.body;

        console.log('=== ADD BANK ACCOUNT ===');
        console.log('Organizer ID:', organizerId);
        console.log('Request body received:', {
            accountNumber: accountNumber ? '***' + accountNumber.slice(-4) : 'missing',
            routingNumber,
            accountHolderName,
            accountHolderType, // Individual or Company
            accountType // Checking or Savings
        });

        // Use accountHolderType directly (no backward compatibility needed now)
        const holderType = accountHolderType || 'individual';
        const bankAccountType = accountType || 'checking';

        // Validate required fields
        if (!accountNumber || !routingNumber || !accountHolderName) {
            console.log('Validation failed: Missing required fields');
            return res.status(400).json({ error: 'All bank account fields are required' });
        }

        // Validate routing number format (9 digits)
        if (!/^\d{9}$/.test(routingNumber)) {
            console.log('Validation failed: Invalid routing number format');
            return res.status(400).json({ error: 'Routing number must be 9 digits' });
        }

        // Validate account number format
        if (!/^\d{4,17}$/.test(accountNumber)) {
            console.log('Validation failed: Invalid account number format');
            return res.status(400).json({ error: 'Account number must be 4-17 digits' });
        }

        // Connect to MongoDB
        const { mongoStorage } = await import('../mongodb-storage.js');
        await mongoStorage.connect();
        const { ObjectId } = await import('mongodb');
        const usersCollection = mongoStorage.db.collection('users');
        const bankAccountsCollection = mongoStorage.db.collection('bank_accounts');

        // Get organizer's Stripe Connect account from users collection
        console.log('Looking up organizer in users collection...');
        console.log('Looking for organizer with ID:', organizerId);
        console.log('Organizer ID type:', typeof organizerId);

        // Ensure organizerId is converted to ObjectId if it's a string
        let queryId = organizerId;
        if (typeof organizerId === 'string') {
            queryId = new ObjectId(organizerId);
        }

        const organizer = await usersCollection.findOne({ _id: queryId });

        console.log('Organizer lookup result:');
        console.log('- Found:', organizer ? 'Yes' : 'No');
        if (organizer) {
            console.log('- Email:', organizer.email);
            console.log('- Role:', organizer.role);
            console.log('- Has stripeConnectedAccountId:', !!organizer.stripeConnectedAccountId);
            console.log('- stripeConnectedAccountId:', organizer.stripeConnectedAccountId);
        }

        if (!organizer) {
            console.log('ERROR: Organizer not found in users collection');
            return res.status(404).json({ error: 'Organizer not found' });
        }

        if (!organizer.stripeConnectedAccountId) {
            console.log('ERROR: No Stripe Connect account found for organizer');
            return res.status(400).json({
                error: 'Stripe Connect account required',
                message: 'You must complete Stripe Connect onboarding before adding bank accounts. Please set up your Stripe Connect account first.'
            });
        }

        // Create Stripe External Account (simplified approach)
        console.log('Creating Stripe External Account...');

        let externalAccount;
        try {
            // Import Stripe client
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
                apiVersion: '2025-08-27.basil'
            });

            // Create external account directly on the Connect account
            console.log('Creating external account on Connect account...');
            externalAccount = await stripe.accounts.createExternalAccount(
                organizer.stripeConnectedAccountId,
                {
                    external_account: {
                        object: 'bank_account',
                        country: 'US',
                        currency: 'usd',
                        account_number: accountNumber,
                        routing_number: routingNumber,
                        account_holder_name: accountHolderName,
                        account_holder_type: holderType
                    }
                }
            );
            console.log('✅ External Account created:', externalAccount.id);

        } catch (stripeError) {
            console.error('❌ Stripe bank account creation error:', stripeError);
            console.error('Stripe error details:', {
                code: stripeError.code,
                message: stripeError.message,
                type: stripeError.type,
                param: stripeError.param
            });

            // Provide more specific error messages based on Stripe error types
            let errorMessage = stripeError.message;
            if (stripeError.code === 'routing_number_invalid') {
                errorMessage = 'The routing number you entered is invalid. Please check and try again.';
            } else if (stripeError.code === 'account_number_invalid') {
                errorMessage = 'The account number you entered is invalid. Please check and try again.';
            } else if (stripeError.code === 'bank_account_unusable') {
                errorMessage = 'This bank account cannot be used. Please try a different account.';
            } else if (stripeError.code === 'bank_account_unverified') {
                errorMessage = 'This bank account needs to be verified before it can be used.';
            }

            return res.status(400).json({
                error: 'Failed to add bank account to Stripe',
                message: errorMessage,
                code: stripeError.code || 'stripe_error'
            });
        }

        // Save bank account details in MongoDB
        console.log('Step 2: Saving to MongoDB...');
        console.log('Field mapping debug:');
        console.log('- accountHolderType:', accountHolderType);
        console.log('- accountType (bank type):', accountType);
        console.log('- Final holderType being used:', holderType);
        console.log('- Final bankAccountType being used:', bankAccountType);

        const bankAccount = {
            _id: new ObjectId(),
            organizerId: organizerId, // organizerId is already an ObjectId
            stripeExternalAccountId: externalAccount.id,
            last4: accountNumber.slice(-4),
            routingNumber: routingNumber,
            accountHolderName: accountHolderName,
            accountHolderType: holderType, // Individual or Company
            accountType: bankAccountType, // Checking or Savings
            bankName: externalAccount.bank_name || 'Unknown Bank',
            country: externalAccount.country || 'US',
            currency: externalAccount.currency || 'usd',
            isDefault: false,
            verified: false,
            verificationStatus: 'pending',
            verificationAttempts: 0,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
                createdVia: 'external_accounts_api',
                apiVersion: '2025-08-27.basil'
            },
            verificationLogs: [{
                action: 'bank_account_added',
                timestamp: new Date(),
                status: 'success',
                message: 'Bank account added successfully via External Accounts API'
            }]
        };

        console.log('Bank account object being saved:', {
            _id: bankAccount._id,
            accountHolderType: bankAccount.accountHolderType,
            verified: bankAccount.verified,
            verificationStatus: bankAccount.verificationStatus,
            verificationAttempts: bankAccount.verificationAttempts
        });

        await bankAccountsCollection.insertOne(bankAccount);
        console.log('✅ Bank account saved to MongoDB:', bankAccount._id);

        console.log('=== SUCCESS ===');
        console.log('Returning bank account object:', {
            id: bankAccount._id,
            last4: bankAccount.last4,
            accountHolderType: bankAccount.accountHolderType,
            accountType: bankAccount.accountType,
            verified: bankAccount.verified,
            verificationStatus: bankAccount.verificationStatus,
            verificationAttempts: bankAccount.verificationAttempts
        });

        res.json({
            success: true,
            bankAccount: {
                id: bankAccount._id,
                last4: bankAccount.last4,
                bankName: bankAccount.bankName,
                routingNumber: bankAccount.routingNumber,
                accountHolderName: bankAccount.accountHolderName,
                accountHolderType: bankAccount.accountHolderType, // Individual or Company
                accountType: bankAccount.accountType, // Checking or Savings
                isDefault: bankAccount.isDefault,
                verified: bankAccount.verified, // Essential for verify button
                verificationStatus: bankAccount.verificationStatus, // Essential for verify button
                verificationAttempts: bankAccount.verificationAttempts,
                status: bankAccount.status,
                createdAt: bankAccount.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Unexpected error adding bank account:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to add bank account',
            message: error.message
        });
    }
});

// POST /api/organizer/bank-accounts/:id/verify - Verify bank account with micro-deposits
bankAccountRouter.post('/:id/verify', async (req, res) => {
    try {
        const organizerId = req.user._id;
        const { id } = req.params;
        const { amounts } = req.body;

        console.log('=== VERIFY BANK ACCOUNT ===');
        console.log('Organizer ID:', organizerId);
        console.log('Bank Account ID:', id);
        console.log('Verification amounts:', amounts);

        // Validate amounts array
        if (!amounts || !Array.isArray(amounts) || amounts.length !== 2) {
            console.log('Validation failed: Invalid amounts array');
            return res.status(400).json({ error: 'Two verification amounts are required' });
        }

        // Validate amounts are numbers between 1-99 cents
        const verificationAmounts = amounts.map(amount => {
            const parsed = parseInt(amount);
            if (isNaN(parsed) || parsed < 1 || parsed > 99) {
                throw new Error('Verification amounts must be between 1 and 99 cents');
            }
            return parsed;
        });

        console.log('Parsed amounts:', verificationAmounts);

        // Connect to MongoDB
        const { mongoStorage } = await import('../mongodb-storage.js');
        await mongoStorage.connect();
        const { ObjectId } = await import('mongodb');
        const bankAccountsCollection = mongoStorage.db.collection('bank_accounts');
        const usersCollection = mongoStorage.db.collection('users');

        // Find bank account
        console.log('Looking up bank account...');
        const bankAccount = await bankAccountsCollection.findOne({
            _id: new ObjectId(id),
            organizerId: organizerId
        });

        if (!bankAccount) {
            console.log('ERROR: Bank account not found');
            return res.status(404).json({ error: 'Bank account not found' });
        }

        console.log('Bank account found:', {
            id: bankAccount._id,
            verified: bankAccount.verified,
            verificationAttempts: bankAccount.verificationAttempts || 0
        });

        if (bankAccount.verified) {
            console.log('ERROR: Bank account already verified');
            return res.status(400).json({ error: 'Bank account is already verified' });
        }

        // Check verification attempts limit
        const currentAttempts = bankAccount.verificationAttempts || 0;
        if (currentAttempts >= 3) {
            console.log('ERROR: Maximum verification attempts exceeded');
            return res.status(400).json({
                error: 'Maximum verification attempts exceeded. Please contact support.'
            });
        }

        // Get organizer's Stripe Connect account
        console.log('Looking up organizer Stripe account...');
        const organizer = await usersCollection.findOne({ _id: organizerId });

        if (!organizer || !organizer.stripeConnectedAccountId) {
            console.log('ERROR: Organizer Stripe Connect account not found');
            return res.status(400).json({ error: 'Organizer Stripe Connect account not found' });
        }

        console.log('Organizer Stripe account found:', organizer.stripeConnectedAccountId);

        // Verify with Stripe using External Accounts API
        let verificationResult;
        try {
            // Import Stripe client
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
                apiVersion: '2025-08-27.basil'
            });

            console.log('Calling Stripe verification API...');
            console.log('- Connected Account:', organizer.stripeConnectedAccountId);
            console.log('- External Account:', bankAccount.stripeExternalAccountId);
            console.log('- Amounts:', verificationAmounts);

            // Call Stripe's external account verification API
            verificationResult = await stripe.accounts.verifyExternalAccount(
                organizer.stripeConnectedAccountId,
                bankAccount.stripeExternalAccountId,
                {
                    amounts: verificationAmounts
                }
            );

            console.log('✅ Stripe verification successful:', verificationResult.status);

        } catch (stripeError) {
            console.error('❌ Stripe verification failed:', stripeError);
            console.error('Stripe error details:', {
                code: stripeError.code,
                message: stripeError.message,
                type: stripeError.type
            });

            // Log failed attempt
            const newAttempts = currentAttempts + 1;
            await bankAccountsCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        verificationAttempts: newAttempts,
                        updatedAt: new Date()
                    },
                    $push: {
                        verificationLogs: {
                            action: 'verification_failed',
                            timestamp: new Date(),
                            status: 'error',
                            message: stripeError.message,
                            amounts: verificationAmounts,
                            attemptsUsed: newAttempts
                        }
                    }
                }
            );

            // Provide specific error messages
            let errorMessage = 'Verification failed. Please check the amounts and try again.';
            if (stripeError.code === 'bank_account_verification_failed') {
                errorMessage = 'The verification amounts you entered are incorrect. Please check your bank statement and try again.';
            }

            return res.status(400).json({
                error: 'Verification failed',
                message: errorMessage,
                attemptsRemaining: 3 - newAttempts,
                maxAttempts: 3
            });
        }

        // Update bank account as verified
        console.log('Updating bank account as verified...');
        await bankAccountsCollection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    verified: true,
                    verificationStatus: 'verified',
                    verifiedAt: new Date(),
                    updatedAt: new Date()
                },
                $push: {
                    verificationLogs: {
                        action: 'verification_successful',
                        timestamp: new Date(),
                        status: 'success',
                        message: 'Bank account verified successfully',
                        amounts: verificationAmounts
                    }
                }
            }
        );

        console.log('✅ Bank account verified successfully');
        res.json({
            success: true,
            message: 'Bank account verified successfully',
            verified: true,
            verificationStatus: 'verified'
        });

    } catch (error) {
        console.error('❌ Unexpected error verifying bank account:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to verify bank account',
            message: error.message
        });
    }
});

// GET /api/organizer/bank-accounts/:id/status - Get bank account verification status
bankAccountRouter.get('/:id/status', async (req, res) => {
    try {
        const organizerId = req.user._id;
        const { id } = req.params;

        console.log('=== GET BANK ACCOUNT STATUS ===');
        console.log('Organizer ID:', organizerId);
        console.log('Bank Account ID:', id);

        // Connect to MongoDB
        const { mongoStorage } = await import('../mongodb-storage.js');
        await mongoStorage.connect();
        const { ObjectId } = await import('mongodb');
        const bankAccountsCollection = mongoStorage.db.collection('bank_accounts');

        const bankAccount = await bankAccountsCollection.findOne({
            _id: new ObjectId(id),
            organizerId: organizerId
        });

        if (!bankAccount) {
            console.log('ERROR: Bank account not found');
            return res.status(404).json({ error: 'Bank account not found' });
        }

        const status = {
            verified: bankAccount.verified || false,
            verificationStatus: bankAccount.verificationStatus || 'pending',
            verificationAttempts: bankAccount.verificationAttempts || 0,
            maxAttempts: 3,
            attemptsRemaining: 3 - (bankAccount.verificationAttempts || 0),
            canAttemptVerification: (bankAccount.verificationAttempts || 0) < 3 && !bankAccount.verified,
            verifiedAt: bankAccount.verifiedAt,
            createdAt: bankAccount.createdAt,
            lastAttempt: bankAccount.verificationLogs?.length ?
                bankAccount.verificationLogs[bankAccount.verificationLogs.length - 1].timestamp : null
        };

        console.log('Bank account status:', status);
        res.json({
            success: true,
            status: status
        });

    } catch (error) {
        console.error('❌ Error getting bank account status:', error);
        res.status(500).json({
            error: 'Failed to get bank account status',
            message: error.message
        });
    }
});

// PUT /api/organizer/bank-accounts/:id - Update bank account (e.g., set as default)
bankAccountRouter.put('/:id', async (req, res) => {
    try {
        const organizerId = req.user._id;
        const { id } = req.params;
        const { isDefault } = req.body;

        console.log('=== UPDATE BANK ACCOUNT ===');
        console.log('Organizer ID:', organizerId);
        console.log('Bank Account ID:', id);
        console.log('Setting as default:', isDefault);

        // Connect to MongoDB
        const { mongoStorage } = await import('../mongodb-storage.js');
        await mongoStorage.connect();
        const { ObjectId } = await import('mongodb');
        const bankAccountsCollection = mongoStorage.db.collection('bank_accounts');

        // Verify the bank account belongs to the organizer
        const bankAccount = await bankAccountsCollection.findOne({
            _id: new ObjectId(id),
            organizerId: organizerId
        });

        if (!bankAccount) {
            console.log('ERROR: Bank account not found');
            return res.status(404).json({ error: 'Bank account not found' });
        }

        // If setting as default, first remove default from all other accounts
        if (isDefault) {
            await bankAccountsCollection.updateMany(
                { organizerId: organizerId },
                { $set: { isDefault: false } }
            );
        }

        // Update the specific account
        const updateData = {
            updatedAt: new Date()
        };

        if (typeof isDefault === 'boolean') {
            updateData.isDefault = isDefault;
        }

        await bankAccountsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        console.log('✅ Bank account updated successfully');
        res.json({
            success: true,
            message: 'Bank account updated successfully'
        });

    } catch (error) {
        console.error('❌ Error updating bank account:', error);
        res.status(500).json({
            error: 'Failed to update bank account',
            message: error.message
        });
    }
});

// DELETE /api/organizer/bank-accounts/:id - Delete bank account
bankAccountRouter.delete('/:id', async (req, res) => {
    try {
        const organizerId = req.user._id;
        const { id } = req.params;

        console.log('=== DELETE BANK ACCOUNT ===');
        console.log('Organizer ID:', organizerId);
        console.log('Organizer ID type:', typeof organizerId);
        console.log('Bank Account ID:', id);
        console.log('Bank Account ID type:', typeof id);

        // Connect to MongoDB
        const { mongoStorage } = await import('../mongodb-storage.js');
        await mongoStorage.connect();
        const { ObjectId } = await import('mongodb');
        const bankAccountsCollection = mongoStorage.db.collection('bank_accounts');
        const usersCollection = mongoStorage.db.collection('users');

        // Ensure proper ObjectId conversion
        let queryOrganizerID = organizerId;
        if (typeof organizerId === 'string') {
            queryOrganizerID = new ObjectId(organizerId);
        }

        let queryBankAccountId;
        try {
            queryBankAccountId = new ObjectId(id);
        } catch (objectIdError) {
            console.log('ERROR: Invalid bank account ID format');
            return res.status(400).json({ error: 'Invalid bank account ID format' });
        }

        console.log('Query ObjectIds:', {
            organizerId: queryOrganizerID,
            bankAccountId: queryBankAccountId
        });

        // Verify the bank account belongs to the organizer
        const bankAccount = await bankAccountsCollection.findOne({
            _id: queryBankAccountId,
            organizerId: queryOrganizerID
        });

        console.log('Bank account found:', bankAccount ? 'Yes' : 'No');
        if (bankAccount) {
            console.log('Bank account details:', {
                id: bankAccount._id,
                organizerId: bankAccount.organizerId,
                last4: bankAccount.last4
            });
        }

        if (!bankAccount) {
            console.log('ERROR: Bank account not found or does not belong to organizer');
            return res.status(404).json({ error: 'Bank account not found' });
        }

        // Get organizer's Stripe Connect account
        const organizer = await usersCollection.findOne({ _id: queryOrganizerID });

        if (!organizer) {
            console.log('ERROR: Organizer not found');
            return res.status(404).json({ error: 'Organizer not found' });
        }

        console.log('Organizer found:', organizer.email);
        console.log('Has Stripe account:', !!organizer.stripeConnectedAccountId);

        // Delete from Stripe if we have the external account ID
        if (organizer.stripeConnectedAccountId && bankAccount.stripeExternalAccountId) {
            try {
                const Stripe = (await import('stripe')).default;
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
                    apiVersion: '2025-08-27.basil'
                });

                console.log('Deleting from Stripe Connect account...');
                await stripe.accounts.deleteExternalAccount(
                    organizer.stripeConnectedAccountId,
                    bankAccount.stripeExternalAccountId
                );
                console.log('✅ Deleted from Stripe successfully');
            } catch (stripeError) {
                console.error('⚠️ Warning: Failed to delete from Stripe:', stripeError.message);
                // Continue with MongoDB deletion even if Stripe fails
            }
        }

        // Delete from MongoDB
        console.log('Deleting from MongoDB...');
        const deleteResult = await bankAccountsCollection.deleteOne({
            _id: queryBankAccountId,
            organizerId: queryOrganizerID
        });

        console.log('Delete result:', deleteResult);

        if (deleteResult.deletedCount === 0) {
            console.log('ERROR: Failed to delete bank account from database');
            return res.status(404).json({ error: 'Bank account not found' });
        }

        console.log('✅ Bank account deleted successfully');
        res.json({
            success: true,
            message: 'Bank account deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting bank account:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to delete bank account',
            message: error.message
        });
    }
});

export default bankAccountRouter;