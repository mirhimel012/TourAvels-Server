// --- Dependencies ---
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// --- App setup ---
const app = express();
const port = process.env.PORT || 5000;

// --- CORS Middleware ---
const allowedOrigins = [
  'http://localhost:5173',
  'https://touravels.vercel.app',
  'https://touravels.netlify.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow tools like Postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    const msg = `❌ CORS blocked for origin: ${origin}`;
    console.error(msg);
    return callback(new Error(msg), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// --- Handle preflight OPTIONS requests for all routes ---
app.options('*', cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// --- MongoDB Connection ---
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0coytx6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let touristsSpotCollection;

// --- Connect once ---
async function connectDB() {
  if (!touristsSpotCollection) {
    try {
      await client.connect();
      const db = client.db('touristsSpotDB');
      touristsSpotCollection = db.collection('touristsSpot');
      console.log("✅ MongoDB connected successfully");
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error.stack || error);
    }
  }
}
connectDB().catch(err => console.error("connectDB error:", err));

// --- Health route to test connection easily ---
app.get('/health', async (req, res) => {
  try {
    if (!touristsSpotCollection) await connectDB();
    await client.db('admin').command({ ping: 1 });
    res.json({ ok: true, message: '✅ Server & DB connected' });
  } catch (err) {
    console.error("❌ Health check failed:", err.stack || err);
    res.status(500).json({ ok: false, message: 'DB not connected', error: String(err.message || err) });
  }
});

// --- Root route ---
app.get('/', (req, res) => {
  res.send('TourAvels server is running ✅');
});

// --- GET all spots ---
app.get('/touristsSpot', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error("DB not connected");
    const result = await touristsSpotCollection.find().toArray();
    res.send(Array.isArray(result) ? result : []);
  } catch (err) {
    console.error("❌ GET /touristsSpot error:", err.stack || err);
    res.status(500).send({ message: "Server error", error: String(err.message || err) });
  }
});

// --- GET single spot ---
app.get('/touristsSpot/:id', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error("DB not connected");
    const id = req.params.id;
    const result = await touristsSpotCollection.findOne({ _id: new ObjectId(id) });
    res.send(result || {});
  } catch (err) {
    console.error("❌ GET /touristsSpot/:id error:", err.stack || err);
    res.status(500).send({});
  }
});

// --- POST new spot ---
app.post('/touristsSpot', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error("DB not connected");
    const newSpot = req.body;
    const result = await touristsSpotCollection.insertOne(newSpot);
    res.send(result);
  } catch (err) {
    console.error("❌ POST /touristsSpot error:", err.stack || err);
    res.status(500).send({ message: "Error adding spot", error: String(err.message || err) });
  }
});

// --- PUT update spot ---
app.put('/touristsSpot/:id', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error("DB not connected");
    const id = req.params.id;
    const updatedSpot = req.body;
    const result = await touristsSpotCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedSpot }
    );
    res.send(result);
  } catch (err) {
    console.error("❌ PUT /touristsSpot/:id error:", err.stack || err);
    res.status(500).send({ message: "Error updating spot", error: String(err.message || err) });
  }
});

// --- DELETE spot ---
app.delete('/touristsSpot/:id', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error("DB not connected");
    const id = req.params.id;
    const result = await touristsSpotCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    console.error("❌ DELETE /touristsSpot/:id error:", err.stack || err);
    res.status(500).send({ message: "Error deleting spot", error: String(err.message || err) });
  }
});

// --- Start the server ---
app.listen(port, () => {
  console.log(`✅ TourAvels Server is running on port ${port}`);
});
