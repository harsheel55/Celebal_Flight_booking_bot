const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection string
const uri = 'mongodb+srv://harsheel:harsheel@auth.kfaj4.mongodb.net/';
const dbName = 'flightbot';

// JWT secret
const JWT_SECRET = 'your-secret-key-should-be-in-env-file';

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Connect to MongoDB
let db;
async function connectToMongoDB() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db(dbName);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// API Routes
// Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, preferredLanguage } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      name,
      email,
      password: hashedPassword,
      preferredLanguage: preferredLanguage || 'en',
      createdAt: new Date()
    };

    // Insert user into database
    const result = await db.collection('users').insertOne(newUser);
    
    // Create JWT token
    const token = jwt.sign(
      { id: result.insertedId, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password and token
    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Failed to register user' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    if (user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      return res.status(401).json({ message: 'This account requires Google login' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password and token
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Failed to login' });
  }
});

// Google login/signup
app.post('/api/auth/google', async (req, res) => {
  try {
    const { name, email, googleId } = req.body;

    // Validate input
    if (!name || !email || !googleId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });

    if (existingUser) {
      // Update Google ID if needed
      if (!existingUser.googleId) {
        await db.collection('users').updateOne(
          { _id: existingUser._id },
          { $set: { googleId } }
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
      return res.status(200).json({ user: userWithoutPassword, token });
    } else {
      // Register new user with Google data
      const newUser = {
        name,
        email,
        googleId,
        preferredLanguage: 'en',
        createdAt: new Date()
      };

      // Insert user into database
      const result = await db.collection('users').insertOne(newUser);
      
      // Create JWT token
      const token = jwt.sign(
        { id: result.insertedId, email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({ user: newUser, token });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ message: 'Failed to authenticate with Google' });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Find user
    const user = await db.collection('users').findOne({ _id: objectId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: 'Failed to get user' });
  }
});

// Update user's preferred language
app.put('/api/users/:id/language', async (req, res) => {
  try {
    const { id } = req.params;
    const { language } = req.body;
    
    if (!language) {
      return res.status(400).json({ message: 'Language is required' });
    }
    
    // Convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Update user language
    const result = await db.collection('users').updateOne(
      { _id: objectId },
      { $set: { preferredLanguage: language } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get updated user
    const updatedUser = await db.collection('users').findOne({ _id: objectId });
    
    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Update language error:', error);
    return res.status(500).json({ message: 'Failed to update language' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
async function startServer() {
  try {
    await connectToMongoDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
