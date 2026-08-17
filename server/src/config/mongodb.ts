import { MongoClient, Db } from 'mongodb';
import { seedDatabase } from './seed.js';

let client: MongoClient;
let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) {
    return db;
  }

  const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.DB_NAME || 'student_management';

  try {
    client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db(dbName);

    // Verify connection
    await db.admin().ping();
    console.log('✓ Connected to MongoDB');

    // Create collections if they don't exist
    await createCollections(db);

    // Seed initial data if empty
    await seedDatabase(db);

    return db;
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error);
    throw error;
  }
}

export async function createCollections(db: Db) {
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  // Create users collection
  if (!collectionNames.includes('users')) {
    await db.createCollection('users');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('✓ Created users collection');
  }

  // Create students collection
  if (!collectionNames.includes('students')) {
    await db.createCollection('students');
    await db.collection('students').createIndex({ email: 1 }, { unique: true });
    await db.collection('students').createIndex({ user_id: 1 });
    console.log('✓ Created students collection');
  }

  // Create courses collection
  if (!collectionNames.includes('courses')) {
    await db.createCollection('courses');
    await db.collection('courses').createIndex({ code: 1 }, { unique: true });
    await db.collection('courses').createIndex({ user_id: 1 });
    console.log('✓ Created courses collection');
  }

  // Create enrollments collection
  if (!collectionNames.includes('enrollments')) {
    await db.createCollection('enrollments');
    await db
      .collection('enrollments')
      .createIndex({ student_id: 1, course_id: 1 }, { unique: true });
    await db.collection('enrollments').createIndex({ user_id: 1 });
    console.log('✓ Created enrollments collection');
  }

  // Create attendance collection
  if (!collectionNames.includes('attendance')) {
    await db.createCollection('attendance');
    await db
      .collection('attendance')
      .createIndex({ student_id: 1, course_id: 1, date: 1 }, { unique: true });
    await db.collection('attendance').createIndex({ user_id: 1 });
    console.log('✓ Created attendance collection');
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

export async function disconnectDB(): Promise<void> {
  if (client) {
    await client.close();
    console.log('✓ Disconnected from MongoDB');
  }
}
