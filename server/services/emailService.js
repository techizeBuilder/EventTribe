import nodemailer from 'nodemailer';

// Mailtrap SMTP configuration using environment variables
const createMailtrapTransporter = () => {
  try {
    // Use environment variables for email configuration
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.MAIL_PORT) || 2525,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USERNAME || '47974993873f54',
        pass: process.env.MAIL_PASSWORD || '1fdcda65438582'
      }
    });

    console.log('[EMAIL] Using email configuration:', {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      user: process.env.MAIL_USERNAME,
      from: process.env.MAIL_FROM_ADDRESS
    });

    // Verify the transporter is created successfully
    if (!transporter) {
      throw new Error('Failed to create email transporter');
    }

    return transporter;
  } catch (error) {
    console.warn('[EMAIL] Mailtrap transporter failed, using development fallback:', error.message);
    // Return a mock transporter for development
    return {
      sendMail: async (options) => {
        console.log('[EMAIL - DEV MODE] Would send email to:', options.to);
        console.log('[EMAIL - DEV MODE] Subject:', options.subject);
        console.log('[EMAIL - DEV MODE] Body preview:', options.html ? options.html.substring(0, 200) + '...' : 'No HTML body');
        return { messageId: 'dev-' + Date.now() };
      }
    };
  }
};

// Send email notification to attendee
export const sendAttendeeNotification = async (bookingData) => {
  try {
    const transporter = createMailtrapTransporter();

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'Event Tribe'}" <${process.env.MAIL_FROM_ADDRESS || 'jeetu.mj123@example.com'}>`,
      to: bookingData.userEmail,
      subject: `🎟️ Your ticket for ${bookingData.eventTitle} is confirmed!`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">EVENT TRIBE</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px;">🎉 Your tickets are confirmed!</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px;">Hi ${bookingData.userName}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Great news! Your ticket purchase for <strong>${bookingData.eventTitle}</strong> has been confirmed.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin: 0 0 15px 0;">Booking Details:</h3>
              <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
              <p style="margin: 5px 0;"><strong>Event:</strong> ${bookingData.eventTitle}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${bookingData.totalAmount}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${bookingData.status}</p>
              <p style="margin: 5px 0;"><strong>Booking Date:</strong> ${new Date(bookingData.bookingDate).toLocaleDateString()}</p>
            </div>
            
            <div style="background: #dcfdf7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #047857; margin: 0 0 10px 0;">What's Next?</h3>
              <ul style="color: #047857; margin: 10px 0; padding-left: 20px;">
                <li>Access your ticket anytime from your attendee dashboard</li>
                <li>Show your QR code ticket at the event entrance</li>
                <li>Check your email for event updates</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/attendee-dashboard" 
                 style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Your Tickets
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Thank you for choosing Event Tribe! <br>
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[${new Date().toLocaleTimeString()}] Email sent to attendee: ${bookingData.userEmail}`);
    return result;
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error sending email to attendee:`, error);
    // Don't throw error to prevent app crash - just log it
    return { error: error.message, messageId: null };
  }
};

