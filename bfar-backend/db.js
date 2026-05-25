// bfar-backend/db.js
const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

// Establish the connection once here
const adapter = new PrismaMariaDb({
  host: '192.168.20.16',
  port: 3306,
  user: 'admin',
  password: 'fisheries_2022',
  database: 'timekeep',
  connectionLimit: 5
});

const prisma = new PrismaClient({ adapter });

// Export it so any other file can use it!
module.exports = prisma;