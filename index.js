require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const session = require("express-session");
const mongoose = require("mongoose");
const Admin = require("./database/models/Admin");
const Lender = require("./database/models/Lender");
const Debtor = require("./database/models/debtor");
const jwt = require("jsonwebtoken"); // You'll need to install the 'jsonwebtoken' package

/****************GLOBAL VARIABLES*******************/
const app = express();
const port = process.env.PORT || 3000;
const accountSid = process.env.TWILIO_CLIENT_ID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

let SESSION_OPEN = false;
let PHONE_NUMBER = "+260962893773";
let VERIFICATION_CODE = 1234;

/*******************MIDDLEWARE***********************/
app.use(cors([]));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json()); // Parse JSON request body
app.use(express.static("public")); // Serve static files from a directory
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_KEY, // Replace with a strong, secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set secure to true in a production environment with HTTPS
  })
);
/*******************SET VIEW ENGINE***********************/
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/**************DATABASE CONNECTION******************/
const mongoDBConnection = process.env.MONGODB_URI;
const connectWithRetry = () => {
  mongoose
    .connect(mongoDBConnection, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connected to MongoDB");
      app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error);
      console.log("Retrying in 5 seconds...");
      setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    });
};

// Call the connectWithRetry function to initiate the connection and retries
connectWithRetry();

/*****************GLOBAL FUNCTIONS******************/
function generateOTP() {
  const min = 1000; // Minimum 4-digit number
  const max = 9999; // Maximum 4-digit number
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const verifyToken = (token, secretKey) => {
  try {
    const decodedToken = jwt.verify(token, secretKey);
    const userId = decodedToken.userId; // Extract user ID from the payload
    return userId;
  } catch (error) {
    throw new Error("Token verification failed");
  }
};

// Create a storage engine using multer
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    // Define the destination directory for uploaded files (public/uploads)
    callback(null, "public/uploads/");
  },
  filename: (req, file, callback) => {
    // Generate a unique filename for each uploaded file
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    const fileName = file.fieldname + "-" + uniqueSuffix + fileExtension;
    callback(null, fileName);
  },
});

// Create an instance of the multer middleware with the defined storage engine
const upload = multer({ storage });

/*********************ROUTES*************************/

app.get("/", (req, res) => {
  //FETCH ALL DEBTORS
  Debtor.find()
    .then((result) => {
      res.json(result[0]._id);
    })
    .catch((err) => {
      console.log(err);
    });
});

// app.get("/lenders", async (req, res) => {
//   console.log('fetching lender data...');
//   try {
//     // Use the find method to retrieve all lender documents from the database
//     const lenders = await Lender.find();

//     // Check if there are lenders in the database
//     if (lenders.length === 0) {
//       return res.status(404).json({ error: "No lenders found" });
//     }

//     // Extract the PDF data from the first lender document
//     const pdfFileName = lenders[0].AuthorizedPersonel.NRCFilePath;

//     // Specify the path where you want to store the PDF in the public directory
//     const pdfFilePath = path.join(__dirname, '\\public\\uploads\\documents-1695560436519-383099562.pdf');
//     console.log(pdfFilePath);

//     // Send the PDF file as a response
//     res.sendFile(pdfFilePath);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