// Send email notification to organizer
export const sendOrganizerNotification = async (bookingData, organizerEmail) => {
  try {
    const transporter = createMailtrapTransporter();

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'Event Tribe'}" <${process.env.MAIL_FROM_ADDRESS || 'jeetu.mj123@example.com'}>`,
      to: organizerEmail,
      subject: `💰 New ticket sale for ${bookingData.eventTitle}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">EVENT TRIBE</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px;">💰 New Ticket Sale!</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #059669; margin: 0 0 20px 0; font-size: 24px;">Congratulations!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              You have a new ticket sale for your event <strong>${bookingData.eventTitle}</strong>.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #059669; margin: 0 0 15px 0;">Sale Details:</h3>
              <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
              <p style="margin: 5px 0;"><strong>Customer:</strong> ${bookingData.userName} (${bookingData.userEmail})</p>
              <p style="margin: 5px 0;"><strong>Event:</strong> ${bookingData.eventTitle}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${bookingData.totalAmount}</p>
              <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${bookingData.status}</p>
              <p style="margin: 5px 0;"><strong>Sale Date:</strong> ${new Date(bookingData.bookingDate).toLocaleDateString()}</p>
            </div>
            
            <div style="background: #dcfdf7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #047857; margin: 0 0 10px 0;">Next Steps:</h3>
              <ul style="color: #047857; margin: 10px 0; padding-left: 20px;">
                <li>View detailed sales analytics in your organizer dashboard</li>
                <li>Track your event performance and revenue</li>
                <li>Manage attendee communications</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/organizer/dashboard" 
                 style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Keep growing your events with Event Tribe! <br>
              Track your success and engage with your audience.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[${new Date().toLocaleTimeString()}] Email sent to organizer: ${organizerEmail}`);
    return result;
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error sending email to organizer:`, error);
    throw error;
  }
};

// Send pay later booking email with verification codes
export const sendPayLaterBookingEmail = async (emailData) => {
  try {
    console.log('[EMAIL] 📧 Starting to send pay later booking email...');
    console.log('[EMAIL] Email data received:', {
      to: emailData.to,
      userName: emailData.userName,
      totalAmount: emailData.totalAmount,
      bookingsCount: emailData.bookings?.length
    });

    const { to, userName, bookings, totalAmount } = emailData;

    if (!to) {
      throw new Error('No recipient email address provided');
    }

    if (!bookings || bookings.length === 0) {
      throw new Error('No booking codes provided');
    }

    const transporter = createMailtrapTransporter();

    // Generate booking codes list
    const bookingsList = bookings.map(booking => `
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #dc2626;">
        <h4 style="margin: 0 0 8px 0; color: #dc2626; font-size: 18px;">${booking.eventTitle}</h4>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Ticket Type:</strong> ${booking.ticketType}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Quantity:</strong> ${booking.quantity}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Amount:</strong> $${booking.amount}</p>
        <div style="background: #fef3c7; padding: 10px; border-radius: 5px; margin: 10px 0;">
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #92400e; text-align: center; letter-spacing: 2px;">
            ${booking.bookingCode}
          </p>
        </div>
      </div>
    `).join('');

    console.log('[EMAIL] Generated booking list HTML, preparing to send...');

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'Event Tribe'}" <${process.env.MAIL_FROM_ADDRESS || 'jeetu.mj123@example.com'}>`,
      to: to,
      subject: `🎫 Pay Later Booking Confirmed - Show Your Codes at Events`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">EVENT TRIBE</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px;">💳 Pay Later Booking Confirmed!</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #059669; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Your Pay Later booking has been confirmed! Below are your verification codes that you'll need to show at each event.
            </p>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="color: #dc2626; margin: 0 0 15px 0;">🚨 Important Instructions:</h3>
              <ul style="color: #991b1b; margin: 10px 0; padding-left: 20px; line-height: 1.6;">
                <li><strong>Show these codes to the organizer at each event</strong></li>
                <li><strong>Bring cash to pay the amount due</strong></li>
                <li><strong>Codes expire in 30 days</strong></li>
                <li><strong>Bring a valid ID for verification</strong></li>
              </ul>
            </div>
            
            <h3 style="color: #059669; margin: 25px 0 15px 0;">Your Verification Codes:</h3>
            ${bookingsList}
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #0369a1; margin: 0 0 15px 0;">📱 Payment Process at Event:</h3>
              <ol style="color: #0369a1; margin: 10px 0; padding-left: 20px; line-height: 1.6;">
                <li>Arrive at the event venue</li>
                <li>Find the organizer or registration desk</li>
                <li>Show your verification code (screenshot this email or write it down)</li>
                <li>Present your ID for verification</li>
                <li>Pay the amount due in cash</li>
                <li>Receive your ticket/entry</li>
              </ol>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin: 0 0 15px 0;">Booking Summary:</h3>
              <p style="margin: 5px 0;"><strong>Total Amount Due:</strong> $${totalAmount}</p>
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> Cash at Events</p>
              <p style="margin: 5px 0;"><strong>Booking Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Code Expiry:</strong> ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 15px 0;">
                Keep this email safe - you'll need these codes at the events!
              </p>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Questions? Contact the event organizer or our support team.<br>
              <strong>Remember:</strong> Codes are valid for 30 days from booking date.
            </p>
          </div>
        </div>
      `
    };

    console.log('[EMAIL] 📤 Attempting to send email to:', to);
    const result = await transporter.sendMail(mailOptions);
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Pay Later booking email sent successfully to: ${to}`);
    console.log('[EMAIL] Message ID:', result.messageId);
    return result;
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Error sending pay later booking email:`, error);
    console.error('[EMAIL] Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    throw error;
  }
};

// Send payment confirmation email after verification
export const sendPaymentConfirmationEmail = async (emailData) => {
  try {
    const { to, userName, eventTitle, bookingId, totalAmount, collectedAt, verificationCode } = emailData;
    const transporter = createMailtrapTransporter();

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'Event Tribe'}" <${process.env.MAIL_FROM_ADDRESS || 'jeetu.mj123@example.com'}>`,
      to: to,
      subject: `✅ Payment Confirmed - ${eventTitle}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">EVENT TRIBE</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px;">✅ Payment Confirmed!</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #059669; margin: 0 0 20px 0; font-size: 24px;">Hi ${userName}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Great news! Your payment for <strong>${eventTitle}</strong> has been successfully collected and verified.
            </p>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #0369a1; margin: 0 0 15px 0;">Payment Details:</h3>
              <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
              <p style="margin: 5px 0;"><strong>Event:</strong> ${eventTitle}</p>
              <p style="margin: 5px 0;"><strong>Amount Paid:</strong> $${totalAmount}</p>
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> Cash at Event</p>
              <p style="margin: 5px 0;"><strong>Verified At:</strong> ${collectedAt}</p>
              <p style="margin: 5px 0;"><strong>Verification Code:</strong> ${verificationCode}</p>
            </div>
            
            <div style="background: #dcfdf7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #047857; margin: 0 0 10px 0;">✓ You're All Set!</h3>
              <ul style="color: #047857; margin: 10px 0; padding-left: 20px;">
                <li>Your payment has been successfully processed</li>
                <li>Your event entry is now fully confirmed</li>
                <li>Keep this email as your receipt</li>
                <li>Enjoy the event!</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 15px 0;">
                Thank you for choosing Event Tribe!
              </p>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This is your payment receipt. Keep it for your records.<br>
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[${new Date().toLocaleTimeString()}] Payment confirmation email sent to: ${to}`);
    return result;
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error sending payment confirmation email:`, error);
    throw error;
  }
};

// Test email configuration
export const testEmailConnection = async () => {
  try {
    console.log('[EMAIL TEST] Testing email configuration...');
    const transporter = createMailtrapTransporter();

    // Test the connection
    await transporter.verify();
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Mailtrap SMTP server is ready to take our messages`);

    // Send a test email
    const testMailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'Event Tribe'}" <${process.env.MAIL_FROM_ADDRESS || 'jeetu.mj123@example.com'}>`,
      to: process.env.MAIL_FROM_ADDRESS || 'jeetu.mj123@example.com',
      subject: 'Test Email - EventTribe Configuration',
      html: `
        <h2>Email Test Successful!</h2>
        <p>This is a test email to verify your email configuration is working.</p>
        <p>Sent at: ${new Date().toLocaleString()}</p>
      `
    };

    const result = await transporter.sendMail(testMailOptions);
    console.log('[EMAIL TEST] ✅ Test email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Mailtrap SMTP server connection error:`, error);
    return false;
  }
};