import { MongoClient } from 'mongodb';
import { initialSeedData } from '../src/data/seedData.js';

// Support any environment variable name created by Vercel MongoDB Atlas integration
const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.STORAGE_URL ||
  process.env.STORAGE_MONGODB_URI ||
  process.env.MONGODB_URL ||
  process.env.DATABASE_URL;

const DB_NAME = process.env.MONGODB_DB || 'bookly_ota_db';
const COLLECTION_NAME = 'portal_state';
const STATE_DOC_ID = 'bookly_main_state_v1';

let cachedClient = null;
let cachedDb = null;

async function getDatabase() {
  if (!MONGO_URI) {
    throw new Error(
      'MongoDB connection string not found in environment variables (expected MONGODB_URI or STORAGE_URL).'
    );
  }
  if (cachedClient && cachedDb) {
    return cachedDb;
  }
  const client = new MongoClient(MONGO_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 8000
  });
  await client.connect();
  const db = client.db(DB_NAME);
  cachedClient = client;
  cachedDb = db;
  return db;
}

async function loadOrInitState(collection) {
  let doc = await collection.findOne({ _id: STATE_DOC_ID });
  if (!doc) {
    const fresh = {
      _id: STATE_DOC_ID,
      airports: initialSeedData.airports || [],
      airlines: initialSeedData.airlines || [],
      suppliers: initialSeedData.suppliers || [],
      segments: [],
      flights: [],
      subAgents: [],
      bookings: [],
      updatedAt: new Date().toISOString()
    };
    await collection.insertOne(fresh);
    doc = fresh;
  }
  return doc;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);

    if (req.method === 'GET') {
      const state = await loadOrInitState(collection);
      return res.status(200).json({
        ok: true,
        state: {
          airports: initialSeedData.airports,
          airlines: state.airlines || initialSeedData.airlines || [],
          suppliers: state.suppliers || initialSeedData.suppliers || [],
          segments: state.segments || [],
          flights: state.flights || [],
          subAgents: state.subAgents || [],
          bookings: state.bookings || [],
          updatedAt: state.updatedAt
        }
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const current = await loadOrInitState(collection);

      const nextState = {
        airports: initialSeedData.airports,
        airlines: Array.isArray(body.airlines) ? body.airlines : current.airlines || initialSeedData.airlines,
        suppliers: Array.isArray(body.suppliers) ? body.suppliers : current.suppliers || initialSeedData.suppliers,
        segments: Array.isArray(body.segments) ? body.segments : current.segments || [],
        flights: Array.isArray(body.flights) ? body.flights : current.flights || [],
        subAgents: Array.isArray(body.subAgents) ? body.subAgents : current.subAgents || [],
        bookings: Array.isArray(body.bookings) ? body.bookings : current.bookings || [],
        updatedAt: new Date().toISOString()
      };

      await collection.updateOne(
        { _id: STATE_DOC_ID },
        { $set: nextState },
        { upsert: true }
      );

      return res.status(200).json({
        ok: true,
        state: nextState
      });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('MongoDB API Error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Database connection error'
    });
  }
}
