const generateStudentDefaultPassword = (rollNumber) => {
  if (!rollNumber || typeof rollNumber !== 'string' || rollNumber.trim().length === 0) {
    throw new Error('Invalid roll number provided for default password generation.');
  }

  const cleanRoll = rollNumber.trim().toUpperCase();

  if (cleanRoll.length < 6) {
    throw new Error('Roll number must be at least 6 characters long.');
  }

  const firstTwo = cleanRoll.substring(0, 2);
  const lastFour = cleanRoll.substring(cleanRoll.length - 4);

  return `vvitu@${firstTwo}${lastFour}`;
};

module.exports = {
  generateStudentDefaultPassword
};
