import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";
import { smsService } from "./services/smsService.js";
import { otpService } from "./services/otpService.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import nodemailer from 'nodemailer';

// Simple login notification function
async function sendLoginNotificationEmail(user) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 587,
      secure: false,
      auth: {
        user: '122e79cfec2d29',
        pass: '9324e83d713de6'
      }
    });

    const mailOptions = {
      from: '"Event Tribe" <noreply@eventtribe.com>',
      to: user.email,
      subject: '🔐 Login Alert - Event Tribe',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">EVENT TRIBE</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px;">🔐 Login Alert</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #4f46e5; margin: 0 0 20px 0; font-size: 24px;">Hi ${user.username || user.email}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              You have successfully logged into your Event Tribe account.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #4f46e5; margin: 0 0 15px 0;">Login Details:</h3>
              <p style="margin: 5px 0;"><strong>Account:</strong> ${user.email}</p>
              <p style="margin: 5px 0;"><strong>Role:</strong> ${user.role}</p>
              <p style="margin: 5px 0;"><strong>Login Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;">
                <strong>Security Notice:</strong> If this login was not you, please contact our support team immediately.
              </p>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Thank you for using Event Tribe! <br>
              Stay connected and manage your events with ease.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[${new Date().toLocaleTimeString()}] Login notification email sent to: ${user.email}`);
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error sending login notification email:`, error);
    throw error;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-for-development-only';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-for-development-only';
const MONGO_URI =
  process.env.MONGODB_URI ||
   "mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/eventTribe";

class EnhancedAuthService {
  constructor() {
    this.client = null;
    this.db = null;
    this.users = null;
    this.refreshTokens = null;
    this.passwordResets = null;
    this.setupGoogleAuth();
  }

  async connect() {
    try {
      this.client = new MongoClient(MONGO_URI);
      await this.client.connect();
      this.db = this.client.db("express_react_app");
      this.users = this.db.collection("auth_users");
      this.refreshTokens = this.db.collection("refresh_tokens");
      this.passwordResets = this.db.collection("password_resets");
      console.log("[Enhanced Auth] Connected to MongoDB");
    } catch (error) {
      console.error("[Enhanced Auth] MongoDB connection failed:", error);
      throw error;
    }
  }

