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
  res.sendFile(__dirname + '/index.html');
});

app.get('/data', (req, res) => {
  const adverts = [
      {
          advertID: "1",
          advertTitle: "Job Oppotunity: Software Developer",
          advertBody: "Some quick example text to build on the card title and make up the bulk of the card's content.",
          advertCreatedAt: "22 Jan, 2023",
          advertImagePath: "../procurement-images/procurement (1).jpg"
      },
      {
          advertID: "2",
          advertTitle: "Tender: Renovation of Ablution Block",
          advertBody: "Some quick example text to build on the card title and make up the bulk of the card's content.",
          advertCreatedAt: "22 Jan, 2023",
          advertImagePath: "../procurement-images/procurement (2).jpg"
      },
      {
          advertID: "3",
          advertTitle: "Supplier Registration",
          advertBody: "Some quick example text to build on the card title and make up the bulk of the card's content.",
          advertCreatedAt: "22 Jan, 2023",
          advertImagePath: "../procurement-images/procurement (3).jpg"
      },
      {
          advertID: "4",
          advertTitle: "Contract Awards",
          advertBody: "Some quick example text to build on the card title and make up the bulk of the card's content.",
          advertCreatedAt: "22 Jan, 2023",
          advertImagePath: "../procurement-images/procurement (4).jpg"
      },
  ];

  res.json(adverts);
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
