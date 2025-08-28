
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'super_admin'])); // Allow both admin and super_admin roles

// GET /api/admin/events/pending - Get events pending approval
router.get('/events/pending', async (req, res) => {
  try {
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const eventsCollection = mongoStorage.db.collection('events');
    const pendingEvents = await eventsCollection.find({ 
      status: 'pending_approval' 
    }).sort({ updatedAt: -1 }).toArray();
    
    res.json(pendingEvents);
  } catch (error) {
    console.error('Get pending events error:', error);
    res.status(500).json({ message: 'Failed to fetch pending events' });
  }
});

// GET /api/admin/events - Get all events for admin
router.get('/events', async (req, res) => {
  try {
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const eventsCollection = mongoStorage.db.collection('events');
    const usersCollection = mongoStorage.db.collection('auth_users');
    const { ObjectId } = await import('mongodb');
    const { status } = req.query;
    
    const filter = status ? { status } : {};
    const events = await eventsCollection.find(filter).sort({ updatedAt: -1 }).toArray();
    
    // Populate organizer information for each event
    const eventsWithOrganizer = await Promise.all(events.map(async (event) => {
      let organizer = 'Unknown';
      try {
        if (event.organizerId) {
          const organizerUser = await usersCollection.findOne({ 
            _id: new ObjectId(event.organizerId) 
          });
          if (organizerUser) {
            // Use organizationName if available, otherwise firstName + lastName
            organizer = organizerUser.organizationName || 
                       `${organizerUser.firstName || ''} ${organizerUser.lastName || ''}`.trim() ||
                       organizerUser.email ||
                       'Unknown';
          }
        }
      } catch (err) {
        console.error('Error fetching organizer for event:', event._id, err);
      }
      
      return {
        ...event,
        id: event._id,
        organizer: organizer
      };
    }));
    
    res.json(eventsWithOrganizer);
  } catch (error) {
    console.error('Get admin events error:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// PUT /api/admin/events/:id/approve - Approve event for publishing
router.put('/events/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const eventsCollection = mongoStorage.db.collection('events');
    const { ObjectId } = await import('mongodb');
    
    const result = await eventsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'published', 
          approvedBy: req.user._id,
          approvedAt: new Date(),
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (result.value) {
      res.json({ message: 'Event approved and published successfully', event: result.value });
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    console.error('Approve event error:', error);
    res.status(500).json({ message: 'Failed to approve event' });
  }
});

// PUT /api/admin/events/:id/reject - Reject event
router.put('/events/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const eventsCollection = mongoStorage.db.collection('events');
    const { ObjectId } = await import('mongodb');
    
    const result = await eventsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'rejected', 
          rejectedBy: req.user._id,
          rejectedAt: new Date(),
          rejectionReason: reason || 'No reason provided',
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (result.value) {
      res.json({ message: 'Event rejected successfully', event: result.value });
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    console.error('Reject event error:', error);
    res.status(500).json({ message: 'Failed to reject event' });
  }
});

// PUT /api/admin/events/:id/unpublish - Unpublish event
router.put('/events/:id/unpublish', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const eventsCollection = mongoStorage.db.collection('events');
    const { ObjectId } = await import('mongodb');
    
    const result = await eventsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'unpublished', 
          unpublishedBy: req.user._id,
          unpublishedAt: new Date(),
          unpublishReason: reason || 'No reason provided',
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (result.value) {
      res.json({ message: 'Event unpublished successfully', event: result.value });
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    console.error('Unpublish event error:', error);
    res.status(500).json({ message: 'Failed to unpublish event' });
  }
});

// PUT /api/admin/events/:id/status - Update event status
router.put('/events/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    console.log('Status update request:', { id, status, reason });
    
    // Check if ID is valid
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Valid event ID is required' });
    }

    // Validate status
    const validStatuses = ['draft', 'published'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided' });
    }
    
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const eventsCollection = mongoStorage.db.collection('events');
    const { ObjectId } = await import('mongodb');
    
    const updateData = { 
      status: status,
      updatedAt: new Date() 
    };

    // Add specific fields based on status
    if (status === 'published') {
      updateData.publishedBy = req.user._id;
      updateData.publishedAt = new Date();
    }
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }
    
    console.log('Attempting to update event with ObjectId:', id);
    const result = await eventsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    console.log('Update result:', result);
    
    if (result) {
      res.json({ message: 'Event status updated successfully', event: result });
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({ message: 'Failed to update event status' });
  }
});

