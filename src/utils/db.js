import mongoose from "mongoose";
import dns from "dns";

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
 * - Configures aggressive pool limits (maxPoolSize: 2 for M0 cluster)
 * - Reuses existing connection if already connected
 * - Lazy initialization - connects only when needed
 * - Auto-closes idle connections after 20 seconds
 */
const connectMongo = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGODB_URI or MONGO_URI must be set in the environment");
  }

  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (typeof window === "undefined" && uri.startsWith("mongodb+srv://")) {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
    if (dns.setDefaultResultOrder) dns.setDefaultResultOrder("ipv4first");
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
    .connect(uri, {
      maxPoolSize: 2, // Aggressive limit for MongoDB Atlas M0 (reduced from 5)
      minPoolSize: 0, // Allow connections to drop to zero after inactivity
      maxIdleTimeMS: 20000, // Close idle connections after 20 seconds
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 20000, // Close sockets after 20s of inactivity (reduced from 45s)
      connectTimeoutMS: 10000, // Connection timeout
      heartbeatFrequencyMS: 10000, // Check connection health every 10 seconds
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
if (typeof window === "undefined") {
  // Server-side only
  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connected");
  });

  mongoose.connection.on("error", err => {
    console.error("❌ MongoDB connection error:", err);
    cachedConnection = null;
    isConnecting = false;
  });

  mongoose.connection.on("disconnected", () => {
    console.log("⚠️ MongoDB disconnected");
    cachedConnection = null;
    isConnecting = false;
  });

  // Handle process termination
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
}

// Initialize connection on module import (for server-side)
// This ensures connection is ready before any queries run
// Mongoose maintains a global connection state, so this is safe for Next.js serverless
if (typeof window === "undefined" && (process.env.MONGODB_URI || process.env.MONGO_URI)) {
  // Only initialize if not already connected or connecting
  if (mongoose.connection.readyState === 0 && !isConnecting) {
    // Start connection in background (non-blocking)
    connectMongo().catch(err => {
      console.error("Failed to initialize MongoDB connection:", err);
    });
  }
}

export default connectMongo;
