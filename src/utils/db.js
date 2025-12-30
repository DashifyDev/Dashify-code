import mongoose from 'mongoose';

// Global cached connection promise to prevent multiple simultaneous connections
let cachedConnection = null;

// Connection state tracking
let isConnecting = false;

/**
 * Singleton MongoDB connection handler
 * Ensures only ONE connection per process with proper pool limits for MongoDB Atlas M0
 *
 * Features:
 * - Prevents multiple connection attempts
 * - Handles hot reload in dev mode
 * - Configures conservative pool limits (maxPoolSize: 5 for M0 cluster)
 * - Reuses existing connection if already connected
 * - Lazy initialization - connects only when needed
 */
const connectMongo = async () => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, wait for the existing promise
  if (isConnecting && cachedConnection) {
    return cachedConnection;
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    // Wait a bit and retry
    await new Promise(resolve => setTimeout(resolve, 100));
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    if (cachedConnection) {
      return cachedConnection;
    }
  }

  // Create new connection promise
  isConnecting = true;
  cachedConnection = mongoose
    .connect(process.env.MONGO_URI, {
      maxPoolSize: 5, // Conservative limit for MongoDB Atlas M0
      minPoolSize: 0, // Allow connections to drop to zero after inactivity
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000 // Close sockets after 45s of inactivity
    })
    .then(conn => {
      isConnecting = false;
      return conn;
    })
    .catch(error => {
      isConnecting = false;
      cachedConnection = null;
      throw error;
    });

  return cachedConnection;
};

// Handle connection events for better debugging
if (typeof window === 'undefined') {
  // Server-side only
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
  });

  mongoose.connection.on('error', err => {
    console.error('❌ MongoDB connection error:', err);
    cachedConnection = null;
    isConnecting = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
    cachedConnection = null;
    isConnecting = false;
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
}

// Initialize connection on module import (for server-side)
// This ensures connection is ready before any queries run
// Mongoose maintains a global connection state, so this is safe for Next.js serverless
if (typeof window === 'undefined' && process.env.MONGO_URI) {
  // Only initialize if not already connected or connecting
  if (mongoose.connection.readyState === 0 && !isConnecting) {
    // Start connection in background (non-blocking)
    connectMongo().catch(err => {
      console.error('Failed to initialize MongoDB connection:', err);
    });
  }
}

export default connectMongo;