// GET /api/admin/users - Get all users for admin
router.get('/users', async (req, res) => {
  try {
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const usersCollection = mongoStorage.db.collection('auth_users');
    const users = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    // Remove sensitive information and map _id to id
    const sanitizedUsers = users.map(user => ({
      ...user,
      id: user._id,
      password: undefined
    }));
    
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id - Get specific user for admin
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id || id.length !== 24) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const usersCollection = mongoStorage.db.collection('auth_users');
    const { ObjectId } = await import('mongodb');
    
    let user;
    try {
      user = await usersCollection.findOne({ _id: new ObjectId(id) });
    } catch (objIdError) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive information and map _id to id
    const sanitizedUser = { ...user, id: user._id, password: undefined };
    
    res.json(sanitizedUser);
  } catch (error) {
    console.error('Get admin user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// GET /api/admin/overview - Get admin dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const usersCollection = mongoStorage.db.collection('auth_users');
    const eventsCollection = mongoStorage.db.collection('events');
    const bookingsCollection = mongoStorage.db.collection('bookings');
    
    // Get counts
    const totalUsers = await usersCollection.countDocuments();
    const totalEvents = await eventsCollection.countDocuments();
    const activeEvents = await eventsCollection.countDocuments({ status: 'published' });
    const pendingEvents = await eventsCollection.countDocuments({ status: 'pending_approval' });
    
    // Calculate total revenue (sample calculation)
    const bookings = await bookingsCollection.find({}).toArray();
    const totalRevenue = bookings.reduce((sum, booking) => {
      return sum + (booking.totalAmount || 0);
    }, 0);
    
    // Get total attendees
    const totalAttendees = bookings.reduce((sum, booking) => {
      return sum + (booking.tickets?.length || 0);
    }, 0);
    
    // Calculate monthly growth (placeholder)
    const monthlyGrowth = 12.5;
    
    res.json({
      totalUsers,
      totalEvents,
      totalRevenue,
      activeEvents,
      pendingEvents,
      totalAttendees,
      monthlyGrowth
    });
  } catch (error) {
    console.error('Get admin overview error:', error);
    res.status(500).json({ message: 'Failed to fetch overview data' });
  }
});

// GET /api/admin/activities - Get recent admin activities
router.get('/activities', async (req, res) => {
  try {
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    // This is a placeholder - you might want to implement a proper activity log
    const activities = [
      {
        id: 1,
        type: 'user_registration',
        message: 'New user registered: john@example.com',
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      },
      {
        id: 2,
        type: 'event_approval',
        message: 'Event "Tech Conference 2024" approved',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        id: 3,
        type: 'booking_created',
        message: 'New booking created for "Music Festival"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
      }
    ];
    
    res.json(activities);
  } catch (error) {
    console.error('Get admin activities error:', error);
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
});

// GET /api/admin/analytics - Get admin analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const eventsCollection = mongoStorage.db.collection('events');
    const bookingsCollection = mongoStorage.db.collection('bookings');
    
    // Get events by category
    const eventsByCategory = await eventsCollection.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]).toArray();
    
    // Get bookings over time (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const bookingsOverTime = await bookingsCollection.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { 
        $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]).toArray();
    
    // Sample data for demonstration
    const analytics = {
      eventsByCategory,
      bookingsOverTime,
      topEvents: [
        { name: 'Tech Conference 2024', bookings: 150, revenue: 15000 },
        { name: 'Music Festival', bookings: 230, revenue: 23000 },
        { name: 'Art Exhibition', bookings: 80, revenue: 4000 }
      ],
      revenueMetrics: {
        totalRevenue: bookingsOverTime.reduce((sum, day) => sum + (day.revenue || 0), 0),
        averageTicketPrice: 75,
        conversionRate: 8.5
      }
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Get admin analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

// GET /api/admin/events/:id/bookings - Get bookings for a specific event
router.get('/events/:id/bookings', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is valid
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Valid event ID is required' });
    }
    
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const bookingsCollection = mongoStorage.db.collection('bookings');
    const { ObjectId } = await import('mongodb');
    
    // Get bookings for this event - try both string and ObjectId formats
    const bookings = await bookingsCollection.find({ 
      $or: [
        { eventId: id },  // Try as string first
        { eventId: new ObjectId(id) }  // Try as ObjectId
      ]
    }).sort({ createdAt: -1 }).toArray();
    
    if (bookings.length === 0) {
      return res.json([]);
    }
    
    // Get additional collections for enrichment
    const eventsCollection = mongoStorage.db.collection('events');
    const usersCollection = mongoStorage.db.collection('users');
    
    // Get the event details
    const event = await eventsCollection.findOne({
      $or: [
        { _id: new ObjectId(id) },
        { _id: id }
      ]
    });
    
    // Enrich bookings with user and event details
    const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
      // Get user details
      let user = null;
      if (booking.userEmail) {
        user = await usersCollection.findOne({ email: booking.userEmail });
      }
      
      return {
        ...booking,
        id: booking._id,
        // Event details
        event: event ? {
          title: event.title,
          date: event.startDate,
          endDate: event.endDate,
          location: event.location || event.venue,
          address: event.address,
          image: event.image,
          description: event.description,
          category: event.category
        } : null,
        
        // User details
        user: user ? {
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
          email: user.email,
          phone: user.phone || 'N/A',
          profileImage: user.profileImage || user.avatar || null,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          dateJoined: user.createdAt || user.dateJoined || null
        } : {
          name: booking.userName || 'Unknown User',
          email: booking.userEmail || 'N/A',
          phone: 'N/A',
          profileImage: null,
          firstName: '',
          lastName: '',
          dateJoined: null
        },
        
        // Additional booking details for consistency
        customerName: booking.userName || (user ? user.name : 'Unknown User'),
        customerEmail: booking.userEmail,
        customerPhone: user ? user.phone : 'N/A',
        
        // Payment details
        payment: {
          status: booking.paymentStatus || 'pending',
          method: booking.paymentMethod || 'Unknown',
          transactionId: booking.transactionId || booking.paymentId || booking.paymentIntentId || 'N/A',
          amount: booking.totalAmount || booking.amount,
          currency: booking.currency || 'USD'
        }
      };
    }));
    
    res.json(enrichedBookings);
  } catch (error) {
    console.error('Get event bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch event bookings' });
  }
});

