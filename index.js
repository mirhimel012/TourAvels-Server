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

// ✅ Connect once when the function is initialized
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

// ✅ Routes
app.get('/', (req, res) => {
  res.send('TourAvels server is running');
});

app.get('/touristsSpot', async (req, res) => {
  try {
    const result = await touristsSpotCollection.find().toArray();
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error fetching spots" });
  }
});

app.get('/touristsSpot/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await touristsSpotCollection.findOne(query);
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error fetching spot" });
  }
});

app.post('/touristsSpot', async (req, res) => {
  try {
    const newSpot = req.body;
    const result = await touristsSpotCollection.insertOne(newSpot);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Error adding spot" });
  }
});

app.put('/touristsSpot/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updatedSpot = req.body;
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: updatedSpot
    };
    const result = await touristsSpotCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Error updating spot" });
  }
});

app.delete('/touristsSpot/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await touristsSpotCollection.deleteOne(query);
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Error deleting spot" });
  }
});

app.listen(port, () => {
  console.log(`✅ TourAvels Server is running on port ${port}`);
});