  setupGoogleAuth() {
    // Only setup Google OAuth if credentials are provided
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      passport.use(
        new GoogleStrategy(
          {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/api/auth/google/callback",
          },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists with Google ID
            let user = await this.users.findOne({ googleId: profile.id });

            if (user) {
              return done(null, user);
            }

            // Check if user exists with same email
            user = await this.users.findOne({ email: profile.emails[0].value });

            if (user) {
              // Link Google account to existing user
              await this.users.updateOne(
                { _id: user._id },
                {
                  $set: {
                    googleId: profile.id,
                    profileImageUrl: profile.photos[0]?.value,
                    updatedAt: new Date(),
                  },
                },
              );
              user.googleId = profile.id;
              return done(null, user);
            }

            // Create new user from Google profile
            const newUser = {
              googleId: profile.id,
              email: profile.emails[0].value,
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              profileImageUrl: profile.photos[0]?.value,
              role: "attendee", // Default role
              emailVerified: true, // Google emails are pre-verified
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const result = await this.users.insertOne(newUser);
            newUser._id = result.insertedId;

            // Send welcome email
            await emailService.sendRegistrationConfirmation(newUser);

            return done(null, newUser);
          } catch (error) {
            return done(error, null);
          }
        },
      ),
    );
    } else {
      console.log('[Enhanced Auth] Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    }

    passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await this.users.findOne({ _id: new ObjectId(id) });
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  generateTokens(userId, role) {
    const accessToken = jwt.sign({ userId, role, type: "access" }, JWT_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(
      { userId, role, type: "refresh" },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== "access") {
        throw new Error("Invalid token type");
      }
      return decoded;
    } catch (error) {
      throw new Error("Invalid access token");
    }
  }

  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }
      return decoded;
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  async storeRefreshToken(userId, refreshToken) {
    await this.refreshTokens.insertOne({
      userId: new ObjectId(userId),
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
  }

  async revokeRefreshToken(refreshToken) {
    await this.refreshTokens.deleteOne({ token: refreshToken });
  }

  async revokeAllUserTokens(userId) {
    await this.refreshTokens.deleteMany({ userId: new ObjectId(userId) });
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
        confirmPassword,
        acceptTerms,
      } = userData;

      // Validation
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (!acceptTerms) {
        throw new Error("You must accept the terms and conditions");
      }

      // Check if user exists
      const existingUser = await this.users.findOne({ email });
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user object
      const user = {
        role,
        firstName,
        lastName,
        email,
        currency,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        phone,
        organizationName: role === "organizer" ? organizationName : null,
        instagramHandle,
        password: hashedPassword,
        acceptTerms,
        emailVerified: false,
        phoneVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert user
      const result = await this.users.insertOne(user);
      user._id = result.insertedId;

      // Generate OTP for email verification
      const emailOTP = otpService.generateOTP();
      otpService.storeOTP(email, emailOTP, "email_verification");
      
      // Send registration confirmation email (optional - don't break registration if email fails)
      try {
        await sendRegistrationConfirmationEmail(user, emailOTP);
      } catch (emailError) {
        console.log('Registration confirmation email failed:', emailError.message);
        // Continue with registration even if email fails
      }

      // Generate OTP for phone verification if phone provided
      if (phone) {
        const phoneOTP = otpService.generateOTP();
        otpService.storeOTP(phone, phoneOTP, "phone_verification");
        // SMS functionality is optional for now
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(
        user._id,
        user.role,
      );
      await this.storeRefreshToken(user._id, refreshToken);

      // Remove password from response
      delete user.password;

      return {
        message:
          "User registered successfully. Please verify your email and phone.",
        user,
        accessToken,
        refreshToken,
        requiresVerification: {
          email: true,
          phone: !!phone,
        },
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async login(credentials) {
    try {
      const { role, email, password } = credentials;

      // Find user
      const user = await this.users.findOne({ email });
      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Check role
      if (user.role !== role) {
        throw new Error("Invalid role selected");
      }

      // Check password (skip for Google users)
      if (user.password) {
        const isValidPassword = await this.comparePassword(
          password,
          user.password,
        );
        if (!isValidPassword) {
          throw new Error("Invalid email or password");
        }
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(
        user._id,
        user.role,
      );
      await this.storeRefreshToken(user._id, refreshToken);

      // Send login notification (optional - don't break login if email fails)
      try {
        await sendLoginNotificationEmail(user);
      } catch (emailError) {
        console.log('Login notification email failed:', emailError.message);
        // Continue with login even if email fails
      }

      // Remove password from response
      delete user.password;

      return {
        message: "Login successful",
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);

      // Check if token exists in database
      const tokenDoc = await this.refreshTokens.findOne({
        token: refreshToken,
        userId: new ObjectId(decoded.userId),
      });

      if (!tokenDoc) {
        throw new Error("Refresh token not found");
      }

      // Check if token is expired
      if (new Date() > tokenDoc.expiresAt) {
        await this.revokeRefreshToken(refreshToken);
        throw new Error("Refresh token expired");
      }

      // Generate new access token
      const { accessToken: newAccessToken } = this.generateTokens(
        decoded.userId,
        decoded.role,
      );

      return {
        accessToken: newAccessToken,
        message: "Access token refreshed successfully",
      };
    } catch (error) {
      throw new Error("Unable to refresh token: " + error.message);
    }
  }

  async verifyOTP(identifier, otp, type) {
    try {
      const result = otpService.verifyOTP(identifier, otp, type);

      if (result.success) {
        // Update verification status in user record
        if (type === "email_verification") {
          await this.users.updateOne(
            { email: identifier },
            { $set: { emailVerified: true, updatedAt: new Date() } },
          );
        } else if (type === "phone_verification") {
          await this.users.updateOne(
            { phone: identifier },
            { $set: { phoneVerified: true, updatedAt: new Date() } },
          );
        }
      }

      return result;
    } catch (error) {
      throw new Error("OTP verification failed: " + error.message);
    }
  }

  async resendOTP(identifier, type) {
    try {
      const otp = otpService.generateOTP();
      otpService.storeOTP(identifier, otp, type);

      if (type === "email_verification") {
        const user = await this.users.findOne({ email: identifier });
        if (user) {
          // OTP functionality is optional for now
          console.log(`OTP for ${identifier}: ${otp}`);
        }
      } else if (type === "phone_verification") {
        // SMS functionality is optional for now
        console.log(`Phone OTP for ${identifier}: ${otp}`);
      }

      return { message: "OTP sent successfully" };
    } catch (error) {
      throw new Error("Failed to resend OTP: " + error.message);
    }
  }

  async requestPasswordReset(email) {
    try {
      const user = await this.users.findOne({ email });
      if (!user) {
        // Don't reveal if email exists
        return { message: "If the email exists, a reset link has been sent" };
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user._id, type: "password_reset" },
        JWT_SECRET,
        { expiresIn: "1h" },
      );

      // Store reset token
      await this.passwordResets.insertOne({
        userId: user._id,
        token: resetToken,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      // Send reset email
      await emailService.sendPasswordResetEmail(user, resetToken);

      return { message: "Password reset link sent to your email" };
    } catch (error) {
      throw new Error("Failed to process password reset request");
    }
  }

  async resetPassword(token, newPassword) {
    try {
      // Verify reset token
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== "password_reset") {
        throw new Error("Invalid reset token");
      }

      // Check if token exists and is not expired
      const resetDoc = await this.passwordResets.findOne({
        token,
        userId: new ObjectId(decoded.userId),
      });

      if (!resetDoc) {
        throw new Error("Reset token not found");
      }

      if (new Date() > resetDoc.expiresAt) {
        await this.passwordResets.deleteOne({ token });
        throw new Error("Reset token expired");
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update user password
      await this.users.updateOne(
        { _id: new ObjectId(decoded.userId) },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        },
      );

      // Remove used reset token
      await this.passwordResets.deleteOne({ token });

      // Revoke all refresh tokens for security
      await this.revokeAllUserTokens(decoded.userId);

      // Send confirmation email
      const user = await this.users.findOne({
        _id: new ObjectId(decoded.userId),
      });
      // Account activity alert functionality is optional for now
      console.log(`Password reset successfully for user: ${user.email}`);

      return { message: "Password reset successfully" };
    } catch (error) {
      throw new Error("Failed to reset password: " + error.message);
    }
  }

  async getUserById(userId) {
    const user = await this.users.findOne({ _id: new ObjectId(userId) });
    if (user) {
      delete user.password;
    }
    return user;
  }

  async updateUser(userId, updateData) {
    try {
      const updates = { ...updateData, updatedAt: new Date() };

      // If updating phone number, send notification to old number
      if (updateData.phone) {
        const currentUser = await this.users.findOne({
          _id: new ObjectId(userId),
        });
        if (currentUser.phone && currentUser.phone !== updateData.phone) {
          await smsService.sendPhoneChangeNotification(
            currentUser.phone,
            currentUser.firstName,
          );
        }
        updates.phoneVerified = false; // Require re-verification
      }

      await this.users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updates },
      );

      const updatedUser = await this.getUserById(userId);
      // Account activity alert functionality is optional for now
      console.log(`Profile updated for user: ${updatedUser.email}`);

      return updatedUser;
    } catch (error) {
      throw new Error("Failed to update user: " + error.message);
    }
  }

  async logout(refreshToken) {
    try {
      await this.revokeRefreshToken(refreshToken);
      return { message: "Logged out successfully" };
    } catch (error) {
      throw new Error("Logout failed: " + error.message);
    }
  }
}

// Registration confirmation email function
async function sendRegistrationConfirmationEmail(user, emailOTP) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 587,
      secure: false,
      auth: {
        user: '122e79cfec2d29',
        pass: '9324e83d713de6'
      }
    });

    const mailOptions = {
      from: '"Event Tribe" <noreply@eventtribe.com>',
      to: user.email,
      subject: '🎉 Welcome to Event Tribe - Account Created',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">EVENT TRIBE</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px;">🎉 Welcome to Event Tribe!</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #10b981; margin: 0 0 20px 0; font-size: 24px;">Hi ${user.firstName || user.email}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Thank you for joining Event Tribe! Your account has been successfully created.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #10b981; margin: 0 0 15px 0;">Account Details:</h3>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
              <p style="margin: 5px 0;"><strong>Role:</strong> ${user.role}</p>
              <p style="margin: 5px 0;"><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #047857; margin: 0 0 15px 0;">Next Steps:</h3>
              <ul style="color: #047857; margin: 10px 0; padding-left: 20px;">
                <li>Log in to your account</li>
                <li>Complete your profile setup</li>
                <li>Explore upcoming events</li>
                <li>Start creating or booking events</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/login" 
                 style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Start Exploring
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Welcome to Event Tribe! <br>
              Your journey to amazing events starts here.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[${new Date().toLocaleTimeString()}] Registration confirmation email sent to: ${user.email}`);
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error sending registration confirmation email:`, error);
    throw error;
  }
}

export const enhancedAuthService = new EnhancedAuthService();