// PUT /api/admin/users/:id/status - Update user status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Check if ID is valid
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }
    
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const usersCollection = mongoStorage.db.collection('auth_users');
    const { ObjectId } = await import('mongodb');
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: status,
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    
    // Handle both old and new MongoDB driver return formats
    const updatedUser = result.value || result;
    
    if (updatedUser) {
      const userResponse = { ...updatedUser, password: undefined, id: updatedUser._id };
      res.json({ message: 'User status updated successfully', user: userResponse });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// PUT /api/admin/users/:id/role - Update user role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // Check if ID is valid
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }
    
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const usersCollection = mongoStorage.db.collection('auth_users');
    const { ObjectId } = await import('mongodb');
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          role: role,
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    
    // Handle both old and new MongoDB driver return formats
    const updatedUser = result.value || result;
    
    if (updatedUser) {
      const userResponse = { ...updatedUser, password: undefined, id: updatedUser._id };
      res.json({ message: 'User role updated successfully', user: userResponse });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID is valid
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }
    
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const usersCollection = mongoStorage.db.collection('auth_users');
    const { ObjectId } = await import('mongodb');
    
    const result = await usersCollection.findOneAndDelete({ _id: new ObjectId(id) });
    
    if (result.value) {
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// POST /api/admin/users - Create new user
router.post('/users', async (req, res) => {
  try {
    const { email, firstName, lastName, role, password } = req.body;
    
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const usersCollection = mongoStorage.db.collection('auth_users');
    const bcrypt = await import('bcryptjs');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = {
      firstName,
      lastName,
      email,
      role: role || 'attendee',
      password: hashedPassword,
      emailVerified: false,
      phoneVerified: false,
      suspended: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(newUser);
    
    // Remove password from response and map _id to id
    const userResponse = { ...newUser, password: undefined, id: result.insertedId, _id: result.insertedId };
    
    res.status(201).json({ message: 'User created successfully', user: userResponse });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if ID is valid
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Valid user ID is required' });
    }
    
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const usersCollection = mongoStorage.db.collection('auth_users');
    const { ObjectId } = await import('mongodb');
    
    // Remove sensitive fields that shouldn't be updated this way
    delete updateData.password;
    delete updateData._id;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData,
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    
    // Handle both old and new MongoDB driver return formats
    const updatedUser = result.value || result;
    
    if (updatedUser) {
      // Remove password from response and map _id to id
      const userResponse = { ...updatedUser, password: undefined, id: updatedUser._id };
      res.json({ message: 'User updated successfully', user: userResponse });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

export default router;
