const prisma = require('../src/config/db');

async function main() {
  const jobs = await prisma.job.findMany({
    include: {
      createdBy: {
        include: {
          adminProfile: true,
          alumni: true
        }
      },
      postedByAlumni: {
        include: {
          user: true
        }
      }
    }
  });

  console.log(`--- TOTAL JOBS IN DB: ${jobs.length} ---`);
  jobs.forEach((job) => {
    console.log({
      id: Number(job.id),
      title: job.title,
      companyName: job.companyName,
      createdById: job.createdById ? Number(job.createdById) : null,
      postedByAlumniId: job.postedByAlumniId ? Number(job.postedByAlumniId) : null,
      createdBy: job.createdBy ? {
        id: Number(job.createdBy.id),
        name: job.createdBy.name,
        email: job.createdBy.email,
        role: job.createdBy.role
      } : null,
      postedByAlumni: job.postedByAlumni ? {
        id: Number(job.postedByAlumni.id),
        userId: job.postedByAlumni.userId ? Number(job.postedByAlumni.userId) : null,
        name: job.postedByAlumni.user?.name || null,
        email: job.postedByAlumni.user?.email || null
      } : null
    });
  });

  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'ALUMNI'] } }
  });
  console.log('--- ADMIN & ALUMNI USERS IN DB ---');
  users.forEach((u) => {
    console.log({
      id: Number(u.id),
      name: u.name,
      email: u.email,
      role: u.role
    });
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
