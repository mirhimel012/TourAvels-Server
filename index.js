// server.js (patched)
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'https://touravels.vercel.app',
  'https://touravels.netlify.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    const msg = `❌ CORS blocked for origin: ${origin}`;
    console.error(msg);
    return callback(new Error(msg), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Mongo URI: don't print full password to logs, just sanity-check values
const DB_USER = process.env.DB_USER || '';
const DB_PASS = process.env.DB_PASS || '';
const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@cluster0.0coytx6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Diagnostic log (safe): show user and mask password length
console.log('Mongo URI user:', DB_USER);
console.log('Mongo password length:', DB_PASS ? DB_PASS.length : 0);

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let touristsSpotCollection = null;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('touristsSpotDB');
    touristsSpotCollection = db.collection('touristsSpot');
    // Optionally verify a lightweight command
    await client.db('admin').command({ ping: 1 });
    console.log('✅ MongoDB connected and ping succeeded');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error && (error.stack || error.message || error));
    // Rethrow so caller can decide to abort startup
    throw error;
  }
}

// Health route
app.get('/health', async (req, res) => {
  try {
    if (!touristsSpotCollection) {
      await connectDB(); // try to connect if not yet connected
    }
    await client.db('admin').command({ ping: 1 });
    res.json({ ok: true, message: '✅ Server & DB connected' });
  } catch (err) {
    console.error('❌ Health check failed:', err && (err.stack || err.message || err));
    res.status(500).json({ ok: false, message: 'DB not connected', error: String(err.message || err) });
  }
});

app.get('/', (req, res) => {
  res.send('TourAvels server is running ✅');
});

app.get('/touristsSpot', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error('DB not connected');
    const result = await touristsSpotCollection.find().toArray();
    res.send(Array.isArray(result) ? result : []);
  } catch (err) {
    console.error('❌ GET /touristsSpot error:', err && (err.stack || err.message || err));
    res.status(500).send({ message: 'Server error', error: String(err.message || err) });
  }
});

app.get('/touristsSpot/:id', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error('DB not connected');
    const id = req.params.id;
    const result = await touristsSpotCollection.findOne({ _id: new ObjectId(id) });
    res.send(result || {});
  } catch (err) {
    console.error('❌ GET /touristsSpot/:id error:', err && (err.stack || err.message || err));
    res.status(500).send({});
  }
});

app.post('/touristsSpot', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error('DB not connected');
    const newSpot = req.body;
    const result = await touristsSpotCollection.insertOne(newSpot);
    res.send(result);
  } catch (err) {
    console.error('❌ POST /touristsSpot error:', err && (err.stack || err.message || err));
    res.status(500).send({ message: 'Error adding spot', error: String(err.message || err) });
  }
});

app.put('/touristsSpot/:id', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error('DB not connected');
    const id = req.params.id;
    const updatedSpot = req.body;
    const result = await touristsSpotCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedSpot }
    );
    res.send(result);
  } catch (err) {
    console.error('❌ PUT /touristsSpot/:id error:', err && (err.stack || err.message || err));
    res.status(500).send({ message: 'Error updating spot', error: String(err.message || err) });
  }
});

app.delete('/touristsSpot/:id', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error('DB not connected');
    const id = req.params.id;
    const result = await touristsSpotCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    console.error('❌ DELETE /touristsSpot/:id error:', err && (err.stack || err.message || err));
    res.status(500).send({ message: 'Error deleting spot', error: String(err.message || err) });
  }
});

// Connect DB first, then start server (fail fast if DB cannot connect)
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`✅ TourAvels Server is running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('❌ Server startup aborted due to DB connection error:', err && (err.stack || err.message || err));
    // Exit process so Vercel/host knows deployment is bad (you can remove in production if you prefer)
    process.exit(1);
  });
