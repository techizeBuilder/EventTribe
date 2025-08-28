import nodemailer from 'nodemailer';

// Mailtrap SMTP configuration
const createMailtrapTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: '122e79cfec2d29',
      pass: '9324e83d713de6'
    }
  });
  
  // Verify the transporter is created successfully
  if (!transporter) {
    throw new Error('Failed to create email transporter');
  }
  
  return transporter;
};

// Send email notification to attendee
export const sendAttendeeNotification = async (bookingData) => {
  try {
    const transporter = createMailtrapTransporter();
    
    const mailOptions = {
      from: '"Event Tribe" <noreply@eventtribe.com>',
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
    throw error;
  }
};

// Send email notification to organizer
export const sendOrganizerNotification = async (bookingData, organizerEmail) => {
  try {
    const transporter = createMailtrapTransporter();
    
    const mailOptions = {
      from: '"Event Tribe" <noreply@eventtribe.com>',
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

// Test email configuration
export const testEmailConnection = async () => {
  try {
    const transporter = createMailtrapTransporter();
    await transporter.verify();
    console.log(`[${new Date().toLocaleTimeString()}] Mailtrap SMTP server is ready to take our messages`);
    return true;
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Mailtrap SMTP server connection error:`, error);
    return false;
  }
};