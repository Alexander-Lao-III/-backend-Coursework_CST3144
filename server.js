const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
app.use(express.json());

app.use("/images", express.static("images"));

let db;

MongoClient.connect(
  "mongodb+srv://alexander:AlexLaoAlex824@cluster0.dhionr6.mongodb.net/webstore?retryWrites=true&w=majority"
)
  .then(client => {
    db = client.db("webstore");
    console.log("MongoDB connected");
  })
  .catch(err => console.error(err));

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.get("/lessons", (req, res) => {
  db.collection("lessons")
    .find({})
    .toArray()
    .then(results => res.json(results))
    .catch(err => res.status(500).json({ error: err }));
});

app.get("/search", (req, res) => {
  const q = req.query.q || "";
  const regex = new RegExp(q, "i");

  db.collection("lessons")
    .find({
      $or: [
        { topic: regex },
        { location: regex },
        { price: isNaN(Number(q)) ? undefined : Number(q) },
        { space: isNaN(Number(q)) ? undefined : Number(q) }
      ]
    })
    .toArray()
    .then(results => res.json(results))
    .catch(err => res.status(500).json({ error: err }));
});

app.post("/order", (req, res) => {
  const order = req.body;

  db.collection("orders")
    .insertOne(order)
    .then(() => res.json({ status: "order saved" }))
    .catch(err => res.status(500).json({ error: err }));
});

app.put("/lesson/:id", (req, res) => {
  const id = req.params.id;
  const newSpace = req.body.space;

  db.collection("lessons")
    .updateOne(
      { _id: id },
      { $set: { space: newSpace } }
    )
    .then(() => res.json({ status: "space updated" }))
    .catch(err => res.status(500).json({ error: err }));
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
