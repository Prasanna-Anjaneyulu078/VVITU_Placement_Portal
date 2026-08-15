/**
 * Formats a raw user role to a human-readable label.
 * Example:
 * ADMIN / SUPER_ADMIN -> "Admin"
 * ALUMNI -> "Alumni"
 * STUDENT -> "Student"
 */
export function formatUserRole(role) {
  if (!role || typeof role !== 'string') return 'Admin';
  const u = role.trim().toUpperCase();
  if (u === 'ALUMNI') return 'Alumni';
  if (u === 'ADMIN' || u === 'SUPER_ADMIN') return 'Admin';
  if (u === 'STUDENT') return 'Student';
  return role.trim();
}

/**
 * Extracts poster information from a job object.
 * Returns: { name, role, formattedRole, displayText, profileImageUrl }
 */
export function getPosterInfo(job) {
  if (!job) {
    return {
      name: 'Unknown User',
      role: 'ADMIN',
      formattedRole: 'Admin',
      displayText: 'Posted by: Unknown User • Admin',
      profileImageUrl: null
    };
  }

  const postedBy = job.postedBy;
  let name = null;
  let rawRole = null;
  let profileImageUrl = null;

  if (typeof postedBy === 'object' && postedBy !== null) {
    name = postedBy.name;
    rawRole = postedBy.role || postedBy.type;
    profileImageUrl = postedBy.profileImageUrl || null;
  }

  // Fallback to legacy/flat job properties if object missing
  if (!name || typeof name !== 'string') {
    name = job.postedByName || (typeof job.postedBy === 'string' ? job.postedBy : null);
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    name = 'VVIT Placement Cell';
  }

  if (!rawRole) {
    rawRole = job.postedByRole || job.postedByType || (job.postedByAlumniId ? 'ALUMNI' : 'ADMIN');
  }

  const formattedRole = formatUserRole(rawRole);
  const cleanName = name.trim();

  return {
    name: cleanName,
    role: rawRole,
    formattedRole,
    displayText: `Posted by: ${cleanName} • ${formattedRole}`,
    profileImageUrl
  };
}
