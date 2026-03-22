// Phase 5 test: runs the full delivery dispatcher against all users in the database.
// Sends real texts and emails using today's ESPN data.
// Run with: npx ts-node src/scripts/test-delivery.ts
import 'dotenv/config';
import { getAllUsers } from '../db/queries';
import { runDispatcher } from '../delivery/dispatcher';
import { log } from '../utils/logger';

async function main(): Promise<void> {
  const users = getAllUsers();

  if (users.length === 0) {
    console.error('No users in the database. Add yourself via the signup form first.');
    process.exit(1);
  }

  log(`Found ${users.length} user(s) in the database.`);
  users.forEach((u) =>
    log(`  - ${u.name} | ${u.email ?? '(no email)'} | ${u.phone ?? '(no phone)'} | ${u.delivery_pref} | ${u.detail_level}`)
  );

  const results = await runDispatcher(users);

  // Summary
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log('\n════════════════════════════════════════');
  console.log(`  DISPATCH COMPLETE`);
  console.log(`  ${results.length} user(s) processed`);
  console.log(`  ${succeeded} succeeded`);
  console.log(`  ${failed} failed`);
  if (failed > 0) {
    console.log('\n  Failures:');
    results
      .filter((r) => !r.success)
      .forEach((r) => console.log(`    - ${r.name}: ${r.error}`));
  }
  console.log('════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('Fatal error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
