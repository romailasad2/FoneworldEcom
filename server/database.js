
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

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

    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));

    this.run = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              lastID: this.lastID,
              changes: this.changes,
            });
          }
        });
      });
    };
  }

  async init() {
    try {
      // PRODUCTS TABLE
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

      // BRANCHES TABLE
      await this.run(`
        CREATE TABLE IF NOT EXISTS branches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          address TEXT NOT NULL,
          phone TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // ADMIN USERS TABLE
      await this.run(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // BRANCH USERS TABLE
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

      // INSERT BRANCHES
      const branchCount = await this.get(
        'SELECT COUNT(*) as count FROM branches'
      );

      if (branchCount.count === 0) {
        const branches = [
          ['FoneWorld Derby', '123 High Street, Derby', '01332 123456'],
          ['FoneWorld London', 'Oxford Street, London', '020 123456'],
          ['FoneWorld Manchester', 'Market Street, Manchester', '0161 123456'],
        ];

        for (const [name, address, phone] of branches) {
          await this.run(
            'INSERT INTO branches (name, address, phone) VALUES (?, ?, ?)',
            [name, address, phone]
          );
        }
      }

      // INSERT ADMIN USER
      const adminCount = await this.get(
        'SELECT COUNT(*) as count FROM admin_users'
      );

      if (adminCount.count === 0) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);

        await this.run(
          'INSERT INTO admin_users (username, password) VALUES (?, ?)',
          ['admin', hashedPassword]
        );
      }

      // INSERT SAMPLE PRODUCTS
      const productCount = await this.get(
        'SELECT COUNT(*) as count FROM products'
      );

      if (productCount.count === 0) {
        const sampleProducts = [
          [
            'iPhone 15 Pro Max',
            'Apple',
            1199,
            'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
            '256GB',
            'Titanium Blue',
            1,
            15,
            'Latest iPhone with A17 Pro chip'
          ],
          [
            'Samsung Galaxy S24 Ultra',
            'Samsung',
            1299,
            'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
            '512GB',
            'Black',
            2,
            10,
            'Premium Android flagship'
          ],
          [
            'Google Pixel 8 Pro',
            'Google',
            999,
            'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400',
            '256GB',
            'Obsidian',
            3,
            8,
            'Best camera phone'
          ]
        ];

        for (const product of sampleProducts) {
          await this.run(
            `INSERT INTO products 
            (name, brand, price, image, storage, color, branchId, stock, grade, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              product[0],
              product[1],
              product[2],
              product[3],
              product[4],
              product[5],
              product[6],
              product[7],
              'A',
              product[8]
            ]
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

