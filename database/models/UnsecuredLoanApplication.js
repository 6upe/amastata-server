const mongoose = require("mongoose");

// Define the schema for SecuredLoanApplication
const unsecuredLoanApplicationSchema = new mongoose.Schema({
  debtorId: {
    type: String, // Assuming debtorId is a reference to a User model
    required: true,
  },
  lenderId: {
    type: String, // Assuming lender is a reference to a User model
    required: true,
  },
  amountRequested: {
    type: String,
    required: true,
  },
  loanRepaymentDate: {
    type: Date,
    required: true,
  },
});

// Create a model for SecuredLoanApplication
const UnsecuredLoanApplication = mongoose.model(
  "unsecuredLoanApplication",
  unsecuredLoanApplicationSchema
);

module.exports = UnsecuredLoanApplication;
