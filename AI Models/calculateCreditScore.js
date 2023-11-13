// Constants for factor weights
const WEIGHTS = {
  OCCUPATION: 0.7,
  OUTSTANDING_LOANS: 0.1,
  CLEARED_LOANS: 0.1,
  DEFAULTED_LOANS: 0.1,
};

// Default score for unknown occupations
const DEFAULT_OCCUPATION_SCORE = 60;

function calculateCreditScore(debtorData) {
  // Extract debtor data
  const { occupation, outstandingLoans, clearedLoans, defaultedLoans } =
    debtorData;

  // Ensure the occupation option is in lowercase for consistency
  const lowerCaseOccupation = occupation.toLowerCase();

  // Calculate occupation score
  var occupationScore = null;

  const OCCUPATION_SCORES = {
    civil_servant: 90,
    business_owner: 80,
    not_employed: 55,
    student: 50,
    default_score: 50,
  };
  switch (occupation) {
    case "Civil Servant":
      occupationScore = OCCUPATION_SCORES.civil_servant;
      break;
    case "Business Owner":
      occupationScore = OCCUPATION_SCORES.business_owner;
      break;
    case "Not Employed":
      occupationScore = OCCUPATION_SCORES.not_employed;
      break;
    case "Student":
      occupationScore = OCCUPATION_SCORES.student;
      break;
    default:
      occupationScore = OCCUPATION_SCORES.default_score;
      break;
  }

  console.log("occupation score: ", occupationScore);

  // Calculate scores for other factors
  const outstandingLoansScore = Math.max(0, 100 - 5 * outstandingLoans);
  const clearedLoansScore = 10 * clearedLoans;
  const defaultedLoansScore = -15 * defaultedLoans;

  // Calculate the weighted credit score
  const creditScore =
    WEIGHTS.OCCUPATION * occupationScore +
    WEIGHTS.OUTSTANDING_LOANS * outstandingLoansScore +
    WEIGHTS.CLEARED_LOANS * clearedLoansScore +
    WEIGHTS.DEFAULTED_LOANS * defaultedLoansScore;

  // Ensure the score is within the 0-100 range
  const finalCreditScore = Math.max(0, Math.min(100, creditScore));

  return finalCreditScore;
}

module.exports = calculateCreditScore;
