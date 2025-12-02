const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
app.use(express.json());

app.use("/images", express.static("images"));

app.use((req, res, next) => {
  console.log(req.method, req.url, new Date().toISOString());
  next();
});

const url = "mongodb+srv://alexander:AlexLaoAlex824@cluster0.dhionr6.mongodb.net/";
const client = new MongoClient(url);

async function start() {
  await client.connect();
  console.log("MongoDB connected");

  const db = client.db("webstore");

  app.get("/lessons", async (req, res) => {
    try {
      const lessons = await db.collection("lessons").find({}).toArray();
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/search", async (req, res) => {
    const q = req.query.q || "";
    const regex = new RegExp(q, "i");

    const numberQ = Number(q);
    const isNumber = !isNaN(numberQ);

    try {
      const results = await db.collection("lessons").find({
        $or: [
          { topic: regex },
          { location: regex },
          isNumber ? { price: numberQ } : {},
          isNumber ? { space: numberQ } : {}
        ]
      }).toArray();

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/order", async (req, res) => {
    const { name, phone, lessons } = req.body;

    if (!name || !/^[A-Za-z ]+$/.test(name)) {
      return res.status(400).json({ error: "Name must contain letters only" });
    }

    if (!phone || !/^[0-9]+$/.test(phone)) {
      return res.status(400).json({ error: "Phone must contain numbers only" });
    }

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

  app.listen(3000, () => {
    console.log("Server running on port 3000");
  });
}

start();
