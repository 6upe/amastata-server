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
const SecuredLoanApplication = require("./database/models/SecuredLoanApplication");
const UnsecuredLoanApplication = require("./database/models/UnsecuredLoanApplication");
const calculateCreditScore = require("./AI Models/calculateCreditScore");

const jwt = require("jsonwebtoken"); // You'll need to install the 'jsonwebtoken' package

/****************GLOBAL VARIABLES*******************/
const app = express();
const port = process.env.PORT || 3000;
const accountSid = process.env.TWILIO_CLIENT_ID;
const authTokenTwilio = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authTokenTwilio);

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

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Replace '*' with the specific origin you want to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

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
      console.log("Retr---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ying in 5 seconds...");
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

    // Split lenders into three sets based on status
    const approvedLenders = lenders.filter(lender => lender.LenderStatus.status === 'approved');
    const rejectedLenders = lenders.filter(lender => lender.LenderStatus.status === 'rejected');
    const pendingLenders = lenders.filter(lender => lender.LenderStatus.status === 'pending');

    // Determine the response format based on the client's request
    const acceptHeader = req.get("Accept");
    if (acceptHeader && acceptHeader.includes("application/json")) {
      // Respond with JSON if the client accepts JSON
      res.status(200).json({
        approved: approvedLenders,
        rejected: rejectedLenders,
        pending: pendingLenders,
        lenders: lenders
      });
    } else {
      // Render the "lenders.ejs" view for other requests
      res.render("admin-dashboard", {
        lenders,
        approvedLenders,
        rejectedLenders,
        pendingLenders
      });
    }
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

  const newCleanedPath = cleanedFilePath.replace(/\\/g, "\\\\");

  console.log(newCleanedPath);
  // Serve the PDF file
  res.sendFile(newCleanedPath);
});

app.get("/view", (req, res) => {
  res.sendFile(
    "E:\\Year 4\\2nd Semester\\4400 - Project\\Final Year Project\\amastata-server\\public\\uploads\\documents-1695794458817-141235074.pdf"
  );
});

app.get("/user-data", async (req, res) => {
  const authToken = req.headers.authorization;
  const secretKey = process.env.JWT_SECRET; // Replace with your actual secret key

  const userId = verifyToken(authToken, secretKey);
  console.log("Fetching User Data: ", userId);

  try {
    const user = await Debtor.findOne({ _id: userId });
    // Respond with the user's data
    const userData = user;
    console.log("User Data Fetched: ", userData);
    res.json(userData);
  } catch (error) {
    console.log("Unauthorized user!");
    // Handle token verification or data fetching errors
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.get("/lender-data", async (req, res) => {
  const authToken = req.headers.authorization;
  const secretKey = process.env.JWT_SECRET; // Replace with your actual secret key

  const userId = verifyToken(authToken, secretKey);
  console.log("Fetching User Data: ", userId);

  try {
    const user = await Lender.findOne({ _id: userId });
    // Respond with the user's data
    const userData = user;
    console.log("Lender Data Fetched: ", userData);
    res.json(userData);
  } catch (error) {
    console.log("Unauthorized Lender!");
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
      creditScoresVars: {
        currentLoans: 0,
        clearedLoans: 0,
        defaultedLoans: 0,
        creditScore: 0,
      }
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
        LenderStatus: JSON.parse(req.body.LenderStatus),
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
        console.log("Error Writing File: ", error);
      } finally {
        console.log("Saving Data...");
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
          LenderStatus: formData.LenderStatus,
        });

        const mfi_applicant = await lenderData.save();
        console.log("Lender Application Sent!");
        // Respond with a success message
        res.status(201).json({
          isValid: true,
          message: "Lender application sent successfully: " + mfi_applicant._id,
          AP_No: mfi_applicant._id,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Define a route to handle form submission and send the email
app.post("/approve-mfi", async (req, res) => {
  const { to, subject, message, mfi_id } = req.body;
  console.log("Approving MFI (server-side)");
  // Configure Nodemailer to send the email
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    // Configure your email provider's SMTP settings here
    service: "Gmail",
    auth: {
      user: "katongobupe444@gmail.com",
      pass: "aqbm rche vjnf gbbu",
    },
  });

  const mailOptions = {
    from: "katongobupe444@gmail.com",
    to,
    subject,
    html: message,
  };

  try {
    const updatedDocument = await Lender.findOneAndUpdate(
      { _id: mfi_id },
      { $set: { "LenderStatus.status": "approved" } },
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ error: "MFI not found" });
    }
    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Email sent!");
    res.json({message: "Email sent successfully!"});
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send email");
  }
});

app.post("/reject-mfi", async (req, res) => {
  const { to, subject, message, mfi_id } = req.body;
  console.log("rejecting MFI (server-side)");
  // Configure Nodemailer to send the email
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    // Configure your email provider's SMTP settings here
    service: "Gmail",
    auth: {
      user: "katongobupe444@gmail.com",
      pass: "aqbm rche vjnf gbbu",
    },
  });

  const mailOptions = {
    from: "katongobupe444@gmail.com",
    to,
    subject,
    html: message,
  };

  try {
    const updatedDocument = await Lender.findOneAndUpdate(
      { _id: mfi_id },
      { $set: { "LenderStatus.status": "rejected" } },
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ error: "MFI not found" });
    }
    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Email sent!");
    res.json({message: "Email sent successfully!"});

  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send email");
  }
});

