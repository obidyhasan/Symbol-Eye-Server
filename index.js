const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wilyp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Create Collections
    const productsCollection = client.db("symbolEyeDB").collection("products");
    const servicesCollection = client.db("symbolEyeDB").collection("services");
    const galleryCollection = client.db("symbolEyeDB").collection("gallery");
    const faqCollection = client.db("symbolEyeDB").collection("faq");
    const categoriesCollection = client
      .db("symbolEyeDB")
      .collection("categories");

    // Verify Token Middleware
    const verifyToken = (req, res, next) => {
      if (!req?.headers?.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }

      const token = req?.headers?.authorization.split(" ")[1];
      jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decode) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decode = decode;
        next();
      });
    };

    // Admin Verify Middleware
    const verifyAdmin = async (req, res, next) => {
      const email = req?.decode?.email;
      if (email !== process.env.ADMIN_EMAIL) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // JWT Token Create Api
    app.post("/api/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET_KEY, {
        expiresIn: "30 days",
      });
      res.send({ token });
    });

    // --------- REST APIS ----------
    // Category Create API
    app.post("/api/category", verifyToken, verifyAdmin, async (req, res) => {
      const category = req?.body;
      const result = await categoriesCollection.insertOne(category);
      res.send(result);
    });

    // Get Category Api
    app.get("/api/category", verifyToken, verifyAdmin, async (req, res) => {
      const result = await categoriesCollection.find().toArray();
      res.send(result);
    });

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("symbol eye server on running");
});

app.listen(port, () => {
  console.log(`Symbol Eye listening on prot ${port}`);
});
