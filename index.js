const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
app.use(express.json());
app.use(cors());
//db_user_001
//IIHNNxJNI5Ek5eM4
// https://stark-cliffs-55109.herokuapp.com
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7pr7e.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

//------------------verify JWT Start------------------------------//
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
//------------------verify JWT end------------------------------//

async function run() {
  try {
    await client.connect();

    const partsCollection = client
      .db("manufacturer-website")
      .collection("parts");
    const userCollection = client
      .db("manufacturer-website")
      .collection("users");

    //-------------------parts get api start---------------------//
    app.get("/parts", verifyJWT, async (req, res) => {
      const parts = await partsCollection.find().toArray();
      res.send(parts);
    });
    //-------------------parts get api end---------------------//
    //-------------------one parts get api start---------------------//
    app.get("/parts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const partsData = await partsCollection.findOne(query);
      res.send(partsData);
    });
    //-------------------one parts get api end---------------------//
    //-------------------user data add put api start---------------------//
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET);
      res.send({ result, token });
    });
    //-------------------user data add put api end---------------------//
    //-------------------admin data add put api start---------------------//
    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };

      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);

      res.send(result);
    });
    //-------------------admin data add put api end---------------------//
    //-------------------all users data get api start---------------------//
    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });
    //-------------------all users data get api end---------------------//
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
