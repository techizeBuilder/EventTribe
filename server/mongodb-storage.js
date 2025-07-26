import { MongoClient } from "mongodb";

export class MongoStorage {
  constructor() {
    this.client = null;
    this.db = null;
    this.users = null;
    this.isConnected = false;
    this.connectionPromise = null;
  }

  async connect(retryCount = 0) {
    // Return existing connection if already connected
    if (this.isConnected && this.client && this.db) {
      return true;
    }

    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._doConnect(retryCount);
    return this.connectionPromise;
  }

  async _doConnect(retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    
    try {
      // Use a clean connection string without SSL conflicts
      const mongoUri = process.env.MONGODB_URI || 
        "mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/eventTribe?retryWrites=true&w=majority";

      // Only close if we have an existing client that's not working
      if (this.client && !this.isConnected) {
        try {
          await this.client.close();
        } catch (e) {
          // Ignore close errors
        }
      }

      // Skip creating new client if already have a working one
      if (!this.client || !this.isConnected) {
        // Use connection pooling for better performance
        this.client = new MongoClient(mongoUri, {
          maxPoolSize: 10,
          minPoolSize: 2,
          maxIdleTimeMS: 30000,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
      }

      await this.client.connect();
      this.db = this.client.db("express_react_app");
      this.users = this.db.collection("users");
      this.cart = this.db.collection("cart");
      this.isConnected = true;

      console.log(
        `[${new Date().toLocaleTimeString()}] Connected to MongoDB successfully`,
      );

      // Create initial sample data if collection is empty
      const count = await this.users.countDocuments();
      if (count === 0) {
        await this.createSampleData();
      }

      return true;
    } catch (error) {
      console.error(
        `[${new Date().toLocaleTimeString()}] MongoDB connection error (attempt ${retryCount + 1}/${maxRetries + 1}):`,
        error.message,
      );
      this.isConnected = false;
      this.connectionPromise = null;
      
      if (retryCount < maxRetries) {
        console.log(`[${new Date().toLocaleTimeString()}] Retrying connection in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this._doConnect(retryCount + 1);
      }
      
      console.error(`[${new Date().toLocaleTimeString()}] Failed to connect after ${maxRetries + 1} attempts`);
      return false;
    }
  }

  // Quick connection check without retry logic
  async ensureConnection() {
    if (this.isConnected && this.client && this.db) {
      try {
        // Quick ping to verify connection is alive
        await this.db.admin().ping();
        return true;
      } catch (error) {
        console.log('Connection ping failed, reconnecting...');
        this.isConnected = false;
      }
    }
    
    return this.connect();
  }

  async createSampleData() {
    const sampleUsers = [
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        createdAt: new Date().toISOString(),
      },
    ];

    await this.users.insertMany(sampleUsers);
    console.log(
      `[${new Date().toLocaleTimeString()}] Sample data created in MongoDB`,
    );
  }

  // Duplicate method removed - already defined above

  async withRetry(operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.ensureConnection();
        if (!this.isConnected) {
          throw new Error('Database connection failed');
        }
        return await operation();
      } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Operation failed (attempt ${i + 1}/${maxRetries}):`, error.message);
        
        if (i === maxRetries - 1) {
          throw error;
        }
        
        // Reset connection on retry
        this.isConnected = false;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }

  async getUser(id) {
    return this.withRetry(async () => {
      const user = await this.users.findOne({ id: parseInt(id) });
      return user;
    });
  }

  async getUserByEmail(email) {
    return this.withRetry(async () => {
      const user = await this.users.findOne({ email });
      return user;
    });
  }

  async getAllUsers() {
    return this.withRetry(async () => {
      const users = await this.users.find({}).toArray();
      return users;
    });
  }

  async createUser(userData) {
    return this.withRetry(async () => {
      // Get the next ID
      const lastUser = await this.users.findOne({}, { sort: { id: -1 } });
      const nextId = lastUser ? lastUser.id + 1 : 1;

      const user = {
        id: nextId,
        ...userData,
        createdAt: new Date().toISOString(),
      };

      const result = await this.users.insertOne(user);
      return user;
    });
  }

  async updateUser(id, userData) {
    try {
      const result = await this.users.updateOne(
        { id: parseInt(id) },
        { $set: { ...userData, updatedAt: new Date().toISOString() } },
      );

      if (result.matchedCount === 0) {
        throw new Error("User not found");
      }

      return await this.getUser(id);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      const result = await this.users.deleteOne({ id: parseInt(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log(
        `[${new Date().toLocaleTimeString()}] Disconnected from MongoDB`,
      );
    }
  }

  async getStats() {
    try {
      const userCount = await this.users.countDocuments();
      return {
        totalUsers: userCount,
        databaseName: this.db.databaseName,
        isConnected: this.isConnected,
      };
    } catch (error) {
      console.error("Error getting stats:", error);
      return {
        totalUsers: 0,
        databaseName: "unknown",
        isConnected: false,
      };
    }
  }

  // Cart Management Methods
  async addToCart(userEmail, cartItem) {
    try {
      const existingItem = await this.cart.findOne({
        userEmail,
        eventId: cartItem.eventId,
        "ticketType.name": cartItem.ticketType.name,
      });

      if (existingItem) {
        // Update quantity if item exists
        await this.cart.updateOne(
          { _id: existingItem._id },
          {
            $inc: { quantity: cartItem.quantity },
            $set: { updatedAt: new Date() },
          },
        );
        return await this.cart.findOne({ _id: existingItem._id });
      } else {
        // Add new item with additional settings support
        const newItem = {
          userEmail,
          eventId: cartItem.eventId,
          eventTitle: cartItem.eventTitle,
          ticketType: cartItem.ticketType,
          quantity: cartItem.quantity,
          // Include additional settings if they exist
          additionalSettings: cartItem.additionalSettings || {},
          ticketPassword: cartItem.ticketPassword || null,
          earlyBirdPrice: cartItem.earlyBirdPrice || null,
          earlyBirdEndDate: cartItem.earlyBirdEndDate || null,
          creditPrice: cartItem.creditPrice || null,
          bundlePrice: cartItem.bundlePrice || null,
          waitlistTicket: cartItem.waitlistTicket || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await this.cart.insertOne(newItem);
        return await this.cart.findOne({ _id: result.insertedId });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  }

  async getCart(userEmail) {
    try {
      const cartItems = await this.cart.find({ userEmail }).toArray();
      return cartItems;
    } catch (error) {
      console.error("Error getting cart:", error);
      throw error;
    }
  }

  async updateCartItem(userEmail, itemId, quantity) {
    try {
      if (quantity <= 0) {
        await this.cart.deleteOne({ _id: itemId, userEmail });
        return null;
      }

      await this.cart.updateOne(
        { _id: itemId, userEmail },
        {
          $set: { quantity, updatedAt: new Date() },
        },
      );

      return await this.cart.findOne({ _id: itemId, userEmail });
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  }

  async removeFromCart(userEmail, itemId) {
    try {
      await this.cart.deleteOne({ _id: itemId, userEmail });
      return true;
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  }

  async clearCart(userEmail) {
    try {
      await this.cart.deleteMany({ userEmail });
      return true;
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  }

  async getCartCount(userEmail) {
    try {
      const result = await this.cart
        .aggregate([
          { $match: { userEmail } },
          { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } },
        ])
        .toArray();

      return result.length > 0 ? result[0].totalQuantity : 0;
    } catch (error) {
      console.error("Error getting cart count:", error);
      throw error;
    }
  }
}

export const mongoStorage = new MongoStorage();
