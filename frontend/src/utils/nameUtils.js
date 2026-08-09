/**
 * Converts a name string to Title Case.
 * Handles all-caps, all-lowercase, and mixed-case inputs.
 *
 * Examples:
 *   "hari krishna reddy"  -> "Hari Krishna Reddy"
 *   "PRASANNA ANJANEYULU" -> "Prasanna Anjaneyulu"
 *   "sAI kUMAr"           -> "Sai Kumar"
 *
 * @param {string} name - The name string to format.
 * @returns {string} The name in Title Case, or the original value if not a non-empty string.
 */
export const toTitleCase = (name) => {
  if (!name || typeof name !== 'string') return name;
  return name
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
