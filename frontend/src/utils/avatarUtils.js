/**
 * Extracts first + last name initials from a full name string.
 * Example: "VENKATA PRASANNA ANJANEYULU" -> "VA"
 * Example: "GARIKAPATI ASHRITHA" -> "GA"
 * Example: "JOHN DOE" -> "JD"
 * Example: "ADMIN USER" -> "AU"
 * Example: "ADMIN" -> "A"
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Generates an SVG avatar with the user's initials as a Data URI.
 */
export const generateAvatarSVG = (name, bgColor = 'F47C20', textColor = 'ffffff', size = 256) => {
  let bgHex = 'F47C20';
  let textHex = 'ffffff';

  if (typeof bgColor === 'number') {
    bgHex = 'F47C20';
  } else if (typeof bgColor === 'string') {
    if (bgColor === 'random') {
      const colors = ['F47C20', '3B82F6', '10B981', '8B5CF6', 'EC4899', 'F59E0B'];
      const charCodeSum = String(name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      bgHex = colors[charCodeSum % colors.length];
    } else {
      bgHex = bgColor;
    }
  }

  if (typeof textColor === 'string') {
    textHex = textColor;
  }

  const initials = getInitials(name);
  const bg = String(bgHex).startsWith('#') ? String(bgHex) : `#${bgHex}`;
  const text = String(textHex).startsWith('#') ? String(textHex) : `#${textHex}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${bg}"/><text x="50" y="50" font-family="Inter, system-ui, -apple-system, sans-serif" font-size="40" font-weight="800" fill="${text}" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
