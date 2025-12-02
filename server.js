const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.url, new Date().toISOString());
  next();
});

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

  const num = Number(q);
  const isNum = !isNaN(num);

  const filter = {
    $or: [
      { topic: regex },
      { location: regex },
      isNum ? { price: num } : {},
      isNum ? { space: num } : {}
    ]
  };

  db.collection("lessons")
    .find(filter)
    .toArray()
    .then(results => res.json(results))
    .catch(err => res.status(500).json({ error: err }));
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
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});


app.put("/lesson/:id", async (req, res) => {
  try {
    const id = req.params.id.trim();
    const newSpace = req.body.space;

    const result = await db.collection("lessons").updateOne(
      { _id: new ObjectId(id) },
      { $set: { space: newSpace } }
    );

    res.json({ status: "space updated", result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Invalid ID or database error" });
  }
});


app.listen(3000, () => {
  console.log("Server running on port 3000");
});
