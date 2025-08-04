import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/eventTribe";

class AuthService {
  constructor() {
    this.client = null;
    this.db = null;
    this.users = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(MONGO_URI);
      await this.client.connect();
      this.db = this.client.db("express_react_app");
      this.users = this.db.collection("auth_users");
      console.log("[Auth] Connected to MongoDB");
    } catch (error) {
      console.error("[Auth] MongoDB connection failed:", error);
      throw error;
    }
  }

  generateToken(userId, role) {
    // Generate token without expiration
    return jwt.sign({ userId, role }, JWT_SECRET);
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  async register(userData) {
    try {
      const {
        role,
        firstName,
        lastName,
        email,
        currency,
        dateOfBirth,
        phone,
        organizationName,
        instagramHandle,
        password,
        acceptTerms,
      } = userData;

      // Check if user already exists
      const existingUser = await this.users.findOne({ email });
      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user document
      const userDoc = {
        role,
        firstName,
        lastName,
        email,
        currency,
        dateOfBirth,
        phone,
        organizationName: role === "organizer" ? organizationName : null,
        instagramHandle,
        password: hashedPassword,
        acceptTerms,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await this.users.insertOne(userDoc);
      const user = { ...userDoc, _id: result.insertedId };
      delete user.password; // Don't return password

      const token = this.generateToken(user._id, user.role);

      return { user, token };
    } catch (error) {
      throw error;
    }
  }

  async login(credentials) {
    try {
      const { email, password, role } = credentials;

      // Find user by email
      const user = await this.users.findOne({ email });
      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Check role matches
      if (user.role !== role) {
        throw new Error("Invalid role selected");
      }

      // Verify password
      const isValidPassword = await this.comparePassword(
        password,
        user.password,
      );
      if (!isValidPassword) {
        throw new Error("Invalid email or password");
      }

      // Remove password from user object
      delete user.password;

      const token = this.generateToken(user._id, user.role);

      return { user, token };
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = await this.users.findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } }, // Exclude password
      );
      return user;
    } catch (error) {
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const result = await this.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            ...updateData,
            updatedAt: new Date(),
          },
        },
      );
      return result;
    } catch (error) {
      throw error;
    }
  }
}

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    const authService = new AuthService();
    const decoded = authService.verifyToken(token);

    // Get user data
    await authService.connect();
    const user = await authService.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Middleware to check user role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

export { AuthService, authenticateToken, requireRole };
