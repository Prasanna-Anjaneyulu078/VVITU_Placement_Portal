/**
 * Utility to parse college roll numbers and calculate alumni registration eligibility.
 * 
 * Rules:
 * - Regular: Contains '1A' (Duration: 4 years)
 * - Lateral: Contains '5A' (Duration: 3 years)
 * - Admission Year: First 2 digits (e.g., '23' -> 2023)
 * - Expected Graduation Completion Date: 31 May of Admission Year + Duration
 * - Registration is ALLOWED only starting 1 June of Expected Graduation Year (currentDate > 31 May)
 */

export function parseRollNumberAndEligibility(rollNumber, currentDate = new Date()) {
  if (!rollNumber || typeof rollNumber !== 'string') {
    return {
      isValid: false,
      isEligible: false,
      studentType: null,
      admissionYear: null,
      expectedGraduationYear: null,
      graduationCompletionDateStr: null,
      message: 'Please enter a valid roll number.'
    };
  }

  const cleanRoll = rollNumber.trim().toUpperCase();

  // Must start with 2 digits
  if (!/^\d{2}/.test(cleanRoll)) {
    return {
      isValid: false,
      isEligible: false,
      studentType: null,
      admissionYear: null,
      expectedGraduationYear: null,
      graduationCompletionDateStr: null,
      message: 'Roll number must start with a 2-digit admission year (e.g. 23BQ1A5401).'
    };
  }

  const yearPrefix = parseInt(cleanRoll.substring(0, 2), 10);
  if (isNaN(yearPrefix)) {
    return {
      isValid: false,
      isEligible: false,
      message: 'Invalid admission year prefix.'
    };
  }

  const admissionYear = 2000 + yearPrefix;
  const isRegular = cleanRoll.includes('1A');
  const isLateral = cleanRoll.includes('5A');

  if (!isRegular && !isLateral) {
    return {
      isValid: false,
      isEligible: false,
      studentType: null,
      admissionYear,
      expectedGraduationYear: null,
      graduationCompletionDateStr: null,
      message: "Roll number must contain '1A' (Regular) or '5A' (Lateral Entry)."
    };
  }

  const studentType = isRegular ? 'Regular' : 'Lateral Entry';
  const durationYears = isRegular ? 4 : 3;
  const expectedGraduationYear = admissionYear + durationYears;
  
  // Graduation Completion Date = 31 May of expectedGraduationYear
  const graduationCompletionDate = new Date(expectedGraduationYear, 4, 31, 23, 59, 59, 999); // Month index 4 is May
  const graduationCompletionDateStr = `31 May ${expectedGraduationYear}`;

  // Eligible ONLY starting 1 June of expectedGraduationYear (currentDate > 31 May)
  const isEligible = currentDate > graduationCompletionDate;

  const message = isEligible
    ? 'Graduation completed. Eligible for Alumni registration.'
    : `Your graduation is not yet completed. Alumni registration is available only after successful completion of your degree (after 31 May ${expectedGraduationYear}).`;

  return {
    isValid: true,
    isEligible,
    studentType,
    admissionYear,
    expectedGraduationYear,
    graduationCompletionDateStr,
    message
  };
}
