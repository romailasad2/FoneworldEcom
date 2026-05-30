// One-time data migration: copies all rows from the legacy SQLite database
// (server/foneworld.db) into PostgreSQL via Prisma, preserving primary keys.
// The SQLite file is opened READ-ONLY and never modified.
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlitePath = path.join(__dirname, '..', 'foneworld.db');

const prisma = new PrismaClient();

// Tolerant date parser: handles both 'YYYY-MM-DD HH:MM:SS' (SQLite CURRENT_TIMESTAMP, UTC)
// and ISO strings (from new Date().toISOString()).
function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;
  let d = new Date(value);
  if (isNaN(d.getTime())) {
    d = new Date(String(value).replace(' ', 'T') + 'Z');
  }
  return isNaN(d.getTime()) ? null : d;
}

function openSqlite() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sqlitePath, sqlite3.OPEN_READONLY, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function allRows(db, sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

async function resetSequence(table) {
  // Prisma autoincrement on Postgres uses a sequence named "<table>_id_seq".
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "${table}"))`
  );
}

async function main() {
  console.log('Opening SQLite (read-only):', sqlitePath);
  const sqlite = await openSqlite();

  const branches = await allRows(sqlite, 'SELECT * FROM branches');
  const adminUsers = await allRows(sqlite, 'SELECT * FROM admin_users');
  const branchUsers = await allRows(sqlite, 'SELECT * FROM branch_users');
  const products = await allRows(sqlite, 'SELECT * FROM products');

  sqlite.close();

  const validBranchIds = new Set(branches.map((b) => b.id));

  console.log(`Found: ${branches.length} branches, ${adminUsers.length} admin users, ${branchUsers.length} branch users, ${products.length} products`);

  // Branches
  for (const b of branches) {
    const data = {
      id: b.id,
      name: b.name,
      address: b.address,
      phone: b.phone,
      createdAt: parseDate(b.createdAt) ?? new Date()
    };
    await prisma.branch.upsert({ where: { id: b.id }, update: data, create: data });
  }
  console.log('Branches migrated.');

  // Admin users
  for (const a of adminUsers) {
    const data = {
      id: a.id,
      username: a.username,
      password: a.password,
      createdAt: parseDate(a.createdAt) ?? new Date()
    };
    await prisma.adminUser.upsert({ where: { id: a.id }, update: data, create: data });
  }
  console.log('Admin users migrated.');

  // Branch users (orphaned branchId -> null)
  let orphaned = 0;
  for (const u of branchUsers) {
    const resolvedBranchId = validBranchIds.has(u.branchId) ? u.branchId : null;
    if (resolvedBranchId === null && u.branchId != null) orphaned++;
    const data = {
      id: u.id,
      branchId: resolvedBranchId,
      username: u.username,
      password: u.password,
      createdAt: parseDate(u.createdAt) ?? new Date()
    };
    await prisma.branchUser.upsert({ where: { id: u.id }, update: data, create: data });
  }
  console.log(`Branch users migrated (${orphaned} orphaned branchId set to null).`);

  // Products
  for (const p of products) {
    const data = {
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      image: p.image ?? null,
      storage: p.storage,
      color: p.color,
      branchId: p.branchId,
      stock: p.stock ?? 0,
      rating: p.rating ?? null,
      grade: p.grade ?? 'A',
      description: p.description ?? null,
      productType: p.productType ?? 'Phone',
      imeiOrSerial: p.imeiOrSerial ?? null,
      isSold: p.isSold ?? 0,
      soldDate: parseDate(p.soldDate),
      repurchasedDate: parseDate(p.repurchasedDate),
      createdAt: parseDate(p.createdAt) ?? new Date(),
      updatedAt: parseDate(p.updatedAt) ?? new Date()
    };
    await prisma.product.upsert({ where: { id: p.id }, update: data, create: data });
  }
  console.log('Products migrated.');

  // Fix sequences so new inserts do not collide with imported IDs.
  await resetSequence('branches');
  await resetSequence('admin_users');
  await resetSequence('branch_users');
  await resetSequence('products');
  console.log('Sequences reset.');

  // Report final counts
  const [bc, ac, uc, pc] = await Promise.all([
    prisma.branch.count(),
    prisma.adminUser.count(),
    prisma.branchUser.count(),
    prisma.product.count()
  ]);
  console.log(`Done. PostgreSQL now has: ${ac} admin, ${bc} branches, ${uc} branch users, ${pc} products.`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
