
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/eventTribe";

async function createSuperAdmin() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    const db = client.db("express_react_app");
    const users = db.collection("auth_users");
    
    // Check if super admin already exists
    const existingAdmin = await users.findOne({ role: 'super_admin' });
    if (existingAdmin) {
      console.log('Super admin already exists:', existingAdmin.email);
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create super admin user
    const superAdmin = {
      email: 'admin@eventtribe.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await users.insertOne(superAdmin);
    console.log('Super admin created successfully:', {
      id: result.insertedId,
      email: 'admin@eventtribe.com',
      password: 'admin123',
      role: 'super_admin'
    });
    
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await client.close();
  }
}

createSuperAdmin();
