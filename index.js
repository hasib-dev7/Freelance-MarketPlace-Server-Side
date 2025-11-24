const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config()
const app = express();
const port = process.env.PORT || 8000;
// middelwear
app.use(cors());
app.use(express.json());
// momgodb connect
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_Password}@cluster0.y29zf.mongodb.net/?appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // 
    const db=client.db("Jobs_DB")
    const jobCollection=db.collection("jobs")
    app.get("/jobs",async(req,res)=>{
        const result=await jobCollection.find().toArray()
        res.send(result)
    })
    app.get("/jobs/:id",async(req,res)=>{
        const id=req.params.id;
        const query={_id:new ObjectId(id)}
        console.log("query id",query)
        const result=await jobCollection.findOne(query)
        res.send(result)
    })
    app.post("/jobs",async(req,res)=>{
        const courser=req.body
        const result=await jobCollection.insertOne(courser)
        res.send(result)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
