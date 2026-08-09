const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const testCases = [
  'Venkata Prasanna Anjaneyulu Borigorla',
  'Garikapati Ashritha',
  'John Doe',
  'ADMIN USER',
  'ADMIN'
];

console.log('--- TESTING USER SPECIFIC TEST CASES ---');
testCases.forEach(name => {
  console.log(`Name: "${name}" => Initials: "${getInitials(name)}"`);
});
