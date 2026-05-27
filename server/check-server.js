// Quick script to check if server dependencies are installed
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Checking server setup...\n');

// Check if node_modules exists
const nodeModulesExists = existsSync(join(__dirname, 'node_modules'));
if (!nodeModulesExists) {
  console.error('❌ node_modules not found!');
  console.log('\nPlease run: npm install\n');
  process.exit(1);
}

console.log('✅ node_modules found');

// Check if database file exists (optional, will be created on first run)
const dbExists = existsSync(join(__dirname, 'foneworld.db'));
if (dbExists) {
  console.log('✅ Database file exists');
} else {
  console.log('ℹ️  Database will be created on first run');
}

console.log('\n✅ Server setup looks good!');
console.log('\nTo start the server, run: npm start\n');


