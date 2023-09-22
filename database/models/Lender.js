const mongoose = require("mongoose");

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
    NRC: {
      uri: String,
      type: String,
      name: String,
    },
  },
  LenderKYCDocument: {
    uri: String,
    type: String,
    name: String,
  },
  LenderCompleteSetup: {
    businessEmailAddress: String,
    password: String,
  },
});

const Lender = mongoose.model("Lender", lenderSchema);

module.exports = Lender;