app.post(
  "/update-mfi-advert",
  upload.array("LenderImages", 2),
  async (req, res) => {
    const authToken = req.headers.authorization;
    const secretKey = process.env.JWT_SECRET;
    console.log('Updating MFI advert: ', authToken);
    const mfi = verifyToken(authToken, secretKey);
    console.log("mfi Id :", mfi);
    console.log("UPLOADED FILES: ", JSON.stringify(req.files, null, 2));

    // Assuming you have two uploaded files (logo and catalog)
    const logoFile = req.files[0];
    const catalogFile = req.files[1];

    const logoFilePath = logoFile.filename;
    const catalogFilePath = catalogFile.filename;

    // Access other form data
    const { briefDesc, securedLoanInterest, unsecuredLoanInterest } = req.body;

    try {
      try {
       // Write the files to the permanent location
        fs.writeFileSync(logoFilePath, JSON.stringify(logoFilePath.buffer));
        fs.writeFileSync(
          catalogFilePath,
          JSON.stringify(catalogFilePath.buffer)
        );
      } catch (err) {
        console.log("Error writing Lender Images: ", err);
      } finally {
        console.log();
        // Update the document with the new data and file paths
        const updatedDocument = await Lender.findOneAndUpdate(
          { _id: mfi },
          {
            $set: {
              LenderStatus: {
                status: "ready",
              },
              LenderAdvert: {
                briefDesc,
                securedLoanInterest,
                unsecuredLoanInterest,
                logo: "/uploads/" + logoFile.filename, // Store the file path or an empty string if file doesn't exist
                catalogImage: "/uploads/" + catalogFile.filename, // Store the file path or an empty string if file doesn't exist
              },
            },
          },
          { new: true }
        );

        if (!updatedDocument) {
          return res.status(404).json({ error: "MFI not found" });
        }
        console.log("Lender Adert updated...");
        res.status(200).json({ message: "Data updated successfully" });
      }
    } catch (error) {
      console.error("Error updating Lender Advert: ", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.post("/lender-login", async (req, res) => {
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

    const user = await Lender.findOne({
      "LenderCompleteSetup.businessEmailAddress": email,
    });

    // If the user does not exist, return an error
    if (!user) {
      return res.status(401).send({ message: "User does not exist" });
    }

    if (user.LenderStatus.status == "pending") {
      return res.status(401).send({ message: "MFI Approval Pending" });
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
    res.send({ user: user._id, token: token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// Route handler for 'Collateral-based Loan' with file uploads
app.post('/apply-secured-loan', upload.array('attachmentUris'), async (req, res) => {
  
  const authToken = req.headers.authorization;
    const secretKey = process.env.JWT_SECRET;
    console.log('Sending Data to MFI: ', req.body);
    console.log('Uploaded files: ', req.files);
    const debtorId = verifyToken(authToken, secretKey);
    const debtor = await Debtor.findOne({ _id: debtorId });
    
    const debtorData = extractDebtorData(debtor);
    const creditScore = calculateCreditScore(debtorData);
    console.log(`${debtor.basicInformation.firstname} Credit Score: ${creditScore}`);

    function extractDebtorData(debtor) {
      return {
        occupation: debtor.basicInformation.occupation,
        outstandingLoans: debtor.creditScoresVars.currentLoans == null ? 0 : debtor.creditScoresVars.currentLoans,
        clearedLoans: debtor.creditScoresVars.clearedLoans == null ? 0 : debtor.creditScoresVars.clearedLoans,
        defaultedLoans: debtor.creditScoresVars.defaultedLoans == null ? 0 : debtor.creditScoresVars.defaultedLoans,
      };
    }

    async function updateDebtorCreditScore(debtorId, creditScore) {
      return Debtor.findOneAndUpdate(
        { _id: debtorId },
        {
          $set: {
            'creditScoresVars.currentLoans': +1,
            'creditScoresVars.creditScore': creditScore,
          },
        },
        { new: true }
      );
    }
    
    

  try {
    // Get data from the request
    const {
      lenderId,
      amountRequested,
      loanRepaymentDate,
    } = req.body;

    // Get file paths of uploaded documents
    // Assuming you have two uploaded files (collateralImage and supportingDocx)
    const collateralImage = req.files[0];
    const supportingDocx = req.files[1];

    const collateralImagePath = collateralImage.filename;
    const supportingDocxPath = supportingDocx.filename;

    try {
      // Write the files to the permanent location
       fs.writeFileSync(collateralImagePath, JSON.stringify(collateralImagePath.buffer));
       fs.writeFileSync(supportingDocxPath, JSON.stringify(supportingDocxPath.buffer));
     } catch (err) {
       console.log("Error writing loan application files: ", err);
     } finally {
      // Create a new loan application document
      const loanApplication = new SecuredLoanApplication({
        debtorId,
        lenderId,
        amountRequested,
        loanRepaymentDate,
        collateralImagePath: "/uploads/" + collateralImagePath,
        supportingDocxPath: "/uploads/" + supportingDocxPath
      });

      // Save the document to MongoDB
      
      await updateDebtorCreditScore(debtorId, creditScore);
      await loanApplication.save();

      console.log('Loan Applied Successfully');
      
      res.status(201).json({ message: 'Secured loan application submitted successfully' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/apply-unsecured-loan', async (req, res) => {

  try {
    const authToken = req.headers.authorization;
    const secretKey = process.env.JWT_SECRET;
    const debtorId = verifyToken(authToken, secretKey);
    console.log('Sending Data to MFI: ', debtorId);
    const debtor = await Debtor.findOne({ _id: debtorId });
    
    const debtorData = extractDebtorData(debtor);
    console.log('Credit score data: ', debtorData)
    const creditScore = calculateCreditScore(debtorData);
    console.log(`${debtor.basicInformation.firstname} Credit Score: ${creditScore}`);

    const loanApplicationData = {
      debtorId,
      lenderId: req.body.lenderId,
      amountRequested: req.body.amountRequested,
      loanRepaymentDate: req.body.loanRepaymentDate,
      creditScore,
    };
    
    await createLoanApplication(loanApplicationData);
    await updateDebtorCreditScore(debtorId, creditScore);

    console.log('Loan Applied Successfully');
    res.status(201).json({ message: 'Unsecured loan application submitted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

  function extractDebtorData(debtor) {
    return {
      occupation: debtor.basicInformation.occupation,
      outstandingLoans: debtor.creditScoresVars.currentLoans == null ? 0 : debtor.creditScoresVars.currentLoans,
      clearedLoans: debtor.creditScoresVars.clearedLoans == null ? 0 : debtor.creditScoresVars.clearedLoans,
      defaultedLoans: debtor.creditScoresVars.defaultedLoans == null ? 0 : debtor.creditScoresVars.defaultedLoans,
    };
  }
  
  async function createLoanApplication(loanApplicationData) {
    const loanApplication = new UnsecuredLoanApplication(loanApplicationData);
    await loanApplication.save();
  }
  
  async function updateDebtorCreditScore(debtorId, creditScore) {
    return Debtor.findOneAndUpdate(
      { _id: debtorId },
      {
        $set: {
          'creditScoresVars.currentLoans': +1,
          'creditScoresVars.creditScore': creditScore,
        },
      },
      { new: true }
    );
  }

});

app.get('/test', (req, res) => {
  console.log('hi from the server');
  res.json({message: 'hi from the server'});
});

app.post("/api/post-example", (req, res) => {
  const { message } = req.body;
  console.log("Received POST request with message: " + message);
  res.json({ received: true, message: message });
});