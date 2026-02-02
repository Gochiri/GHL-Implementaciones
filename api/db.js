// better-sqlite3 does NOT work on Vercel serverless (native module)
// Only use it in local development

let db = null;

// Skip SQLite entirely on Vercel - it won't work
if (!process.env.VERCEL) {
  try {
    const Database = (await import('better-sqlite3')).default;
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const dbPath = join(__dirname, 'database.sqlite');

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
    console.warn('⚠️ Running without persistent DB');
    db = null;
  }
} else {
  console.log('ℹ️ Vercel detected - SQLite disabled (use external DB for persistence)');
}

export default db;
