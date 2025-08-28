
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupBookings() {
  const mongoUri = process.env.MONGODB_URI || 
    "mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/eventTribe?retryWrites=true&w=majority";

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db("express_react_app");
    
    console.log("=== BOOKING DATA ANALYSIS ===");
    
    // Check bookings collection
    const bookingsCollection = db.collection('bookings');
    const bookings = await bookingsCollection.find({}).toArray();
    console.log(`\nFound ${bookings.length} bookings in 'bookings' collection:`);
    
    const validBookings = [];
    const invalidBookings = [];
    
    for (const booking of bookings) {
      // Check if booking has required fields and valid payment
      const isValid = booking.paymentIntentId && 
                     booking.eventId && 
                     booking.userEmail && 
                     booking.totalAmount > 0 &&
                     booking.bookingDate;
      
      if (isValid) {
        validBookings.push(booking);
        console.log(`✓ Valid: ${booking.bookingId} - ${booking.eventTitle} - $${booking.totalAmount}`);
      } else {
        invalidBookings.push(booking);
        console.log(`✗ Invalid: ${booking.bookingId || 'NO-ID'} - Missing required fields`);
      }
    }
    
    // Check sample_bookings collection
    const sampleBookingsCollection = db.collection('sample_bookings');
    const sampleBookings = await sampleBookingsCollection.find({}).toArray();
    console.log(`\nFound ${sampleBookings.length} sample bookings in 'sample_bookings' collection`);
    
    // Check attendees collection (sometimes used for bookings)
    const attendeesCollection = db.collection('attendees');
    const attendees = await attendeesCollection.find({}).toArray();
    console.log(`\nFound ${attendees.length} attendees in 'attendees' collection`);
    
    console.log("\n=== CLEANUP SUMMARY ===");
    console.log(`Valid bookings: ${validBookings.length}`);
    console.log(`Invalid bookings: ${invalidBookings.length}`);
    console.log(`Sample bookings: ${sampleBookings.length}`);
    console.log(`Attendees: ${attendees.length}`);
    
    // Remove invalid bookings
    if (invalidBookings.length > 0) {
      console.log(`\nRemoving ${invalidBookings.length} invalid bookings...`);
      const invalidIds = invalidBookings.map(b => b._id);
      const deleteResult = await bookingsCollection.deleteMany({
        _id: { $in: invalidIds }
      });
      console.log(`Deleted ${deleteResult.deletedCount} invalid bookings`);
    }
    
    // Remove all sample bookings
    if (sampleBookings.length > 0) {
      console.log(`\nRemoving ${sampleBookings.length} sample bookings...`);
      const sampleDeleteResult = await sampleBookingsCollection.deleteMany({});
      console.log(`Deleted ${sampleDeleteResult.deletedCount} sample bookings`);
    }
    
    // Remove attendees that don't have corresponding valid bookings
    if (attendees.length > 0) {
      console.log(`\nChecking ${attendees.length} attendees for validity...`);
      const validEventIds = validBookings.map(b => b.eventId);
      const attendeesToRemove = attendees.filter(a => !validEventIds.includes(a.eventId));
      
      if (attendeesToRemove.length > 0) {
        const attendeeIds = attendeesToRemove.map(a => a._id);
        const attendeeDeleteResult = await attendeesCollection.deleteMany({
          _id: { $in: attendeeIds }
        });
        console.log(`Deleted ${attendeeDeleteResult.deletedCount} orphaned attendees`);
      }
    }
    
    console.log("\n=== FINAL STATE ===");
    const finalBookings = await bookingsCollection.find({}).toArray();
    console.log(`Final bookings count: ${finalBookings.length}`);
    
    if (finalBookings.length > 0) {
      console.log("\nRemaining valid bookings:");
      finalBookings.forEach(booking => {
        console.log(`- ${booking.bookingId}: ${booking.eventTitle} - $${booking.totalAmount} (${booking.userEmail})`);
      });
    } else {
      console.log("No bookings remain in the database");
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await client.close();
  }
}

cleanupBookings();
