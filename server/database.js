import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across hot-reloads in development.
const globalForPrisma = globalThis;

const prisma = globalForPrisma.__fonePrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__fonePrisma = prisma;
}

// Backwards-compatible shutdown helper used by server.js.
prisma.close = () => prisma.$disconnect();

export default prisma;
