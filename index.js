const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000;

//middlewire
app.use(cors({
  origin: [
    //'http://localhost:5173',
    'https://clever-custard-7b76d3.netlify.app',
    'https://jobquester-b526e.web.app',
    'https://jobquester-b526e.firebaseapp.com',

  ],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const verifyToken = async(req,res,next)=>{
	  const token = req?.cookies?.token;
	 // console.log('value of token in middlewire', token)
	  if(!token){
		return res.status(401).send({message:'not authorized'})
	  }
	  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{ 
		if(err){ 
		  console.log(err)
		  return res.status(401).send({message:'unuthorized'})
		}

		// console.log('vaue in the token', decoded)
		 req.user=decoded
		next()
	  })
    
	};		

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
    //await client.connect();

    //database collections
    const database = client.db("JobQuester");
    const jobscollection = database.collection("alljobs");
    const appliedjobscollection = database.collection("appliedjobs");

    //jwt 

    app.post('/jwt', async (req, res) => {
      const user = req.body
      console.log('token from user email ', user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none', 
        })
        .send({success: true})
    })

    app.post('/logout', async(req,res)=>{
      const user = req.body
      res.clearCookie('token').send({success: true})
    })


    // alljobs + category + email

    app.get('/jobs', async (req, res) => {
      
      let query = {}
      const category = req.query.job_category;
      console.log(category)
      const email = req.query.email;
      const title = req.query.job_title;
      console.log(title)
      if (category) {
        query.job_category = category
      }
      if (email) {
       
        query.email = email
      }
      if (title) {
        query.job_title = title
      }

      const cursor = jobscollection.find(query);
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/jobs/:id',verifyToken, async (req, res) => {
      console.log("req",req.cookies)
      console.log("user",req.user)
      // if(req.user.email !== req.query.email){
      //   return res.status(403).send({message:'forbidden access'})
      // }
      const id = req.params.id
      const query = { _id: new ObjectId(id) };
      const result = await jobscollection.findOne(query)
      res.send(result)
    })

    //update
    app.put("/jobs/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      console.log(body)
      const upjob = {
        $set: {
          job_banner: body.job_banner,
          job_title: body.job_title,
          name: body.name,
          job_category: body.job_category,
          salary: body.salary,
          job_description: body.job_description,
          applicant_number: body.applicant_number,
        }
      }
      const result = await jobscollection.updateOne(query, upjob);
      res.send(result);

    })


    app.patch('/jobs/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updateappnum = req.body
      console.log("a", updateappnum)
      const updateNum = {
        $set: {
          applicant_number: updateappnum.applicant_number
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

    app.delete('/jobs/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) };
      const result = await jobscollection.deleteOne(query);

      res.send(result)
    })

    // Applied jobs

    app.get("/appliedjobs",async (req, res) => {
      console.log("apply",req.cookies)
      console.log("user",req.user)
      let query = {}
      const category = req.query.job_category;

      if (category) {
        query.job_category = category
      }
      const result = await appliedjobscollection.find(query).toArray()
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