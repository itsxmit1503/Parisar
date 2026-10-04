import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __MONGOOSE_CACHE__: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.__MONGOOSE_CACHE__ || {
  conn: null,
  promise: null,
};

if (!globalThis.__MONGOOSE_CACHE__) {
  globalThis.__MONGOOSE_CACHE__ = cached;
}

/**
 * Returns true if MONGODB_URI is configured and MongoDB connection is active.
 */
export function isMongoConfigured(): boolean {
  return Boolean(MONGODB_URI && MONGODB_URI.trim().length > 0);
}

/**
 * Connects to MongoDB Atlas using Mongoose with connection pooling and serverless caching.
 * Returns null gracefully if MONGODB_URI is not configured so local/CI environments remain operational.
 */
export async function connectDB(): Promise<typeof mongoose | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(m => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    console.warn('[PARISAR DB] MongoDB connection error, falling back to persistent store:', err);
    return null;
  }
}
