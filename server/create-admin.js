// Script to create or reset admin user
import db from './database.js';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    // Check if admin exists
    const existingAdmin = await db.get('SELECT * FROM admin_users WHERE username = ?', ['admin']);
    
    if (existingAdmin) {
      console.log('Admin user already exists. Resetting password...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.run('UPDATE admin_users SET password = ? WHERE username = ?', [hashedPassword, 'admin']);
      console.log('✅ Admin password reset successfully!');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('Creating new admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.run('INSERT INTO admin_users (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
      console.log('✅ Admin user created successfully!');
      console.log('Username: admin');
      console.log('Password: admin123');
    }
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();


