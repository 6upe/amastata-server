const express = require("express");
const textflow = require("textflow.js");
const cors = require("cors"); // Import the cors module
require("dotenv").config(); // Load environment variables
const mongoose = require("mongoose");
const Admin = require("./database/models/Admin");
const Debtor = require("./database/models/debtor");
const bodyParser = require("body-parser");

const port = process.env.PORT || 3000;
const app = express();

// Increase the payload size limit (e.g., 10MB)
app.use(bodyParser.json({ limit: "50mb" }));

app.use(express.json()); // Parse JSON request body

// Use the cors middleware
app.use(cors());

//database connection

const mongoDBConnection = process.env.MONGODB_URI;

textflow.useKey(process.env.TEXTFLOW_API_KEY);

mongoose
  .connect(mongoDBConnection, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

app.get("/", (req, res) => {
  promptSend("+260962893773");

  Admin.find()
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/data", (req, res) => {
  res.json("Hello World!");
});

app.post("/verify", async (req, res) => {
  const Data = req.body;
  console.log("Received OTP:", Data);

  //The user has submitted the code
  let result = await textflow.verifyCode(Data.PhoneNumberPrimary, Data.OTP);
  //if `result.valid` is true, then the phone number is verified.

  if (result) {
    console.log("Phone Number verified");
  }

  res.status(200).json({ message: "POST request received successfully." });
});

app.post("/create-debtor-account", (req, res) => {
  function promptSend(phoneNumber) {
    console.log("sending OTP to: " + phoneNumber);
    textflow.sendSMS(phoneNumber, "Dummy message text...");
  }

  const dataFromClient = req.body;

  promptSend(dataFromClient[0].data.basicInformation.phoneNumberPrimary);

  console.log(
    "Received data:",
    dataFromClient[0].data.basicInformation.firstname
  );

  // Create a single object that includes data from all screens
  const combinedData = {
    basicInformation: dataFromClient[0].data.basicInformation, // Data from DebtorBasicInfo
    residentialAddress: dataFromClient[1].data.residentialAddress, // Data from DebtorResidentialAddress
    identificationImages: {
      nrcFrontImage:
        dataFromClient[2].data.identificationImages.nrcFrontImage.base64,
      nrcBackImage:
        dataFromClient[2].data.identificationImages.nrcBackImage.base64,
      nrcNumber: dataFromClient[2].data.identificationImages.nrcNumber,
      portraitImage:
        dataFromClient[2].data.identificationImages.portraitImage.base64,
      portraitWithNRCImage:
        dataFromClient[2].data.identificationImages.portraitWithNRCImage.base64,
    }, // Data from DebtorIdentification
    completeSetup: dataFromClient[3].data.completeSetup, // Data from DebtorCompleteSetup
  };

  const newSchimarizedData = new Debtor(combinedData);
  newSchimarizedData
    .save()
    .then(() => {
      console.log(
        `New Account Created: ${dataFromClient[0].data.basicInformation.firstname}`
      );
    })
    .catch((error) => {
      // Corrected catch block
      console.error(
        `Error saving data: ${dataFromClient[0].data.basicInformation.firstname}`,
        error
      );
    });

  Debtor.find()
    .then((result) => {
      console.log(JSON.stringify(result));
    })
    .catch((err) => {
      console.log(err);
    });

  res.status(200).json({ message: "POST request received successfully." });
});

function renderDebtorsPage(debtors) {
  const debtorCards = debtors.map((debtor) => {
    return `
      <div class="debtor-card">
        <h2>${debtor.basicInformation.firstname} ${debtor.basicInformation.lastname}</h2>
        <p>Occupation: ${debtor.basicInformation.occupation}</p>
        <p>Phone: ${debtor.basicInformation.phoneNumberPrimary}</p>
        <!-- Add more debtor information as needed -->

        <!-- Display debtor images -->
<img width="50px" height="50px" src="data:image/jpeg;base64, ${debtor.identificationImages.nrcFrontImage}" alt="NRC Front" />
<img width="50px" height="50px" src="data:image/jpeg;base64, ${debtor.identificationImages.nrcBackImage}" alt="NRC Back" />
<!-- Add more image tags for other images -->

      </div>
    `;
  });

  // HTML template for the entire page
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Debtors</title>
    </head>
    <body>
      <h1>Debtors</h1>
      ${debtorCards.join("")}
    </body>
    </html>
  `;

  return html;
}

// Define a route to display debtor data as an HTML page
app.get("/debtors", async (req, res) => {
  try {
    // Fetch the debtor data from your database (e.g., using Mongoose)
    const debtors = await Debtor.find(); // Replace with your actual query

    // Render an HTML page with debtor information and images
    const html = renderDebtorsPage(debtors); // Implement this function

    // Set the Content-Type header to indicate an HTML response
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("Error fetching debtor data:", error);
    res.status(500).send("Internal Server Error");
  }
});
