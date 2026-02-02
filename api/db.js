// Database module
//
// IMPORTANT: SQLite (better-sqlite3) is disabled for Vercel compatibility.
// The app works without persistence - data is stored in localStorage on frontend.
// For production persistence, integrate Vercel Postgres, Supabase, or similar.
//
// To enable SQLite locally, uncomment the code below and run:
// npm install better-sqlite3 --workspace=api

/*
// LOCAL DEVELOPMENT ONLY - Uncomment to enable SQLite:
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (...);
  CREATE TABLE IF NOT EXISTS webhooks (...);
`);
export default db;
*/

// Export null - app handles this gracefully
const db = null;
export default db;
