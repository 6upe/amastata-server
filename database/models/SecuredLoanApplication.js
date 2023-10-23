const mongoose = require('mongoose');

// Define the schema for SecuredLoanApplication
const securedLoanApplicationSchema = new mongoose.Schema({
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
    type: String,
    required: true,
  },
  collateralImagePath: {
    type: String, // Store the file path or URL to the collateral image
  },
  supportingDocxPath: {
    type: String, // Store the file path or URL to the supporting document
  },
  // Add other fields as needed
});

// Create a model for SecuredLoanApplication
const SecuredLoanApplication = mongoose.model('SecuredLoanApplication', securedLoanApplicationSchema);

module.exports = SecuredLoanApplication;
