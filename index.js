const express = require('express');
const cors = require('cors'); // Import the cors module

const app = express();

// Use the cors middleware
app.use(cors());

app.get('/', (req, res) => {
  res.json('Hello, World!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});