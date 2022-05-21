const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
app.use(express.json());
app.use(cors());
//db_user_001
//IIHNNxJNI5Ek5eM4

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7pr7e.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    const partsCollection = client
      .db("manufacturer-website")
      .collection("parts");

    //-------------------parts get api start---------------------//
    app.get("/parts", async (req, res) => {
      const parts = await partsCollection.find().toArray();
      res.send(parts);
    });
    //-------------------parts get api end---------------------//
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("manufacturers");
});

app.listen(port, () => {
  console.log(`Example app listening on port manufacturers ${port}`);
});
