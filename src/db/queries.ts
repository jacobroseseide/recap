// Database query functions for the users table.
// All functions use the shared db singleton from database.ts.
import { getDb } from './database';
import type { User, NewUser } from '../types/index';

// Thrown when an insert would violate a UNIQUE constraint (duplicate email or phone).
export class DuplicateUserError extends Error {
  constructor() {
    super('A user with this email or phone already exists.');
    this.name = 'DuplicateUserError';
  }
}

// Inserts a new subscriber and returns the newly created user with their id.
// Throws DuplicateUserError if the email or phone is already in use.
// Rethrows any other database errors as-is.
export function insertUser(user: NewUser): User {
  const db = getDb();
  try {
    const stmt = db.prepare(`
      INSERT INTO users (name, email, phone, delivery_pref, content_pref, detail_level, favorite_team)
      VALUES (@name, @email, @phone, @delivery_pref, @content_pref, @detail_level, @favorite_team)
    `);
    const result = stmt.run(user);
    return getUserById(result.lastInsertRowid as number)!;
  } catch (err) {
    // better-sqlite3 surfaces SQLite constraint violations with a code property
    if (
      err instanceof Error &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'SQLITE_CONSTRAINT'
    ) {
      throw new DuplicateUserError();
    }
    throw err;
  }
}

// Returns all subscribers ordered by signup date descending.
export function getAllUsers(): User[] {
  const db = getDb();
  return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as User[];
}

// Returns a single subscriber by id, or null if not found.
export function getUserById(id: number): User | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return (row as User) ?? null;
}
