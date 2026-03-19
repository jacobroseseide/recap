// Phase 4 test: inserts a test user and prints all users from the database.
// Run with: npx ts-node src/scripts/test-db.ts
import 'dotenv/config';
import { initDb } from '../db/database';
import { insertUser, getAllUsers, DuplicateUserError } from '../db/queries';

async function main() {
  // Initialize DB (creates table if not exists)
  initDb();

  // Insert a test user — handle duplicates gracefully on repeated runs
  console.log('Inserting test user...');
  try {
    const user = insertUser({
      name: 'Jacob Test',
      email: 'jacob@test.com',
      phone: '+15551234567',
      delivery_pref: 'both',
      content_pref: 'audio',
      detail_level: 'deep_dive',
      favorite_team: 'Los Angeles Lakers',
    });
    console.log('Inserted:', user);
  } catch (err) {
    if (err instanceof DuplicateUserError) {
      console.log('Note: test user already exists (duplicate email/phone) — skipping insert.');
    } else {
      throw err;
    }
  }

  // Print all users
  console.log('\nAll users in database:');
  const allUsers = getAllUsers();
  console.table(
    allUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      delivery: u.delivery_pref,
      content: u.content_pref,
      detail: u.detail_level,
      team: u.favorite_team,
      created: u.created_at,
    }))
  );
  console.log(`Total: ${allUsers.length} subscriber(s)`);
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
