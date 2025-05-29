import { connectToDatabase } from './dbService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId, Document } from 'mongodb';

// Secret key for JWT
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'your-secret-key-should-be-in-env-file';

// User interface
export interface User extends Document {
  name: string;
  email: string;
  password?: string;
  preferredLanguage?: string;
  googleId?: string;
  createdAt: Date;
}

// Register a new user
export async function registerUser(userData: Omit<User, '_id' | 'createdAt'>): Promise<{ user: Omit<User, 'password'>, token: string }> {
  const { db } = await connectToDatabase();
  const collection = db.collection('users');

  // Check if user already exists
  const existingUser = await collection.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password if it exists
  let hashedPassword;
  if (userData.password) {
    hashedPassword = await bcrypt.hash(userData.password, 10);
  }

  // Create new user
  const newUser: User = {
    name: userData.name,
    email: userData.email,
    password: hashedPassword,
    preferredLanguage: userData.preferredLanguage || 'en',
    googleId: userData.googleId,
    createdAt: new Date()
  };

  // Insert user into database
  const result = await collection.insertOne(newUser);
  
  // Create JWT token
  const token = jwt.sign(
    { id: result.insertedId, email: userData.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Return user without password and token
  const { password, ...userWithoutPassword } = newUser;
  return { user: userWithoutPassword, token };
}

// Login user
export async function loginUser(email: string, password: string): Promise<{ user: Omit<User, 'password'>, token: string }> {
  const { db } = await connectToDatabase();
  const collection = db.collection('users');

  // Find user
  const user = await collection.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  if (user.password) {
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
  } else {
    throw new Error('This account requires Google login');
  }

  // Create JWT token
  const token = jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Return user without password and token
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}

// Google login/signup
export async function googleAuth(googleData: { name: string, email: string, googleId: string }): Promise<{ user: Omit<User, 'password'>, token: string }> {
  const { db } = await connectToDatabase();
  const collection = db.collection('users');

  // Check if user exists
  const existingUser = await collection.findOne({ email: googleData.email });

  if (existingUser) {
    // Update Google ID if needed
    if (!existingUser.googleId) {
      await collection.updateOne(
        { _id: existingUser._id },
        { $set: { googleId: googleData.googleId } }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { id: existingUser._id, email: existingUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password and token
    const { password, ...userWithoutPassword } = existingUser;
    return { user: userWithoutPassword, token };
  } else {
    // Register new user with Google data
    return registerUser({
      name: googleData.name,
      email: googleData.email,
      googleId: googleData.googleId
    });
  }
}

// Verify JWT token
export function verifyToken(token: string): { id: string, email: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as { id: string, email: string };
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
  const { db } = await connectToDatabase();
  const collection = db.collection('users');

  try {
    // Convert string ID to ObjectId
    const objectId = new ObjectId(userId);
    const user = await collection.findOne({ _id: objectId });
    if (!user) return null;

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<User, 'password'>;
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
}

// Update user's preferred language
export async function updateUserLanguage(userId: string, language: string): Promise<Omit<User, 'password'>> {
  const { db } = await connectToDatabase();
  const collection = db.collection('users');

  try {
    // Convert string ID to ObjectId
    const objectId = new ObjectId(userId);
    
    await collection.updateOne(
      { _id: objectId },
      { $set: { preferredLanguage: language } }
    );

    const updatedUser = await collection.findOne({ _id: objectId });
    if (!updatedUser) {
      throw new Error('User not found');
    }

    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as Omit<User, 'password'>;
  } catch (error) {
    console.error('Error in updateUserLanguage:', error);
    throw new Error('Failed to update user language');
  }
}
