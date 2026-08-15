const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://vvitu_placement_portal_user:QuwJCeVOEZ9TEXJew0Yy8hywtYIA246D@dpg-d9usn6ajobas73bmdnvg-a.virginia-postgres.render.com/vvitu_placement_portal'
    }
  }
});

async function main() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Connected successfully!");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
