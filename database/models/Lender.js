const mongoose = require('mongoose');

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
});

module.exports = mongoose.model('Lender', lenderSchema);
