// Initializes the SQLite database and creates the users table if it doesn't exist.
// Call initDb() once at server startup before running any queries.
import Database from 'better-sqlite3';
import path from 'path';
import { logError } from '../utils/logger';

// Falls back to ./data/users.db if DATABASE_PATH is not set in the environment.
const DB_PATH = process.env.DATABASE_PATH ?? './data/users.db';

// Opens the database connection and ensures the schema is up to date.
// Throws (after logging) if the database cannot be opened or the schema cannot be applied.
export function initDb(): Database.Database {
  try {
    const db = new Database(path.resolve(process.cwd(), DB_PATH));

    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT    NOT NULL,
        email         TEXT,
        phone         TEXT,
        delivery_pref TEXT    NOT NULL CHECK(delivery_pref IN ('email', 'sms', 'both')),
        content_pref  TEXT    NOT NULL CHECK(content_pref  IN ('text', 'audio', 'both')),
        detail_level  TEXT    NOT NULL CHECK(detail_level  IN ('flash', 'recap', 'deep_dive')),
        favorite_team TEXT,
        created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Partial unique indexes — only enforce uniqueness when the value is not null.
    // CREATE INDEX IF NOT EXISTS is safe to run on every startup.
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
        ON users (email) WHERE email IS NOT NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone
        ON users (phone) WHERE phone IS NOT NULL;
    `);

    return db;
  } catch (err) {
    logError('Failed to initialize database', err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}

// Module-level singleton — reuse the same connection throughout the process.
let _db: Database.Database | null = null;

// Returns the shared database instance, initializing it on first call.
export function getDb(): Database.Database {
  if (!_db) _db = initDb();
  return _db;
}
