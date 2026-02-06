
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB in the parent directory (or persistent volume)
const dbPath = path.resolve(__dirname, '../ghl_projects.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Enable WAL for better concurrency
db.pragma('journal_mode = WAL');

// Initialize Schema
function initSchema() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT,
      client_email TEXT,
      status TEXT DEFAULT 'created',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_data (
      project_id TEXT,
      key TEXT,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, key),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);
    console.log('✅ Database schema initialized');
}

initSchema();

// Operations
export const projectRepo = {
    create: (project) => {
        const stmt = db.prepare(`
      INSERT INTO projects (id, name, client_email, status, created_at)
      VALUES (@id, @name, @clientEmail, @status, @date)
    `);
        const info = stmt.run({
            id: project.id,
            name: project.name || 'Nuevo Proyecto',
            clientEmail: project.clientEmail || null,
            status: project.status || 'created',
            date: project.date || new Date().toISOString()
        });
        return info.changes > 0;
    },

    getAll: () => {
        const projects = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
        // Hydrate each project (Note: for large datasets this should be optimized to a single JOIN)
        const getDetails = db.prepare('SELECT key, value FROM project_data WHERE project_id = ?');

        for (const p of projects) {
            const details = getDetails.all(p.id);
            for (const row of details) {
                try {
                    p[row.key] = JSON.parse(row.value);
                } catch (e) {
                    p[row.key] = row.value;
                }
            }
        }
        return projects;
    },

    getById: (id) => {
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
        if (!project) return null;

        // Hydrate with extra data
        const dataRows = db.prepare('SELECT key, value FROM project_data WHERE project_id = ?').all(id);
        const enriched = { ...project };

        for (const row of dataRows) {
            try {
                enriched[row.key] = JSON.parse(row.value);
            } catch (e) {
                enriched[row.key] = row.value; // Fallback for plain text
            }
        }
        return enriched;
    },

    saveData: (projectId, key, data) => {
        const stmt = db.prepare(`
      INSERT INTO project_data (project_id, key, value, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(project_id, key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `);
        return stmt.run(projectId, key, JSON.stringify(data));
    },

    updateProject: (id, updates) => {
        // Separate core fields from data fields
        const coreFields = ['name', 'status', 'client_email'];
        const projectUpdates = {};
        const dataUpdates = {};

        Object.keys(updates).forEach(k => {
            if (coreFields.includes(k) || k === 'clientName') {
                const dbKey = k === 'clientName' ? 'name' : k;
                projectUpdates[dbKey] = updates[k];
            } else if (k !== 'id') {
                dataUpdates[k] = updates[k];
            }
        });

        const trans = db.transaction(() => {
            // Update core table
            if (Object.keys(projectUpdates).length > 0) {
                const setClause = Object.keys(projectUpdates).map(k => `${k} = @${k}`).join(', ');
                const stmt = db.prepare(`UPDATE projects SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`);
                stmt.run({ ...projectUpdates, id });
            }

            // Update/Insert data blobs
            const upsertStmt = db.prepare(`
        INSERT INTO project_data (project_id, key, value, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(project_id, key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `);

            for (const [key, val] of Object.entries(dataUpdates)) {
                upsertStmt.run(id, key, JSON.stringify(val));
            }
        });

        trans();
        return true;
    },

    delete: (id) => {
        db.prepare('DELETE FROM projects WHERE id = ?').run(id);
        // Cascade delete should handle project_data, but for safety with SQLite sometimes:
        db.prepare('DELETE FROM project_data WHERE project_id = ?').run(id);
    }
};