app.get("/lenders", async (req, res) => {
  console.log("fetching lender data...");
  try {
    // Use the find method to retrieve all lender documents from the database
    const lenders = await Lender.find();

    // Check if there are lenders in the database
    if (lenders.length === 0) {
      return res.status(404).json({ error: "No lenders found" });
    }

    console.log(lenders);
    // res.json(lenders);
    // Render the "lenders.ejs" view and pass the lenders data
    res.render("admin-dashboard", { lenders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/view-pdf", (req, res) => {
  const pdfPath = req.body.pdfPath; // Get the PDF file path from the request body

  
  // Check if pdfPath is defined
  if (!pdfPath) {
    return res.status(400).send("PDF path is missing in the request body");
  }

  const pdfFilePath = path.join(__dirname, pdfPath);
  const cleanedFilePath = pdfFilePath.replace(/"/g, ""); // Remove double quotes if present

  console.log(cleanedFilePath);
  
  const newCleanedPath = cleanedFilePath.replace(/\\/g, '\\\\');

  console.log(newCleanedPath);
  // Serve the PDF file
  res.sendFile(newCleanedPath);
});

app.get('/view', (req, res) => {
  res.sendFile('E:\\Year 4\\2nd Semester\\4400 - Project\\Final Year Project\\amastata-server\\public\\uploads\\documents-1695794458817-141235074.pdf');
});

app.get("/user-data", async (req, res) => {
  const authToken = req.headers.authorization;
  const secretKey = process.env.JWT_SECRET; // Replace with your actual secret key

  const userId = verifyToken(authToken, secretKey);
  console.log("Fetching User Data: ", userId);

  try {
    const user = await Debtor.findOne({ _id: userId });
    // Respond with the user's data
    const userData = user.completeSetup.emailAddress;
    console.log("User Data Fetched: ", userData);
    res.json(userData);
  } catch (error) {
    console.log("Unauthorized user!");
    // Handle token verification or data fetching errors
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.post("/debtor-login", async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password are not empty
  if (!email || !password) {
    return res.status(400).send({ message: "Email and password are required" });
  }

  // Regular expression for basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check if email matches the email format
  if (!emailRegex.test(email)) {
    return res.status(400).send({ message: "Invalid email format" });
  }

  console.log(req.body);

  try {
    // Query the database to find the user by email

    const user = await Debtor.findOne({ "completeSetup.emailAddress": email });

    // If the user does not exist, return an error
    if (!user) {
      return res.status(401).send({ message: "User does not exist" });
    }

    // Check if the password matches the stored hash
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).send({ message: "Invalid Password" });
    }

    // If the credentials are valid, create a JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Token expiration time (adjust as needed)
    });

    // Send the JWT as a response
    console.log("Login Success: ", email, token);
    res.send({ user: email, token: token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// Your route for creating a debtor account
app.post("/create-debtor-account", (req, res) => {
  const { phoneNumber } = req.body;
  const verification_code = generateOTP();
  console.log(verification_code);
  // Set user OTP identification session variables
  req.session.VERIFICATION_CODE = verification_code;
  req.session.PHONE_NUMBER = phoneNumber;

  function sendOTPSMS(phoneNumber) {
    // TWILIO SEND OTP SMS
    client.messages
      .create({
        body:
          "Amastata Debtor Account Creation, Verification Code: " +
          verification_code,
        from: "+12678281437",
        to: phoneNumber,
      })
      .then((message) => {
        console.log(message.sid, " OTP SMS Sent to: ", phoneNumber);
        // You can now access session variables here
        console.log(
          "Session variables:",
          req.session.VERIFICATION_CODE,
          req.session.PHONE_NUMBER
        );
        PHONE_NUMBER = req.session.PHONE_NUMBER;
        VERIFICATION_CODE = req.session.VERIFICATION_CODE;
        SESSION_OPEN = true;
      })
      .catch((error) => {
        console.error("Error sending OTP SMS:", error);
      });
  }

  sendOTPSMS(phoneNumber);
});

app.post("/verify", (req, res) => {
  const Data = req.body;
  const OTP = Data.OTP;
  const dataFromClient = Data.screenData;
  const phoneNumber = Data.PhoneNumberPrimary;

  // Retrieve data from the user's session
  const storedVerificationCode = VERIFICATION_CODE;
  const storedPhoneNumber = PHONE_NUMBER;

  console.log(OTP);
  console.log(storedVerificationCode);
  console.log(phoneNumber);
  console.log(storedPhoneNumber);

  // Verify OTP and phone number
  if (OTP == storedVerificationCode && phoneNumber == storedPhoneNumber) {
    console.log(phoneNumber, " OTP VERIFIED!");
    console.log(
      "SAVING DATA...: ",
      dataFromClient[0].data.basicInformation.firstname
    );

    // Create a single object that includes data from all screens
    const combinedData = {
      basicInformation: dataFromClient[0].data.basicInformation,
      residentialAddress: dataFromClient[1].data.residentialAddress,
      identificationImages: {
        nrcFrontImage:
          dataFromClient[2].data.identificationImages.nrcFrontImage.base64,
        nrcBackImage:
          dataFromClient[2].data.identificationImages.nrcBackImage.base64,
        nrcNumber: dataFromClient[2].data.identificationImages.nrcNumber,
        portraitImage:
          dataFromClient[2].data.identificationImages.portraitImage.base64,
        portraitWithNRCImage:
          dataFromClient[2].data.identificationImages.portraitWithNRCImage
            .base64,
      },
      completeSetup: dataFromClient[3].data.completeSetup,
    };

    let email = dataFromClient[3].data.completeSetup.emailAddress;
    // CONSOLIDATE RECEIVED DATA WITH DEFINED DEBTOR SCHEMA
    const newSchimarizedData = new Debtor(combinedData);
    newSchimarizedData
      .save()
      .then(async (user) => {
        const newUser = await Debtor.findOne({
          "completeSetup.emailAddress": email,
        });

        if (newUser) {
          // If the credentials are valid, create a JWT
          const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET,
            {
              expiresIn: "1h", // Token expiration time (adjust as needed)
            }
          );

          // Send the JWT as a response
          console.log(
            "Sign up Success: ",
            newUser.completeSetup.emailAddress,
            token
          );
          res.send({
            isValid: true,
            user: newUser.completeSetup.emailAddress,
            token: token,
          }); // Send user email and token
        } else {
          console.log("something went wrong while trying to find the newUser");
          res.send({ message: "something went wrong" });
        }
      })
      .catch((error) => {
        // Corrected catch block
        console.error(
          `Error saving data: ${dataFromClient[0].data.basicInformation.firstname}`,
          error
        );
        res.status(500).json({ error: "Internal server error" });
      });
  } else {
    res.json({ isValid: false });
  }
});

app.post(
  "/apply-lender-account",
  upload.array("documents", 2),
  async (req, res) => {
    console.log("Received a POST request");
    console.log("Request Headers:", req.headers);
    console.log("Request Body:", req.body);

    try {
      // Access the form data and uploaded files
      const formData = {
        LenderCompanyInfo: JSON.parse(req.body.LenderCompanyInfo),
        AuthorizedPersonel: JSON.parse(req.body.AuthorizedPersonel),
        LenderCompleteSetup: JSON.parse(req.body.LenderCompleteSetup),
      };

      console.log("UPLOADED FILES: ", JSON.stringify(req.files, null, 2));

      // Access the uploaded files directly
      const NRCFile = req.files[0]; // Assuming it's a single file
      const KYCDocumentFile = req.files[1]; // Assuming it's a single file

      // Move the uploaded files to a permanent location (e.g., public/uploads)
      const NRCFilePath = NRCFile.path;
      const KYCDocumentFilePath = KYCDocumentFile.path;

      try {
        // Write the files to the permanent location
        fs.writeFileSync(NRCFilePath, JSON.stringify(NRCFile.buffer));
        fs.writeFileSync(
          KYCDocumentFilePath,
          JSON.stringify(KYCDocumentFile.buffer)
        );
      } catch (error) {
        console.log('Error Writing File: ', error);
      } finally {
        console.log('Saving Data...');
        // Save the form data and file paths to MongoDB
        const lenderData = new Lender({
          LenderCompanyInfo: formData.LenderCompanyInfo,
          AuthorizedPersonel: {
            ...formData.AuthorizedPersonel,
            NRCFilePath: NRCFilePath, // Store the NRC file path
          },
          LenderKYCDocument: {
            KYCDocumentFilePath: KYCDocumentFilePath, // Store the KYC Document file path
          },
          LenderCompleteSetup: formData.LenderCompleteSetup,
        });

        await lenderData.save();
        console.log('Lender Application Sent!');
        // Respond with a success message
        res.status(201).json({
          isValid: true,
          message: "Lender application sent successfully",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// // route for creating a lender account
// app.post("/apply-lender-account", async (req, res) => {
//   try {
//     const lenderData = req.body; // Assuming the request body contains lenderDataArray
//     const combinedLenderData = {
//       LenderCompanyInfo: lenderData[0].data.LenderCompanyInfo,
//       AuthorizedPersonel: {
//         firstname: lenderData[1].data.AuthorizedPersonel.firstname,
//         lastname: lenderData[1].data.AuthorizedPersonel.lastname,
//         phoneNumberPrimary:
//           lenderData[1].data.AuthorizedPersonel.phoneNumberPrimary,
//         emailAddress: lenderData[1].data.AuthorizedPersonel.emailAddress,
//         occupation: lenderData[1].data.AuthorizedPersonel.occupation,
//         NRC: {
//           uri: lenderData[1].data.AuthorizedPersonel.NRC.uri,
//           type: lenderData[1].data.AuthorizedPersonel.NRC.mimeType,
//           name: lenderData[1].data.AuthorizedPersonel.NRC.name,
//         },
//       },
//       LenderKYCDocument:
//       {
//         uri: lenderData[2].data.LenderKYCDocument.uri,
//         type: lenderData[2].data.LenderKYCDocument.mimeType,
//         name: lenderData[2].data.LenderKYCDocument.name,
//       },
//       LenderCompleteSetup: lenderData[3].data.LenderCompleteSetup,
//     };

//     console.log(combinedLenderData);

//     // Create a new Lender document and save it to the database
//     const newLender = new Lender(combinedLenderData);
//     await newLender.save();

//     res
//       .status(201)
//       .json({ isValid: true, message: "Lender application sent successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ isValid: true, message: "Internal server error" });
//   }
// });
