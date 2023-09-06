// const mongoose = require("mongoose");

// const debtorSchema = new mongoose.Schema({
//   firstname: {
//     type: String,
//     required: true,
//   },
//   lastname: {
//     type: String,
//     required: true,
//   },
//   occupation: String,
//   phoneNumberPrimary: String,
//   phoneNumberSecondary: String,
//   dateOfBirth: Date,
//   houseNumber: Number,
//   streetName: String,
//   township: String,
//   province: String,
//   district: String,
//   country: String,

//   emailAddress: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true,
//     lowercase: true,
//   },
//   nrcNumber: {
//     type: Number,
//   },
//   password: {
//     type: String,
//   },
//   confirmPassword: {
//     type: String,
//   },
// });

// const Debtor = mongoose.model("Debtor", debtorSchema);

// module.exports = Debtor;


const mongoose = require('mongoose');

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
});

const Debtor = mongoose.model('Debtor', debtorSchema);

module.exports = Debtor;


/*

create debtor schema that will store
4 objects of data

object 1 - BasicInformation
- firstname
- lastname
- occupation
- phone number (primary)
- phone number (secondary)
- date of birth

(all fields required)

object 2 - ResidentialAddress
- House number
- street name
- township
- province
- district
- country

(all fields required)

object 3 - identificationImages
- National Regristration Card (front)
- National Regristration Card (Back)
- National Regristration Card Number
- Potrait Image
- portrait of user holding NRC

(all fields required)

object 4 - Complete Setup
- Email Address
- Password
- Confirm Password

(all fields required)
*/
