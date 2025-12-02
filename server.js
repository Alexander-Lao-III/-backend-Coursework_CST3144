const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.originalUrl, new Date().toISOString());
  next();
});

const uri = "mongodb+srv://cluster0.dhionr6.mongodb.net"; // keep your actual connection string
const client = new MongoClient(uri);
let lessonsCollection, ordersCollection;

async function connectDB() {
  await client.connect();
  const db = client.db("webstore");
  lessonsCollection = db.collection("lessons");
  ordersCollection = db.collection("orders");
  console.log("MongoDB connected");
}
connectDB();

app.get('/lessons', async (req, res) => {
  const lessons = await lessonsCollection.find().toArray();
  res.json(lessons);
});

app.put('/lesson/:id', async (req, res) => {
  const id = req.params.id;
  const { space } = req.body;

  try {
    const result = await lessonsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { space: space } }
    );

    res.json({ status: "space updated", result });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.get('/search', async (req, res) => {
  const q = req.query.q;
  try {
    const results = await lessonsCollection.find({
      $or: [
        { topic: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } }
      ]
    }).toArray();

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.post('/order', async (req, res) => {
  const { name, phone, lessons } = req.body;

  if (!name || !phone || !lessons || lessons.length === 0) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const order = {
      name,
      phone,
      lessons,
      createdAt: new Date()
    };

    const result = await ordersCollection.insertOne(order);

    res.json({ status: "order saved", id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
