/**
 * Safely resolves user display name from strings or objects.
 */
export const getDisplayName = (userOrName) => {
  if (!userOrName) return '';
  if (typeof userOrName === 'string') {
    const trimmed = userOrName.trim();
    if (['null', 'undefined', '[object object]', 'user', 'unknown'].includes(trimmed.toLowerCase())) return '';
    return trimmed;
  }
  
  if (typeof userOrName === 'object') {
    if (userOrName.name && typeof userOrName.name === 'string') return getDisplayName(userOrName.name);
    if (userOrName.fullName && typeof userOrName.fullName === 'string') return getDisplayName(userOrName.fullName);
    if (userOrName.full_name && typeof userOrName.full_name === 'string') return getDisplayName(userOrName.full_name);
    if (userOrName.studentName && typeof userOrName.studentName === 'string') return getDisplayName(userOrName.studentName);
    if (userOrName.alumniName && typeof userOrName.alumniName === 'string') return getDisplayName(userOrName.alumniName);
    if (userOrName.firstName || userOrName.lastName) {
      return `${userOrName.firstName || ''} ${userOrName.lastName || ''}`.trim();
    }
    if (userOrName.user) return getDisplayName(userOrName.user);
    if (userOrName.student) return getDisplayName(userOrName.student);
    if (userOrName.alumni) return getDisplayName(userOrName.alumni);
    if (userOrName.profile) return getDisplayName(userOrName.profile);
  }

  return '';
};

/**
 * Extracts first + last name initials from a full name string or user object.
 * Examples:
 * - "Venkata Prasanna Anjaneyulu Borigorla" -> "VB"
 * - "Gangavarapu Satish Kumar" -> "GK"
 * - "Satish Kumar" -> "SK"
 * - "John Michael Doe" -> "JD"
 * - "Prasanna" -> "P"
 * - "   Satish   Kumar   " -> "SK"
 * - null / undefined / "" -> "?"
 */
export const getInitials = (nameOrUser) => {
  const displayName = typeof nameOrUser === 'string' ? nameOrUser.trim() : getDisplayName(nameOrUser);
  if (!displayName) return '?';

  const parts = displayName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  const firstLetter = parts[0].charAt(0).toUpperCase();
  const lastLetter = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstLetter}${lastLetter}`;
};


