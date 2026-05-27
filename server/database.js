import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'foneworld.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.init();
      }
    });

    // Promisify database methods
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
    
    // Custom run method that returns lastID and changes
    this.run = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              lastID: this.lastID,
              changes: this.changes
            });
          }
        });
      });
    };
  }

  async init() {
    try {
      // Create products table
      await this.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          brand TEXT NOT NULL,
          price REAL NOT NULL,
          image TEXT,
          storage TEXT NOT NULL,
          color TEXT NOT NULL,
          branchId INTEGER NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          grade TEXT DEFAULT 'A',
          description TEXT,
          productType TEXT DEFAULT 'Phone',
          imeiOrSerial TEXT UNIQUE,
          isSold INTEGER DEFAULT 0,
          soldDate DATETIME,
          repurchasedDate DATETIME,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migrate existing rating column to grade if it exists
      try {
        const tableInfo = await this.all("PRAGMA table_info(products)");
        const hasRating = tableInfo.some(col => col.name === 'rating');
        const hasGrade = tableInfo.some(col => col.name === 'grade');
        const hasProductType = tableInfo.some(col => col.name === 'productType');
        const hasImeiOrSerial = tableInfo.some(col => col.name === 'imeiOrSerial');
        const hasIsSold = tableInfo.some(col => col.name === 'isSold');
        const hasSoldDate = tableInfo.some(col => col.name === 'soldDate');
        const hasRepurchasedDate = tableInfo.some(col => col.name === 'repurchasedDate');
        
        if (hasRating && !hasGrade) {
          await this.run('ALTER TABLE products ADD COLUMN grade TEXT DEFAULT "A"');
          await this.run('UPDATE products SET grade = "A" WHERE grade IS NULL');
        }
        
        // Add new columns for IMEI/Serial tracking
        if (!hasProductType) {
          await this.run('ALTER TABLE products ADD COLUMN productType TEXT DEFAULT "Phone"');
        }
        if (!hasImeiOrSerial) {
          console.log('Adding imeiOrSerial column to products table...');
          await this.run('ALTER TABLE products ADD COLUMN imeiOrSerial TEXT');
          console.log('✅ imeiOrSerial column added successfully');
          // Create unique index for IMEI/Serial (SQLite doesn't support ADD UNIQUE in ALTER TABLE)
          try {
            await this.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_imei_serial ON products(imeiOrSerial) WHERE imeiOrSerial IS NOT NULL');
            console.log('✅ Unique index created for imeiOrSerial');
          } catch (e) {
            // Index might already exist, ignore
            console.log('Index creation skipped (may already exist)');
          }
        } else {
          console.log('✅ imeiOrSerial column already exists');
        }
        if (!hasIsSold) {
          await this.run('ALTER TABLE products ADD COLUMN isSold INTEGER DEFAULT 0');
        }
        if (!hasSoldDate) {
          await this.run('ALTER TABLE products ADD COLUMN soldDate DATETIME');
        }
        if (!hasRepurchasedDate) {
          await this.run('ALTER TABLE products ADD COLUMN repurchasedDate DATETIME');
        }
      } catch (error) {
        // Table might not exist yet, that's okay
        console.error('Migration error:', error);
      }

      // Create branches table
      await this.run(`
        CREATE TABLE IF NOT EXISTS branches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          address TEXT NOT NULL,
          phone TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create admin_users table
      await this.run(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create branch_users table for branch logins
      await this.run(`
        CREATE TABLE IF NOT EXISTS branch_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          branchId INTEGER NOT NULL,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE CASCADE
        )
      `);

      // Insert default branches if they don't exist
      const branchCount = await this.get('SELECT COUNT(*) as count FROM branches');
      if (branchCount.count === 0) {
        const branches = [
          ['FoneWorld Derby', '123 High Street, Derby, DE1 1AA', '01332 123456'],
          ['FoneWorld Peterborough', '456 Queensgate Centre, Peterborough, PE1 1NT', '01733 234567'],
          ['FoneWorld Colchester', '789 High Street, Colchester, CO1 1DH', '01206 345678'],
          ['FoneWorld Westfield London', 'Unit 123, Westfield London, W12 7GF', '020 3456 7890'],
          ['FoneWorld Poole', '321 Dolphin Centre, Poole, BH15 1SZ', '01202 456789'],
          ['FoneWorld Bath', '654 Southgate Street, Bath, BA1 1AQ', '01225 567890'],
          ['FoneWorld Bluewater', 'Unit 456, Bluewater Shopping Centre, DA9 9ST', '01322 678901'],
          ['FoneWorld Bracknell', '147 The Lexicon, Bracknell, RG12 1AL', '01344 789012'],
          ['FoneWorld Bournemouth', '258 Old Christchurch Road, Bournemouth, BH1 1PH', '01202 890123'],
          ['FoneWorld Weymouth', '369 St Mary Street, Weymouth, DT4 8NN', '01305 901234'],
          ['FoneWorld Dorchester', '147 South Street, Dorchester, DT1 1BD', '01305 012345'],
          ['FoneWorld Oxford', '258 Cornmarket Street, Oxford, OX1 3HF', '01865 123456'],
          ['FoneWorld Witney', '369 High Street, Witney, OX28 6JA', '01993 234567'],
          ['FoneWorld Merry Hill', 'Unit 147, Merry Hill Shopping Centre, DY5 1QX', '01384 345678'],
          ['iAccessories Bournemouth', '456 Commercial Road, Bournemouth, BH2 5RP', '01202 456789'],
          ['FoneTech Poole', '789 High Street, Poole, BH15 1BA', '01202 567890']
        ];

        for (const [name, address, phone] of branches) {
          await this.run('INSERT INTO branches (name, address, phone) VALUES (?, ?, ?)', [name, address, phone]);
        }
      }

      // Insert default admin user if it doesn't exist
      const adminCount = await this.get('SELECT COUNT(*) as count FROM admin_users');
      if (adminCount.count === 0) {
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hashSync('admin123', 10);
        await this.run('INSERT INTO admin_users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
        console.log('Default admin user created: username=admin, password=admin123');
      }

      // Insert sample products if they don't exist
      const productCount = await this.get('SELECT COUNT(*) as count FROM products');
      if (productCount.count === 0) {
        const sampleProducts = [
          ['iPhone 15 Pro Max', 'Apple', 1199, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', '256GB', 'Titanium Blue', 1, 15, 4.8, 'Latest iPhone with A17 Pro chip and titanium design'],
          ['Samsung Galaxy S24 Ultra', 'Samsung', 1299, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', '512GB', 'Titanium Black', 2, 12, 4.7, 'Premium Android flagship with S Pen support'],
          ['Google Pixel 8 Pro', 'Google', 999, 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400', '256GB', 'Obsidian', 3, 8, 4.6, 'Best camera phone with AI features'],
          ['OnePlus 12', 'OnePlus', 799, 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400', '256GB', 'Silky Black', 4, 20, 4.5, 'Fast charging and smooth performance'],
          ['Xiaomi 14 Pro', 'Xiaomi', 699, 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400', '512GB', 'Black', 5, 18, 4.4, 'Flagship features at competitive price']
        ];

        for (const product of sampleProducts) {
          await this.run(
            'INSERT INTO products (name, brand, price, image, storage, color, branchId, stock, rating, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            product
          );
        }
      }

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export default new Database();

