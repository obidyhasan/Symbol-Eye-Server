const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    app.get("/api/category", async (req, res) => {
      const result = await categoriesCollection.find().toArray();
      res.send(result);
    });

    // Category delete api
    app.delete(
      "/api/category/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req?.params;
        const query = { _id: new ObjectId(id) };
        const result = await categoriesCollection.deleteOne(query);
        res.send(result);
      }
    );

    // ---------- Products APIS -------------
    // Create Product Apis
    app.post("/api/products", verifyToken, verifyAdmin, async (req, res) => {
      const productInfo = req.body;
      const result = await productsCollection.insertOne(productInfo);
      res.send(result);
    });

    // Get Product Apis
    app.get("/api/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    // Get Single Product api
    app.get("/api/products/:id", async (req, res) => {
      const { id } = req.body;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });
    // Get Featured Product api
    app.get("/api/featured/products", async (req, res) => {
      const result = await productsCollection
        .find({ isFeatured: "Featured" })
        .toArray();
      res.send(result);
    });

    // Update Product APIs
    app.patch(
      "/api/products/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const product = req.body;
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            name: product?.name,
            price: product?.price,
            category: product?.category,
            isFeatured: product?.isFeatured,
            description: product?.description,
            image: product?.image,
          },
        };
        const result = await productsCollection.updateOne(query, updateDoc);
        res.send(result);
      }
    );

    // Product Delete api
    app.delete(
      "/api/products/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
        const result = await productsCollection.deleteOne(query);
        res.send(result);
      }
    );

    // ------------ Servicers APIs -------------
    // Create Services Api
    app.post("/api/services", verifyToken, verifyAdmin, async (req, res) => {
      const serviceInfo = req.body;
      const result = await servicesCollection.insertOne(serviceInfo);
      res.send(result);
    });

    // Get Services Api
    app.get("/api/services", async (req, res) => {
      const result = await servicesCollection.find().toArray();
      res.send(result);
    });

    // Update Services api
    app.patch(
      "/api/services/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
      }
    );

    // Delete Services api
    app.delete(
      "/api/services/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
        const result = await servicesCollection.deleteOne(query);
        res.send(result);
      }
    );

    // ------------ Gallery APIS ------------
    // POST gallery api
    app.post("/api/gallery", verifyToken, verifyAdmin, async (req, res) => {
      const galleryInfo = req.body;
      const result = await galleryCollection.insertOne(galleryInfo);
      res.send(result);
    });

    // Get gallery api
    app.get("/api/gallery", async (req, res) => {
      const result = await galleryCollection.find().toArray();
      res.send(result);
    });

    // DELETE gallery api
    app.delete(
      "/api/gallery/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
        const result = await galleryCollection.deleteOne(query);
        res.send(result);
      }
    );

    // -------------- FAQ APIs ---------------
    // POST FAQ api
    app.post("/api/faq", verifyToken, verifyAdmin, async (req, res) => {
      const faqInfo = req.body;
      const result = await faqCollection.insertOne(faqInfo);
      res.send(result);
    });

    // GET FAQ api
    app.get("/api/faq", async (req, res) => {
      const result = await faqCollection.find().toArray();
      res.send(result);
    });

    app.delete("/api/faq/:id", verifyToken, verifyAdmin, async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await faqCollection.deleteOne(query);
      res.send(result);
    });

    // get statistic
    app.get("/api/statistic", verifyToken, verifyAdmin, async (req, res) => {
      const totalProduct = await productsCollection.estimatedDocumentCount();
      const totalCategory = await categoriesCollection.estimatedDocumentCount();
      const totalServices = await servicesCollection.estimatedDocumentCount();
      const totalFAQ = await faqCollection.estimatedDocumentCount();
      res.send({ totalProduct, totalCategory, totalServices, totalFAQ });
    });

    // MongoDB Connect
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
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
