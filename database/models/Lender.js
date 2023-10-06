const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const lenderSchema = new mongoose.Schema({
  LenderCompanyInfo: {
    companyName: String,
    businessOperationalAddress: String,
    phoneNumberPrimary: String,
    PhoneNumberSecondary: String,
    businessWebsite: String,
  },
  AuthorizedPersonel: {
    firstname: String,
    lastname: String,
    phoneNumberPrimary: String,
    emailAddress: String,
    occupation: String,
    NRCFilePath: String, // Store the file path for NRC
  },
  LenderKYCDocument: {
    KYCDocumentFilePath: String, // Store the file path for KYCDocument
  },
  LenderCompleteSetup: {
    businessEmailAddress: String,
    password: String,
  },
  LenderStatus: {
    status: String
  }
});

lenderSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.LenderCompleteSetup.password = await bcrypt.hash(this.LenderCompleteSetup.password, salt);
     
  next();
});

// Add a method to compare passwords
lenderSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.LenderCompleteSetup.password);
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('Lender', lenderSchema);
