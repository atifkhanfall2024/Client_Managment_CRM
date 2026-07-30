import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  uri: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
  uri: null,
};

global.mongooseCache = cached;

function getMongoUri() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Add it to .env.local and restart npm run dev."
    );
  }
  return uri;
}

export async function connectMongo() {
  const uri = getMongoUri();

  // If URI changed (e.g. switched from local to Atlas), drop old cache
  if (cached.uri && cached.uri !== uri) {
    cached.conn = null;
    cached.promise = null;
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.uri = uri;
    cached.promise = mongoose
      .connect(uri, { bufferCommands: false })
      .then((m) => m)
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
