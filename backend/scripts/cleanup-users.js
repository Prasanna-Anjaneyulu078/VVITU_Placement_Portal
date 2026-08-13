const readline = require('readline');
const prisma = require('../src/config/db');
const env = require('../src/config/env');

const PROTECTED_EMAILS = [
  'admin@vvit.edu.in',
  'prasannaanjaneyulu078@gmail.com'
];

async function confirmInteractive() {
  if (process.argv.includes('--force') || process.env.FORCE_CLEANUP === 'true') {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\nDATABASE CLEANUP');
  console.log('This operation permanently deletes all users except:');
  console.log('- admin@vvit.edu.in (ADMIN)');
  console.log('- prasannaanjaneyulu078@gmail.com (STUDENT)\n');

  return new Promise((resolve) => {
    rl.question('Type DELETE_USERS to continue: ', (answer) => {
      rl.close();
      if (answer.trim() === 'DELETE_USERS') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

async function main() {
  console.log('=== ENVIRONMENT PROTECTION CHECK ===');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`PORT: ${env.port || 8082}`);

  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Database cleanup cannot be run in PRODUCTION mode. Aborting.');
    process.exit(1);
  }

  // 1. Locate Protected Accounts
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@vvit.edu.in' },
    include: { adminProfile: true }
  });

  const studentUser = await prisma.user.findFirst({
    where: { email: 'prasannaanjaneyulu078@gmail.com' },
    include: {
      student: {
        include: {
          skills: true,
          projects: true,
          resumes: true,
          applications: true
        }
      }
    }
  });

  console.log('\n=== PROTECTED ACCOUNTS ===');
  if (adminUser) {
    console.log(`ADMIN   ID: ${adminUser.id} | Email: ${adminUser.email} | Role: ${adminUser.role}`);
  } else {
    console.error('CRITICAL ERROR: Protected account admin@vvit.edu.in is MISSING!');
  }

  if (studentUser) {
    console.log(`STUDENT ID: ${studentUser.id} | Email: ${studentUser.email} | Role: ${studentUser.role}`);
  } else {
    console.error('CRITICAL ERROR: Protected account prasannaanjaneyulu078@gmail.com is MISSING!');
  }

  if (!adminUser || !studentUser) {
    console.error('\nSAFETY STOP: One or both protected accounts are missing. Aborting deletion immediately.');
    process.exit(1);
  }

  // 2. Identify Accounts to Delete
  const usersToDelete = await prisma.user.findMany({
    where: {
      email: {
        notIn: PROTECTED_EMAILS
      }
    },
    include: {
      student: true,
      alumni: true,
      adminProfile: true
    }
  });

  const countsByRole = {
    SUPER_ADMIN: usersToDelete.filter((u) => u.role === 'SUPER_ADMIN').length,
    ADMIN: usersToDelete.filter((u) => u.role === 'ADMIN').length,
    STUDENT: usersToDelete.filter((u) => u.role === 'STUDENT').length,
    ALUMNI: usersToDelete.filter((u) => u.role === 'ALUMNI').length,
    OTHER: usersToDelete.filter((u) => !['SUPER_ADMIN', 'ADMIN', 'STUDENT', 'ALUMNI'].includes(u.role)).length
  };

  console.log(`\nAccounts to delete: ${usersToDelete.length}`);
  console.log(`- SUPERADMIN: ${countsByRole.SUPER_ADMIN}`);
  console.log(`- ADMIN (extra): ${countsByRole.ADMIN}`);
  console.log(`- STUDENT (extra): ${countsByRole.STUDENT}`);
  console.log(`- ALUMNI: ${countsByRole.ALUMNI}`);
  if (countsByRole.OTHER > 0) console.log(`- OTHER: ${countsByRole.OTHER}`);

  if (usersToDelete.length === 0) {
    console.log('\nDatabase is already clean! Only the 2 protected accounts exist.');
    return;
  }

  // 3. Confirm Deletion
  const confirmed = await confirmInteractive();
  if (!confirmed) {
    console.log('\nCleanup aborted. Database was not modified.');
    process.exit(0);
  }

  console.log('\nExecuting permanent cleanup transaction...');

  const deleteUserIds = usersToDelete.map((u) => u.id);
  const deleteStudentIds = usersToDelete.filter((u) => u.student).map((u) => u.student.id);
  const deleteAlumniIds = usersToDelete.filter((u) => u.alumni).map((u) => u.alumni.id);

  // Find jobs posted by deleted alumni
  const jobsToDelete = await prisma.job.findMany({
    where: {
      postedByAlumniId: { in: deleteAlumniIds }
    }
  });
  const deleteJobIds = jobsToDelete.map((j) => j.id);

  // Find applications linked to deleted students OR deleted jobs
  const applicationsToDelete = await prisma.application.findMany({
    where: {
      OR: [
        { studentId: { in: deleteStudentIds } },
        { jobId: { in: deleteJobIds } }
      ]
    }
  });
  const deleteAppIds = applicationsToDelete.map((a) => a.id);

  // Execute Transaction
  await prisma.$transaction(async (tx) => {
    if (deleteAppIds.length > 0) {
      await tx.applicationScreeningAnswer.deleteMany({
        where: { applicationId: { in: deleteAppIds } }
      });
      await tx.application.deleteMany({
        where: { id: { in: deleteAppIds } }
      });
    }

    if (deleteStudentIds.length > 0) {
      await tx.studentSkill.deleteMany({
        where: { studentId: { in: deleteStudentIds } }
      });
      await tx.studentProject.deleteMany({
        where: { studentId: { in: deleteStudentIds } }
      });
      await tx.resume.deleteMany({
        where: { studentId: { in: deleteStudentIds } }
      });
      await tx.student.deleteMany({
        where: { id: { in: deleteStudentIds } }
      });
    }

    if (deleteJobIds.length > 0 || deleteAlumniIds.length > 0) {
      await tx.job.deleteMany({
        where: {
          OR: [
            { id: { in: deleteJobIds } },
            { postedByAlumniId: { in: deleteAlumniIds } }
          ]
        }
      });
    }

    if (deleteAlumniIds.length > 0) {
      await tx.alumni.deleteMany({
        where: { id: { in: deleteAlumniIds } }
      });
    }

    await tx.adminProfile.deleteMany({
      where: { userId: { in: deleteUserIds } }
    });

    await tx.auditLog.deleteMany({
      where: { performedBy: { in: deleteUserIds } }
    });

    await tx.ocrAuditLog.deleteMany({
      where: { performedBy: { in: deleteUserIds } }
    });

    await tx.user.deleteMany({
      where: {
        id: { in: deleteUserIds },
        email: { notIn: PROTECTED_EMAILS }
      }
    });
  });

  // 4. Verification
  const remainingUsers = await prisma.user.findMany({
    include: { student: true, alumni: true, adminProfile: true }
  });

  console.log('\n=== FINAL VERIFICATION ===');
  console.log(`TOTAL USERS = ${remainingUsers.length}`);

  remainingUsers.forEach((u) => {
    console.log(`✓ ID: ${u.id} | Email: ${u.email} | Role: ${u.role}`);
  });

  const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
  const alumniCount = await prisma.user.count({ where: { role: 'ALUMNI' } });
  const orphanStudents = await prisma.student.count({ where: { userId: { notIn: remainingUsers.map((u) => u.id) } } });
  const orphanAlumni = await prisma.alumni.count({ where: { userId: { notIn: remainingUsers.map((u) => u.id) } } });

  console.log(`\n- SUPERADMIN count: ${superAdminCount}`);
  console.log(`- ALUMNI count: ${alumniCount}`);
  console.log(`- Orphan Students: ${orphanStudents}`);
  console.log(`- Orphan Alumni: ${orphanAlumni}`);

  if (remainingUsers.length === 2 && superAdminCount === 0 && alumniCount === 0) {
    console.log('\n✓ Database cleanup completed successfully! Exactly 2 protected accounts remain.');
  } else {
    console.error('\nWARNING: Unexpected remaining count after cleanup!');
  }
}

main()
  .catch((e) => {
    console.error('Cleanup transaction failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
