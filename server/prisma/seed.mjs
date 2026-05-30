// Idempotent seed for a fresh PostgreSQL database (e.g. a new Railway deploy
// where there is no SQLite file to import). Safe to run multiple times.
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_BRANCHES = [
  { name: 'FoneWorld Derby', address: '123 High Street, Derby, DE1 1AA', phone: '01332 123456' },
  { name: 'FoneWorld London', address: 'Oxford Street, London', phone: '020 123456' },
  { name: 'FoneWorld Manchester', address: 'Market Street, Manchester', phone: '0161 123456' }
];

async function main() {
  // Default admin user (admin / admin123)
  const existingAdmin = await prisma.adminUser.findUnique({ where: { username: 'admin' } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.adminUser.create({ data: { username: 'admin', password: hashedPassword } });
    console.log('Created default admin user (admin / admin123).');
  } else {
    console.log('Admin user already exists, skipping.');
  }

  // Base branches (only if there are none yet)
  const branchCount = await prisma.branch.count();
  if (branchCount === 0) {
    for (const branch of DEFAULT_BRANCHES) {
      await prisma.branch.create({ data: branch });
    }
    console.log(`Created ${DEFAULT_BRANCHES.length} default branches.`);
  } else {
    console.log(`Branches already exist (${branchCount}), skipping.`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
