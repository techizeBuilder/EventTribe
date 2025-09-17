import nodemailer from 'nodemailer';

console.log('Testing nodemailer import...');
console.log('nodemailer:', nodemailer);
console.log('createTransporter:', typeof nodemailer.createTransporter);

// Test creating a transporter
try {
    const transporter = nodemailer.createTransporter({
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        secure: false,
        auth: {
            user: '47974993873f54',
            pass: '1fdcda65438582'
        }
    });
    console.log('✅ Transporter created successfully');
    console.log('transporter:', typeof transporter);
} catch (error) {
    console.error('❌ Failed to create transporter:', error);
}