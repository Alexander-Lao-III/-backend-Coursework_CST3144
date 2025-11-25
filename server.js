const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());

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

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
