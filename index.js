const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://touravels.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0coytx6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let touristsSpotCollection;

// Connect once
async function connectDB() {
  if (!touristsSpotCollection) {
    try {
      await client.connect();
      const db = client.db('touristsSpotDB');
      touristsSpotCollection = db.collection('touristsSpot');
      console.log("✅ MongoDB connected successfully");
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error);
    }
  }
}
connectDB();

// Routes
app.get('/', (req, res) => {
  res.send('TourAvels server is running');
});

// GET all spots
app.get('/touristsSpot', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error("DB not connected");
    const result = await touristsSpotCollection.find().toArray();
    res.send(Array.isArray(result) ? result : []); // Always send an array
  } catch (err) {
    console.error(err);
    res.status(500).send([]); // fallback: empty array
  }
});

// GET single spot
app.get('/touristsSpot/:id', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error("DB not connected");
    const id = req.params.id;
    const result = await touristsSpotCollection.findOne({ _id: new ObjectId(id) });
    res.send(result || {}); // always send an object
  } catch (err) {
    console.error(err);
    res.status(500).send({});
  }
});

// POST new spot
app.post('/touristsSpot', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error("DB not connected");
    const newSpot = req.body;
    const result = await touristsSpotCollection.insertOne(newSpot);
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error adding spot" });
  }
});

// PUT update spot
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
    console.error(err);
    res.status(500).send({ message: "Error updating spot" });
  }
});

// DELETE spot
app.delete('/touristsSpot/:id', async (req, res) => {
  try {
    if (!touristsSpotCollection) throw new Error("DB not connected");
    const id = req.params.id;
    const result = await touristsSpotCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error deleting spot" });
  }
});

app.listen(port, () => {
  console.log(`✅ TourAvels Server is running on port ${port}`);
});
