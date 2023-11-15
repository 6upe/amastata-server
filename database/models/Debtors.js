const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const debtorSchema = new mongoose.Schema({
  basicInformation: {
    firstname: String,
    lastname: String,
    occupation: String,
    phoneNumberPrimary: String,
    phoneNumberSecondary: String,
    dateOfBirth: Date,
  },
  residentialAddress: {
    houseNumber: String,
    streetName: String,
    township: String,
    province: String,
    district: String,
    country: String,
  },
  identificationImages: {
    nrcFrontImage: String,
    nrcBackImage: String,
    nrcNumber: String,
    portraitImage: String,
    portraitWithNRCImage: String,
  },

  completeSetup: {
    emailAddress: String,
    password: String,
    confirmPassword: String,
  },
  creditScoresVars: {
    currentLoans: Number,
    clearedLoans: Number,
    defaultedLoans: Number,
    creditScore: Number
  }
});

debtorSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.completeSetup.password = await bcrypt.hash(this.completeSetup.password, salt);
  next();
});

// Add a method to compare passwords
debtorSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('comparing passwords....');
    return await bcrypt.compare(candidatePassword, this.completeSetup.password);
  } catch (error) {
    throw error;
  }
};

const Debtor = mongoose.model("Debtor", debtorSchema);

module.exports = Debtor;
