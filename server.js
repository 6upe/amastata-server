const express = require('express');
const cors = require('cors'); // Import the cors module
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Use the cors middleware

// Middleware
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/data', (req, res) => {
  res.send('data from the server');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
