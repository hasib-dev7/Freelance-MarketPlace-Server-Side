const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// firebase admin
const admin = require("firebase-admin");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 8000;
// middelwear
app.use(cors());
app.use(express.json());
// firebase service key
const serviceAccount = require("./services-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// momgodb connect
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_Password}@cluster0.y29zf.mongodb.net/?appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
// verifyToken
const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ message: "unauthorization access. token is not found " });
  }
  const token = authorization.split(" ")[1];
  // console.log(token)
  try {
    const decode = await admin.auth().verifyIdToken(token);
    console.log("access token", decode);
    next();
  } catch (error) {
    res.status(401).send({ message: "unauthorizaton access" });
  }
};
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //
    const db = client.db("Jobs_DB");
    const jobCollection = db.collection("jobs");
    const acceptJobCollection = db.collection("acceptJob");
    //
    // latest job data
    app.get("/latest-jobs", async (req, res) => {
      const result = await jobCollection
        .find()
        .sort({ date: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });
    //
    app.get("/jobs", async (req, res) => {
      const result = await jobCollection.find().toArray();
      res.send(result);
    });
    app.get("/jobs/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await jobCollection.findOne(query);
      res.send(result);
    });
    // filter job data
    app.get("/jobs", async (req, res) => {
      const sort = req.query.sort; 
      console.log("sort",sort)
      let sortOption = {};
      if (sort === "asc") {
        sortOption = { date: 1 };
      } else if (sort === "desc") {
        sortOption = { date: -1 };
      }
      const result = await jobCollection.find().sort(sortOption).toArray();
      res.send(result);
    });

    //
    app.post("/jobs", async (req, res) => {
      const courser = req.body;
      const result = await jobCollection.insertOne(courser);
      res.send(result);
    });
    app.patch("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      const filteredUpdate = {};

      if (body.title) filteredUpdate.title = body.title;
      if (body.category) filteredUpdate.category = body.category;
      if (body.description) filteredUpdate.description = body.description;
      if (body.image) filteredUpdate.image = body.image;

      const updateDoc = {
        $set: filteredUpdate,
      };
      const result = await jobCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    app.delete("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.deleteOne(query);
      console.log("delete job", result);
      res.send(result);
    });
    // my post job  api get email
    app.get("/my-jobs", async (req, res) => {
      const email = req.query.email;
      const result = await jobCollection
        .find({
          userEmail: email,
        })
        .toArray();
      res.send(result);
    });
    // accept job api get
    app.get("/accept-jobs", async (req, res) => {
      const email = req.query.email;
      const result = await acceptJobCollection
        .find({
          userEmail: email,
        })
        .toArray();
      res.send(result);
    });
    // accept job api post
    app.post("/accept-jobs", async (req, res) => {
      const courser = req.body;
      const usereEmail = courser.userEmail;
      const postJobUserEmail = courser.postUserEmail;
      const jobId = courser.jobId;
      if (usereEmail === postJobUserEmail) {
        return res
          .status(400)
          .send({ message: "You cannot accept own posted job!" });
      }
      //  Prevent duplicate accept
      const alreadyAccepted = await acceptJobCollection.findOne({
        userEmail: usereEmail,
        jobId: new ObjectId(jobId),
      });
      if (alreadyAccepted) {
        return res
          .status(400)
          .send({ message: "You already accepted this job!" });
      }
      // Insert new accept job record
      courser.jobId = new ObjectId(jobId); // convert before saving
      const result = await acceptJobCollection.insertOne(courser);
      res.send(result);
    });
    // accepted job collection delet api
    app.delete("/accept-jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await acceptJobCollection.deleteOne(query);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
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
// start server running
app.get("/", (req, res) => {
  res.send("Welcome Freelance MarketPlace ");
});
app.listen(port, () => {
  console.log(`freelance marketPlace server running on the port ${port}`);
});
