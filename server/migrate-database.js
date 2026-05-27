// Migration script to add grade column and remove rating if needed
import db from './database.js';

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Check if products table exists
    const tableInfo = await db.all("PRAGMA table_info(products)");
    
    if (tableInfo.length === 0) {
      console.log('Products table does not exist. It will be created on server start.');
      await db.close();
      return;
    }
    
    const hasRating = tableInfo.some(col => col.name === 'rating');
    const hasGrade = tableInfo.some(col => col.name === 'grade');
    
    if (hasRating && !hasGrade) {
      console.log('Adding grade column...');
      await db.run('ALTER TABLE products ADD COLUMN grade TEXT DEFAULT "A"');
      await db.run('UPDATE products SET grade = "A" WHERE grade IS NULL');
      console.log('✅ Grade column added successfully');
    } else if (hasGrade) {
      console.log('✅ Grade column already exists');
    }
    
    console.log('Migration completed successfully');
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await db.close();
    process.exit(1);
  }
}

migrate();


