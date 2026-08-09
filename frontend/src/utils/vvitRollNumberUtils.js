/**
 * Validates VVIT roll number format.
 *
 * VVIT roll number rules:
 * - Must contain 'BQ' (case-insensitive)
 * - Should be stored in uppercase
 * - Examples: 23BQ1A5401, 24BQ5A5403
 *
 * Returns:
 * - isValid: boolean
 * - message: error message if invalid, success message if valid
 * - normalized: uppercase roll number
 */
export function validateVVITRollNumber(rollNumber) {
  if (!rollNumber || typeof rollNumber !== 'string') {
    return {
      isValid: false,
      message: 'Please enter a roll number.',
      normalized: ''
    };
  }

  // Trim and convert to uppercase
  const normalized = rollNumber.trim().toUpperCase();

  if (normalized.length === 0) {
    return {
      isValid: false,
      message: 'Please enter a roll number.',
      normalized: ''
    };
  }

  // Check if contains 'BQ'
  if (!normalized.includes('BQ')) {
    return {
      isValid: false,
      message: 'Only VVIT students with a valid VVIT roll number can be added.',
      normalized
    };
  }

  return {
    isValid: true,
    message: 'Valid VVIT roll number',
    normalized
  };
}

export default validateVVITRollNumber;