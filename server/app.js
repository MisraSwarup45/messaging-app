const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://127.0.0.1:27017/messaging-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  const filePath = '../GeneralistRails_Project_MessageData.csv';
  try {
    await fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', async (data) => {
        if (data['Message Body']) {
          try {
            const newThread = new Thread({
              customerMessage: data['Message Body'],
            });

            await newThread.save();
            console.log('CSV data has been imported to MongoDB');
          } catch (error) {
            console.error('Error storing in MongoDB:', error);
          }
        }
      })
      .on('end', () => {
        console.log('All messages imported to MongoDB.');
      });
  } catch (error) {
    console.error('Error reading CSV file:', error);
  }
});

const messageSchema = new mongoose.Schema({
  sender: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
  agentId: String,
  isRead: Boolean,
  reply: String,
  replyingTo: mongoose.Schema.Types.ObjectId,
});

const Message = mongoose.model('Message', messageSchema);

const threadSchema = new mongoose.Schema({
  customer: String,
  customerMessage: String,
  adminReplies: [messageSchema],
}, { timestamps: true });

const Thread = mongoose.model('Thread', threadSchema);

app.get('/api/threads', async (req, res) => {
  try {
    const threads = await Thread.find().sort({ createdAt: -1 });
    res.json(threads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/messages', async (req, res) => {
  const { sender, content, reply, replyingTo } = req.body;

  try {
    if (replyingTo) {
      const thread = await Thread.findById(replyingTo);
      if (thread) {
        const newReply = new Message({
          sender,
          content,
          reply,
          replyingTo,
        });
        await newReply.save();

        thread.adminReplies.push(newReply);
        await thread.save();

        res.status(201).json(newReply);
      } else {
        res.status(404).json({ message: 'Thread not found' });
      }
    } else {
      const newThread = new Thread({
        customer: sender,
        customerMessage: content,
        adminReplies: [],
      });
      await newThread.save();
      res.status(201).json(newThread);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
