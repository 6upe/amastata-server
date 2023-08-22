const express = require('express');
const cors = require('cors'); // Import the cors module
require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');
const Admin = require('./database/models/admin');

const port = process.env.PORT || 3000;
const app = express();

// Use the cors middleware
app.use(cors());

//database connection


const mongoDBConnection = process.env.MONGODB_URI;

mongoose.connect(mongoDBConnection, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});


app.get('/', (req, res) => {
    Admin.find()
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.log(err)
      });
});

app.get('/data', (req, res) => {
  res.json('Hello, World!');
});
