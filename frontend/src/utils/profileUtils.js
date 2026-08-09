export const calculateProfileCompletion = (profileData, resumeDetails) => {
  if (!profileData) return { percentage: 0, missingItems: [] };
  
  let score = 0;
  const missing = [];

  // Personal Info (20% total, 5% each)
  if (profileData.user?.name) score += 5; else missing.push('Name');
  if (profileData.user?.email) score += 5; else missing.push('Email');
  if (profileData.mobileNumber) score += 5; else missing.push('Mobile Number');
  if (profileData.location) score += 5; else missing.push('Location');

  // Professional Links (10% total, 5% each)
  if (profileData.githubUrl) score += 5; else missing.push('GitHub Profile');
  if (profileData.linkedinUrl) score += 5; else missing.push('LinkedIn Profile');

  // Academic Info (25% total: sem 6%, year 6%, cgpa 6%, backlogs 7%)
  if (profileData.semester) score += 6; else missing.push('Semester');
  if (profileData.academicYear) score += 6; else missing.push('Academic Year');
  if (profileData.cgpa) score += 6; else missing.push('CGPA');
  if (profileData.backlogs !== null && profileData.backlogs !== undefined) score += 7; else missing.push('Backlogs');

  // Skills (15%)
  if (profileData.skills && profileData.skills.length > 0) score += 15; else missing.push('Skills');

  // Projects (15%)
  if (profileData.projects && profileData.projects.length > 0) score += 15; else missing.push('Projects');

  // Resume (10%)
  if (resumeDetails) score += 10; else missing.push('Resume');

  // Profile Photo (5%)
  if (profileData.profileImageUrl) score += 5; else missing.push('Profile Photo');

  return {
    percentage: Math.min(100, Math.round(score)),
    missingItems: missing
  };
};
