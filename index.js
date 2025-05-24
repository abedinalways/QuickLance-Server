const express = require('express');
const cors = require('cors');
const verifyToken = require('./verifyToken');
const allowedOrigins = ['https://quicklance-e9af0.web.app'];
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4oy8t6b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db('QuickLance');
    const tasksCollection = database.collection('tasks');
    const bidsCollection = database.collection('bids');

  
    app.get('/tasks', async (req, res) => {
      const cursor = tasksCollection.find().sort({ deadline: 1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/allTasks', async (req, res) => {
      const cursor = tasksCollection.find().sort({ deadline: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/allTasks/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const task = await tasksCollection.findOne({ _id: new ObjectId(id) });
        if (!task) {
          return res.status(404).send({ message: 'Task not found' });
        }
        res.send(task);
      } catch (error) {
        res.status(500).send({ message: 'Error retrieving task', error });
      }
    });

    app.get('/postedTasks', async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) query.email = email;
      const cursor = tasksCollection.find(query).sort({ deadline: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post('/bids', async (req, res) => {
      const bid = req.body;
      const existingBid = await bidsCollection.findOne({
        taskId: bid.taskId,
        userEmail: bid.userEmail,
      });

      if (existingBid) {
        return res
          .status(400)
          .send({ message: 'You have already bid on this task.' });
      }

      const result = await bidsCollection.insertOne(bid);
      res.send(result);
    });

    app.get('/bids', async (req, res) => {
      const taskId = req.query.taskId;
      const result = await bidsCollection.find({ taskId }).toArray();
      res.send(result);
    });

    app.post('/tasks', async (req, res) => {
      const newTask = req.body;
      const result = await tasksCollection.insertOne(newTask);
      res.send(result);
    });

    app.patch('/allTasks/:id', async (req, res) => {
      const id = req.params.id;
      const updatedTask = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          task: updatedTask.task,
          description: updatedTask.description,
          category: updatedTask.category,
          deadline: updatedTask.deadline,
          budget: updatedTask.budget,
        },
      };

      try {
        const result = await tasksCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Update failed', error });
      }
    });

    app.delete('/allTasks/:id', async (req, res) => {
      const id = req.params.id;
      const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
  } finally {
    
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('QuickLance backend is running!');
});

app.listen(port, () => {
  console.log(`QuickLance app is listening on port ${port}`);
});
