const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
app.use(cors());  
app.use(express.json());

// static images
app.use("/images", express.static("images"));

// request log
app.use((req, res, next) => {
  console.log(req.method, req.url, new Date().toISOString());
  next();
});

// db setup
const url = "mongodb+srv://alexander:AlexLaoAlex824@cluster0.dhionr6.mongodb.net/";
const client = new MongoClient(url);

async function start() {
  await client.connect();
  console.log("MongoDB connected");

  const db = client.db("webstore");

  // get all lessons
  app.get("/lessons", async (req, res) => {
    try {
      const lessons = await db.collection("lessons").find({}).toArray();
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // search lessons
  app.get("/search", async (req, res) => {
    const q = req.query.q || "";
    const regex = new RegExp(q, "i");

    const numberQ = Number(q);
    const isNumber = !isNaN(numberQ);

    // build filter
    const filter = { $or: [
      { topic: regex },
      { location: regex }
    ]};

    if (isNumber) {
      filter.$or.push({ price: numberQ });
      filter.$or.push({ space: numberQ });
    }

    try {
      const results = await db.collection("lessons").find(filter).toArray();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // save order
  app.post("/order", async (req, res) => {
    const { name, phone, lessons } = req.body;

    // name check
    if (!name || !/^[A-Za-z ]+$/.test(name)) {
      return res.status(400).json({ error: "Name must contain letters only" });
    }

    // phone check
    if (!phone || !/^[0-9]+$/.test(phone)) {
      return res.status(400).json({ error: "Phone must contain numbers only" });
    }

    // lessons check
    if (!Array.isArray(lessons) || lessons.length === 0) {
      return res.status(400).json({ error: "Order must include at least one lesson" });
    }

    try {
      await db.collection("orders").insertOne({ name, phone, lessons });
      res.json({ status: "order saved" });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // update lesson space
  app.put("/lesson/:id", async (req, res) => {
    const id = req.params.id;
    const { space } = req.body;

    try {
      const result = await db.collection("lessons").updateOne(
        { _id: new ObjectId(id) },
        { $set: { space } }
      );

      res.json({ status: "space updated", result });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // server start
  app.listen(3000, () => {
    console.log("Server running on port 3000");
  });
}

start();
