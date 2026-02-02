import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db;

try {
  // Use /tmp for SQLite in Vercel environment as it's the only writable directory
  const dbPath = process.env.VERCEL ? join('/tmp', 'database.sqlite') : join(__dirname, 'database.sqlite');
  
  console.log('Attempting to initialize SQLite Database at', dbPath);
  db = new Database(dbPath);

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      clientName TEXT,
      niche TEXT,
      complexity TEXT,
      status TEXT DEFAULT 'analysis',
      analysis JSON,
      weeks JSON,
      answers JSON,
      projectType TEXT,
      documentation TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      contact JSON,
      stage TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      receivedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ SQLite Database initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize SQLite Database:', error.message);
  // Fallback to a mock DB object if needed to prevent crash, 
  // or re-throw if it's critical. For Vercel, we might need a different driver.
  if (process.env.VERCEL) {
    console.warn('⚠️ Running without persistent DB on Vercel');
  }
  throw error; // Still throwing to see the error in logs if it fails
}

export default db;
