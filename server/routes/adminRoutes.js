
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { mongoSupportTicketService } from '../services/mongoSupportTicketService.js';

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
    const bookingsCollection = mongoStorage.db.collection('bookings');
    const { ObjectId } = await import('mongodb');
    const { status } = req.query;

    const filter = status ? { status } : {};
    const events = await eventsCollection.find(filter).sort({ updatedAt: -1 }).toArray();

    // Populate organizer information and calculate revenue for each event
    const eventsWithDetails = await Promise.all(events.map(async (event) => {
      let organizer = 'Unknown';
      let revenue = 0;
      let ticketsSold = 0;

      try {
        // Get organizer information
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

        // Calculate revenue from confirmed bookings in the bookings collection
        const confirmedBookings = await bookingsCollection.find({
          eventId: event._id.toString(),
          $or: [
            { paymentStatus: 'completed' },
            { status: 'confirmed' },
            { bookingStatus: 'confirmed' }
          ]
        }).toArray();

        console.log(`Event ${event.title}: Found ${confirmedBookings.length} confirmed bookings`);

        // Calculate total revenue and tickets sold
        revenue = confirmedBookings.reduce((sum, booking) => {
          const amount = parseFloat(booking.totalAmount || booking.amount || booking.total || 0);
          console.log(`Booking amount: ${amount}`);
          return sum + amount;
        }, 0);

        ticketsSold = confirmedBookings.reduce((sum, booking) => {
          const qty = parseInt(booking.quantity || booking.tickets || booking.ticketCount || 1);
          return sum + qty;
        }, 0);

        console.log(`Event ${event.title}: Revenue = $${revenue}, Tickets = ${ticketsSold}`);

      } catch (err) {
        console.error('Error fetching details for event:', event._id, err);
      }

      return {
        ...event,
        id: event._id,
        organizer: organizer,
        revenue: revenue,
        tickets: ticketsSold
      };
    }));

    res.json(eventsWithDetails);
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
    const validStatuses = ['draft', 'published', 'rejected', 'cancelled', 'completed'];
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
    } else if (status === 'rejected') {
      updateData.rejectedBy = req.user._id;
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = reason || 'No reason provided';
    } else if (status === 'cancelled') {
      updateData.cancelledBy = req.user._id;
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = reason || 'No reason provided';
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
    const usersCollection = mongoStorage.db.collection('auth_users');

    // Parse period parameter
    const { period = '30d' } = req.query;

    // Calculate date range based on period
    let daysBack;
    switch (period) {
      case '7d': daysBack = 7; break;
      case '30d': daysBack = 30; break;
      case '90d': daysBack = 90; break;
      case '1y': daysBack = 365; break;
      default: daysBack = 30;
    }

    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Get events by category (filtered by date)
    const eventsByCategory = await eventsCollection.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]).toArray();

    // Get bookings over time within the period
    const bookingsOverTime = await bookingsCollection.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]).toArray();

    // Get user growth data
    const userGrowthData = await usersCollection.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]).toArray();

    // Get top performing events
    const topEvents = await eventsCollection.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'eventId',
          as: 'bookings'
        }
      },
      {
        $addFields: {
          bookingCount: { $size: '$bookings' },
          totalRevenue: { $sum: '$bookings.totalAmount' }
        }
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          name: '$title',
          bookings: '$bookingCount',
          revenue: '$totalRevenue'
        }
      }
    ]).toArray();

    // Calculate comprehensive metrics
    const totalRevenue = bookingsOverTime.reduce((sum, day) => sum + (day.revenue || 0), 0);
    const totalBookings = bookingsOverTime.reduce((sum, day) => sum + (day.count || 0), 0);
    const totalEvents = await eventsCollection.countDocuments({ createdAt: { $gte: startDate } });
    const totalUsers = await usersCollection.countDocuments({ createdAt: { $gte: startDate } });

    // Calculate metrics
    const avgTicketPrice = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const conversionRate = totalUsers > 0 ? (totalBookings / totalUsers) * 100 : 0;

    // Calculate growth rate (compare with previous period)
    const prevStartDate = new Date(startDate.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const prevPeriodRevenue = await bookingsCollection.aggregate([
      { $match: { createdAt: { $gte: prevStartDate, $lt: startDate } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).toArray();

    const prevRevenue = prevPeriodRevenue[0]?.total || 0;
    const growthRate = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const analytics = {
      eventsByCategory,
      bookingsOverTime,
      userGrowthData,
      topEvents,
      overview: {
        totalRevenue,
        totalEvents,
        totalUsers,
        avgTicketPrice: Number(avgTicketPrice.toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(1)),
        growthRate: Number(growthRate.toFixed(1))
      },
      period,
      dateRange: {
        start: startDate,
        end: new Date()
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

// GET /api/admin/payout/stats - Get payout statistics
router.get('/payout/stats', async (req, res) => {
  try {
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    const { ObjectId } = await import('mongodb');
    const bookingsCollection = mongoStorage.db.collection('bookings');
    const withdrawalsCollection = mongoStorage.db.collection('withdrawal_requests');

    // Calculate total revenue from all confirmed bookings
    const confirmedBookings = await bookingsCollection.find({
      status: 'confirmed'
    }).toArray();

    const totalRevenue = confirmedBookings.reduce((sum, booking) => {
      return sum + (parseFloat(booking.totalAmount || booking.amount) || 0);
    }, 0);

    // Get withdrawal statistics
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const allWithdrawals = await withdrawalsCollection.find({}).toArray();
    const thisMonthWithdrawals = await withdrawalsCollection.find({
      createdAt: { $gte: currentMonth }
    }).toArray();

    const pendingWithdrawals = allWithdrawals.filter(w => w.status === 'pending' || w.status === 'processing');
    const approvedWithdrawals = thisMonthWithdrawals.filter(w => w.status === 'approved' || w.status === 'completed');

    const stats = {
      totalRevenue: totalRevenue,
      monthlyRevenue: thisMonthWithdrawals.reduce((sum, w) => sum + (w.requestedAmount || 0), 0),
      totalPlatformFees: 0, // Simplified - no platform fees
      totalOrganizationPayouts: allWithdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + (w.requestedAmount || 0), 0),
      pendingWithdrawals: pendingWithdrawals.reduce((sum, w) => sum + (w.requestedAmount || 0), 0),
      pendingRequestsCount: pendingWithdrawals.length,
      approvedRequestsCount: approvedWithdrawals.length,
      rejectedRequestsCount: allWithdrawals.filter(w => w.status === 'rejected').length,
      currentMonth: currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get payout stats error:', error);
    res.status(500).json({ message: 'Failed to fetch payout statistics' });
  }
});

// GET /api/admin/payout/withdrawal-requests - Get all withdrawal requests
router.get('/payout/withdrawal-requests', async (req, res) => {
  try {
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    const { ObjectId } = await import('mongodb');
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const withdrawalsCollection = mongoStorage.db.collection('withdrawal_requests');
    const usersCollection = mongoStorage.db.collection('auth_users');

    // Build filter
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get withdrawals with pagination
    const withdrawals = await withdrawalsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const totalCount = await withdrawalsCollection.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Enrich with organizer details
    const enrichedRequests = await Promise.all(withdrawals.map(async (withdrawal) => {
      let organizer = null;

      try {
        const organizerUser = await usersCollection.findOne({
          _id: new ObjectId(withdrawal.organizerId)
        });

        if (organizerUser) {
          organizer = {
            name: organizerUser.organizationName ||
              `${organizerUser.firstName || ''} ${organizerUser.lastName || ''}`.trim() ||
              organizerUser.email || 'Unknown',
            email: organizerUser.email,
            id: organizerUser._id
          };
        }
      } catch (err) {
        console.error('Error fetching organizer:', err);
      }

      return {
        _id: withdrawal._id,
        requestedAmount: withdrawal.requestedAmount,
        organization: organizer,
        createdAt: withdrawal.createdAt,
        status: withdrawal.status,
        type: withdrawal.type || 'pending_approval',
        reason: withdrawal.requestReason,
        referenceNumber: withdrawal.referenceNumber,
        bankDetails: withdrawal.bankDetails,
        paymentGateway: withdrawal.paymentGateway,
        rejectionReason: withdrawal.rejectionReason || null,
        processedAt: withdrawal.processedAt || null,
        processedBy: withdrawal.processedBy || null
      };
    }));

    res.json({
      requests: enrichedRequests,
      totalPages: totalPages,
      currentPage: parseInt(page),
      totalCount: totalCount
    });
  } catch (error) {
    console.error('Get withdrawal requests error:', error);
    res.status(500).json({ message: 'Failed to fetch withdrawal requests' });
  }
});

// PATCH /api/admin/payout/withdrawal-requests/:id - Approve/Reject withdrawal request
router.patch('/payout/withdrawal-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be approve or reject.' });
    }

    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    const { ObjectId } = await import('mongodb');
    const withdrawalsCollection = mongoStorage.db.collection('withdrawal_requests');

    // Find the withdrawal request
    const withdrawal = await withdrawalsCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    // Update withdrawal status
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      processedAt: new Date(),
      processedBy: req.user._id,
      adminRemarks: remarks
    };

    if (action === 'reject') {
      updateData.rejectionReason = remarks;
    } else {
      // For approved requests, initiate payment processing
      updateData.paymentGateway = {
        ...withdrawal.paymentGateway,
        status: 'approved',
        approvedAt: new Date()
      };
    }

    const result = await withdrawalsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    // Update organizer's earnings if approved
    if (action === 'approve') {
      const earningsCollection = mongoStorage.db.collection('earnings');
      await earningsCollection.updateOne(
        { organizerId: new ObjectId(withdrawal.organizerId) },
        {
          $inc: {
            paidEarnings: withdrawal.requestedAmount,
            requestedEarnings: -withdrawal.requestedAmount
          }
        },
        { upsert: true }
      );

      // Create a completed payout record
      const payoutsCollection = mongoStorage.db.collection('payouts');
      const payoutRecord = {
        organizerId: new ObjectId(withdrawal.organizerId),
        withdrawalRequestId: new ObjectId(id),
        amount: withdrawal.requestedAmount,
        status: 'completed',
        method: 'bank_transfer',
        description: `Withdrawal request ${withdrawal.referenceNumber || 'N/A'}`,
        bankDetails: withdrawal.bankDetails,
        createdAt: new Date(),
        processedAt: new Date(),
        processedBy: req.user._id,
        adminRemarks: remarks
      };

      await payoutsCollection.insertOne(payoutRecord);

      console.log(`[Admin] Approved withdrawal ${withdrawal.referenceNumber} for $${withdrawal.requestedAmount}`);
    } else {
      console.log(`[Admin] Rejected withdrawal ${withdrawal.referenceNumber}: ${remarks}`);
    }

    res.json({
      message: `Withdrawal request ${action}ed successfully`,
      withdrawal: result.value || result
    });
  } catch (error) {
    console.error('Process withdrawal request error:', error);
    res.status(500).json({ message: 'Failed to process withdrawal request' });
  }
});

