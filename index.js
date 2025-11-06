// server.js (updated)
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

// Mongo URI
const DB_USER = process.env.DB_USER || '';
const DB_PASS = process.env.DB_PASS || '';
const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@cluster0.0coytx6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
let tourPlansCollection = null;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('touristsSpotDB');
    touristsSpotCollection = db.collection('touristsSpot');
    tourPlansCollection = db.collection('tourPlans');
    await client.db('admin').command({ ping: 1 });
    console.log('✅ MongoDB connected and ping succeeded');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Health route
app.get('/health', async (req, res) => {
  try {
    if (!touristsSpotCollection) {
      await connectDB();
    }
    await client.db('admin').command({ ping: 1 });
    res.json({ ok: true, message: '✅ Server & DB connected' });
  } catch (err) {
    console.error('❌ Health check failed:', err);
    res.status(500).json({ ok: false, message: 'DB not connected', error: String(err.message || err) });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('TourAvels server is running ✅');
});

// ====================
// TOURISTS SPOT ROUTES
// ====================

app.get('/touristsSpot', async (req, res) => {
  try {
    const result = await touristsSpotCollection.find().toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: 'Error fetching spots', error: err.message });
  }
});

app.get('/touristsSpot/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await touristsSpotCollection.findOne({ _id: new ObjectId(id) });
    res.send(result || {});
  } catch (err) {
    res.status(500).send({ message: 'Error fetching spot', error: err.message });
  }
});

app.post('/touristsSpot', async (req, res) => {
  try {
    const newSpot = req.body;
    const result = await touristsSpotCollection.insertOne(newSpot);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: 'Error adding spot', error: err.message });
  }
});

app.put('/touristsSpot/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedSpot = req.body;
    const result = await touristsSpotCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedSpot }
    );
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: 'Error updating spot', error: err.message });
  }
});

app.delete('/touristsSpot/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await touristsSpotCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: 'Error deleting spot', error: err.message });
  }
});

// ==================
// TOUR PLANS ROUTES 
// ==================

// Get all plans (or by user email)
app.get('/tourPlans', async (req, res) => {
  try {
    const email = req.query.email;
    const query = email ? { userEmail: email } : {};
    const result = await tourPlansCollection.find(query).toArray();
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: 'Error fetching plans', error: err.message });
  }
});

// Get one plan by ID
app.get('/tourPlans/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await tourPlansCollection.findOne({ _id: new ObjectId(id) });
    res.send(result || {});
  } catch (err) {
    res.status(500).send({ message: 'Error fetching plan', error: err.message });
  }
});

// Add a new tour plan
app.post('/tourPlans', async (req, res) => {
  try {
    const newPlan = req.body;
    const result = await tourPlansCollection.insertOne(newPlan);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: 'Error adding plan', error: err.message });
  }
});

// Update a tour plan
app.put('/tourPlans/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedPlan = req.body;
    const result = await tourPlansCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedPlan }
    );
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: 'Error updating plan', error: err.message });
  }
});

// Delete a tour plan
app.delete('/tourPlans/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await tourPlansCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: 'Error deleting plan', error: err.message });
  }
});

// ====================

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`✅ TourAvels Server is running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('❌ Server startup aborted:', err);
    process.exit(1);
  });
