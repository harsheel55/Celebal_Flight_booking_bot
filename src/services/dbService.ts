import { MongoClient, Db } from 'mongodb';

const uri = import.meta.env.VITE_MONGODB_URI || 'mongodb+srv://harsheel:harsheel@auth.kfaj4.mongodb.net/';
const dbName = import.meta.env.VITE_MONGODB_DB || 'flightbot';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Create a new connection
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
