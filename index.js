const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("manufacturers");
});

app.listen(port, () => {
  console.log(`Example app listening on port manufacturers ${port}`);
});
