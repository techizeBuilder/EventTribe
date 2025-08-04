
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['super_admin'])); // Only super admin can access these routes

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
    const { status } = req.query;
    
    const filter = status ? { status } : {};
    const events = await eventsCollection.find(filter).sort({ updatedAt: -1 }).toArray();
    
    res.json(events);
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

export default router;
