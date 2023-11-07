const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000;

//middlewire
app.use(cors())
app.use(express.json()) 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.exrbbd1.mongodb.net/?retryWrites=true&w=majority`;
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

    //database collections
    const database = client.db("JobQuester");
    const jobscollection = database.collection("alljobs");
    const appliedjobscollection = database.collection("appliedjobs");

    // alljobs + category + email

    app.get('/jobs', async (req, res) => {
        
        let query= {}
        const category= req.query.job_category;
        console.log(category)
        const email= req.query.email;
        const title= req.query.job_title;
        console.log(title)
        if(category){
            query.job_category = category
        }
        if(email){
            query.email = email
        }
        if(title){
            query.job_title = title
        }

        const cursor = jobscollection.find(query);
        const result = await cursor.toArray()
        res.send(result)
    })

    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id) };
      const result = await jobscollection.findOne(query)
      res.send(result)
    })

    app.put("/jobs/:id", async (req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id) };
      const body = req.body;
      console.log(body)
      const upjob = {
        $set:{
          job_banner:body.job_banner,
          job_title:body.job_title,
          name:body.name,
          job_category:body.job_category,
          salary:body.salary,
          job_description:body.job_description,
          applicant_number:body.applicant_number,
        }
      }
      const result = await jobscollection.updateOne(query, upjob);
      res.send(result);

    })


    app.patch('/jobs/:id', async (req,res)=>{
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updateappnum = req.body
      console.log("a",updateappnum)
      const updateNum = {
        $set:{
          applicant_number : updateappnum.applicant_number
        }
      };
      const result = await jobscollection.updateOne(filter, updateNum)
      
      res.send(result)

    })
    
    app.post("/jobs", async (req, res) => {
        const query = req.body;
        console.log(query)
        const result = await jobscollection.insertOne(query)
        res.send(result)
    })

    app.delete('/jobs/:id', async (req,res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id) };
      const result = await jobscollection.deleteOne(query);

      res.send(result)
    })

    // Applied jobs

    app.get("/appliedjobs", async(req,res)=>{
      const result = await appliedjobscollection.find().toArray()
      res.send(result)
    })

    app.post("/appliedjobs", async (req, res) => {
      const query = req.body;
      const result = await appliedjobscollection.insertOne(query)
      res.send(result)
  })

    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Job Quester running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})