// ==================== SUPPORT TICKET MANAGEMENT ====================

// GET /api/admin/support/tickets - Get all support tickets
router.get('/support/tickets', async (req, res) => {
  try {
    const { status, priority } = req.query;
    const { mongoStorage } = await import('../mongodb-storage.js');
    const tickets = await mongoSupportTicketService.getAllTickets(status, priority, mongoStorage);
    res.json(tickets);
  } catch (error) {
    console.error('Get admin tickets error:', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

// GET /api/admin/support/tickets/stats - Get ticket statistics
router.get('/support/tickets/stats', async (req, res) => {
  try {
    const { mongoStorage } = await import('../mongodb-storage.js');
    const stats = await mongoSupportTicketService.getTicketCounts(mongoStorage);
    res.json(stats);
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({ message: 'Failed to fetch ticket statistics' });
  }
});

// GET /api/admin/support/tickets/:id - Get specific ticket with messages
router.get('/support/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { mongoStorage } = await import('../mongodb-storage.js');
    const result = await mongoSupportTicketService.getTicketById(id, mongoStorage);

    res.json(result);
  } catch (error) {
    console.error('Get admin ticket details error:', error);
    res.status(500).json({ message: 'Failed to fetch ticket details' });
  }
});

// POST /api/admin/support/tickets/:id/messages - Add message to ticket
router.post('/support/tickets/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { message, isInternal = false } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get ticket details to get organizer email
    const { mongoStorage } = await import('../mongodb-storage.js');
    const ticket = await mongoSupportTicketService.getTicketById(id, mongoStorage);

    const messageData = {
      ticketId: id,
      senderId: req.user._id,
      senderName: req.user.firstName && req.user.lastName
        ? `${req.user.firstName} ${req.user.lastName}`
        : req.user.email || 'Admin',
      senderType: 'admin',
      message: message.trim(),
      messageType: 'text',
      isInternal
    };

    const result = await mongoSupportTicketService.addMessage(id, messageData, mongoStorage);

    // Send WebSocket notification for real-time updates
    try {
      if (global.broadcastMessage) {
        global.broadcastMessage({
          type: 'new-message',
          senderType: 'admin',
          senderName: 'Admin',
          ticketId: id,
          ticketNumber: ticket.ticketNumber,
          organizerEmail: ticket.organizerEmail,
          message: result
        });
      }
    } catch (error) {
      console.error('Error sending WebSocket notification:', error);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Add admin message error:', error);
    res.status(500).json({ message: 'Failed to add message' });
  }
});

// Remove duplicate PUT route - using PATCH only

// PATCH /api/admin/support/tickets/:id/status - Update ticket status (alternative method)
router.patch('/support/tickets/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    console.log(`[PATCH Status] Updating ticket ${id} to status: ${status}`);

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const adminName = req.user.firstName && req.user.lastName
      ? `${req.user.firstName} ${req.user.lastName}`
      : req.user.email || 'Admin';

    const { mongoStorage } = await import('../mongodb-storage.js');
    console.log(`[PATCH Status] MongoDB storage imported:`, mongoStorage ? 'OK' : 'undefined');
    console.log(`[PATCH Status] Calling updateTicketStatus with params:`, {
      id, status, adminId: req.user._id, adminName, resolutionNotes
    });

    const result = await mongoSupportTicketService.updateTicketStatus(
      id,
      status,
      req.user._id,
      adminName,
      resolutionNotes,
      mongoStorage
    );

    console.log(`[PATCH Status] Status update successful:`, result);

    // Send real-time notification about status update
    const { pusherService } = await import('../services/pusherService.js');
    await pusherService.updateTicketStatus(id, status, adminName);

    // Also notify organizer about status change
    const ticket = result;
    if (ticket.organizerEmail) {
      await pusherService.notifyOrganizer(ticket.organizerEmail, {
        type: 'ticket_status_updated',
        ticketId: id,
        ticketNumber: ticket.ticketNumber,
        status: status,
        updatedBy: adminName,
        message: `Your ticket status has been updated to ${status}`
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({ message: 'Failed to update ticket status' });
  }
});

// PATCH /api/admin/support/tickets/:id/assign - Assign ticket to admin (alternative method)
router.patch('/support/tickets/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[PATCH Assign] Assigning ticket ${id}`);

    const adminName = req.user.firstName && req.user.lastName
      ? `${req.user.firstName} ${req.user.lastName}`
      : req.user.email || 'Admin';

    const { mongoStorage } = await import('../mongodb-storage.js');
    console.log(`[PATCH Assign] MongoDB storage imported, calling updateTicketStatus`);

    const result = await mongoSupportTicketService.updateTicketStatus(
      id,
      'in_progress',
      req.user._id,
      adminName,
      null,
      mongoStorage
    );

    console.log(`[PATCH Assign] Assign successful:`, result);
    res.json(result);
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ message: 'Failed to assign ticket' });
  }
});

// Remove duplicate PUT route - using PATCH only

// DELETE /api/admin/support/tickets/:id - Delete ticket
router.delete('/support/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { mongoStorage } = await import('../mongodb-storage.js');
    const result = await mongoSupportTicketService.deleteTicket(id, mongoStorage);

    if (result) {
      res.json({ message: 'Ticket deleted successfully' });
    } else {
      res.status(404).json({ message: 'Ticket not found' });
    }
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ message: 'Failed to delete ticket' });
  }
});

// PUT /api/admin/support/tickets/:id/mark-read - Mark messages as read
router.put('/support/tickets/:id/mark-read', async (req, res) => {
  try {
    const { id } = req.params;
    const { mongoSupportTicketService } = await import('../services/mongoSupportTicketService.js');
    const { mongoStorage } = await import('../mongodb-storage.js');

    await mongoSupportTicketService.markMessagesAsRead(id, 'admin', mongoStorage);
    res.json({ message: 'Messages marked as read successfully' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

export default router;
