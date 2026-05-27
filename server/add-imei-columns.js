// Migration script to add IMEI/Serial tracking columns
import db from './database.js';

async function addColumns() {
  try {
    console.log('Checking for missing columns...');
    
    const tableInfo = await db.all("PRAGMA table_info(products)");
    const columnNames = tableInfo.map(col => col.name);
    
    console.log('Existing columns:', columnNames);
    
    const columnsToAdd = [
      { name: 'productType', sql: 'ALTER TABLE products ADD COLUMN productType TEXT DEFAULT "Phone"' },
      { name: 'imeiOrSerial', sql: 'ALTER TABLE products ADD COLUMN imeiOrSerial TEXT' },
      { name: 'isSold', sql: 'ALTER TABLE products ADD COLUMN isSold INTEGER DEFAULT 0' },
      { name: 'soldDate', sql: 'ALTER TABLE products ADD COLUMN soldDate DATETIME' },
      { name: 'repurchasedDate', sql: 'ALTER TABLE products ADD COLUMN repurchasedDate DATETIME' }
    ];
    
    for (const column of columnsToAdd) {
      if (!columnNames.includes(column.name)) {
        console.log(`Adding column: ${column.name}...`);
        await db.run(column.sql);
        console.log(`✅ Added column: ${column.name}`);
      } else {
        console.log(`✅ Column ${column.name} already exists`);
      }
    }
    
    // Create unique index for IMEI/Serial
    try {
      await db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_imei_serial ON products(imeiOrSerial) WHERE imeiOrSerial IS NOT NULL');
      console.log('✅ Unique index created for imeiOrSerial');
    } catch (e) {
      console.log('Index creation skipped (may already exist)');
    }
    
    console.log('\n✅ Migration completed successfully!');
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    await db.close();
    process.exit(1);
  }
}

addColumns();


