const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// console.log(stripe);
app.use(express.json());
app.use(cors());
//db_user_001
//IIHNNxJNI5Ek5eM4
// https://stark-cliffs-55109.herokuapp.com

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7pr7e.mongodb.net/?retryWrites=true&w=majority`;

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
    const reviewCollection = client
      .db("manufacturer-website")
      .collection("reviews");
    const orderCollection = client
      .db("manufacturer-website")
      .collection("orders");
    const paymentCollection = client
      .db("manufacturer-website")
      .collection("payments");

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
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: "admin" },
        };
        const result = await userCollection.updateOne(filter, updateDoc);

        res.send(result);
      } else {
        return res.status(403).send({ message: "Forbidden access" });
      }
    });
    //-------------------admin data add put api end---------------------//
    //-------------------admin data check get api start---------------------//
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });
    //-------------------admin data check get api end---------------------//
    //-------------------all users data get api start---------------------//
    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });
    //-------------------all users data get api end---------------------//
    //-------------------review data post api start---------------------//

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    //-------------------review data post api end---------------------//
    //-------------------review data get api start---------------------//
    app.get("/review", async (req, res) => {
      const reviews = await reviewCollection.find().toArray();
      res.send(reviews);
    });
    //-------------------review data get api end---------------------//
    //-------------------order data post api start---------------------//
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });
    //-------------------order data post api end---------------------//
    //-------------------Add products data post api end---------------------//
    app.post("/parts", verifyJWT, async (req, res) => {
      const parts = req.body;
      const result = await partsCollection.insertOne(parts);
      res.send(result);
    });
    //-------------------Add products data post api end---------------------//
    //-------------------Update Available Quantity Put api start---------------------//
    app.put("/order/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      console.log("id", id);
      const filter = { _id: ObjectId(id) };
      const quantity = req.body;
      const options = { upsert: true };
      console.log(quantity);
      // const options = { upsert: true };
      const updateDoc = {
        $set: { availableQuantity: quantity.availableQuantity },
      };
      console.log("updateDoc", updateDoc);
      const result = await orderCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      console.log(result);
      res.send(result);
    });
    //-------------------Update Available Quantity Put api end---------------------//
    //-------------------MyOrder get api start---------------------//
    app.get("/order/:email", async (req, res) => {
      const email = req.params;
      const result = await orderCollection.find(email).toArray();
      res.send(result);
    });
    //-------------------MyOrder  get api end---------------------//
    //-------------------MyOrder 1 item get api start---------------------//
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.findOne(query);
      res.send(result);
    });
    //-------------------MyOrder 1 item get api end---------------------//
    //-------------------all order data get api start---------------------//
    app.get("/orders", async (req, res) => {
      const orders = await orderCollection.find().toArray();
      res.send(orders);
    });
    //-------------------all order data get api end---------------------//
    //-------------------Payment Post  api start---------------------//
    app.post("/create-payment-intent", async (req, res) => {
      const order = req.body;
      // console.log("jsdhahfdajkjhasjhkjkh", order);
      const price = order.paymentAmount;
      // console.log("shjahsdiAUs", price);
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });
    //-------------------Payment Post  api end---------------------//
    //-------------------Payment patch  api start---------------------//
    app.patch("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          paid: true,
          status: "pending",
          transactionId: payment.transactionId,
        },
      };
      const result = await paymentCollection.insertOne(payment);
      const updateOrders = await orderCollection.updateOne(filter, updateDoc);
      res.send(updateDoc);
    });
    //-------------------Payment patch  api end---------------------//
    //-------------------Order Shiped patch  api start---------------------//
    app.put("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const status = req.body;
      const updateDoc = {
        $set: {
          status: "shipped",
        },
      };
      const updateStatus = await orderCollection.updateOne(filter, updateDoc);
      res.send(updateStatus);
    });
    //-------------------Order Shiped patch  api end---------------------//
    //-------------------Order cancel delete  api start---------------------//
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(filter);
      res.send(result);
    });
    //-------------------Order cancel delete  api end---------------------//
    //-------------------admin  delete products  api start---------------------//
    app.delete("/parts/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await partsCollection.deleteOne(filter);
      res.send(result);
    });
    //-------------------admin  delete products  api end---------------------//
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
