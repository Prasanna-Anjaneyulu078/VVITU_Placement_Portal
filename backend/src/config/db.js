const { PrismaClient } = require('@prisma/client');
const env = require('./env');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.databaseUrl
    }
  }
});

// Polyfill BigInt JSON serialization for Prisma BigInt IDs
BigInt.prototype.toJSON = function () {
  return Number(this);
};

module.exports = prisma;
