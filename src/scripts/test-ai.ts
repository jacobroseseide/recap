// Test script for Phase 2: fetches real game data and generates recaps at all three detail levels.
// Prints both text and audio versions so you can evaluate quality before moving on.
// Run with: npx ts-node src/scripts/test-ai.ts
import 'dotenv/config';
import { getRecapData } from '../data/fetchRecapData';
import { generateRecap } from '../ai/generateRecap';

// The favorite team to use when testing deep_dive mode.
const TEST_FAVORITE_TEAM = 'Los Angeles Lakers';

// Prints a bold section header to the console.
function header(title: string) {
  const bar = '═'.repeat(60);
  console.log(`\n${bar}`);
  console.log(`  ${title}`);
  console.log(`${bar}\n`);
}

async function main() {
  console.log('Fetching last night\'s NBA data...');
  const gameData = await getRecapData();
  console.log(`Got data for ${gameData.date} — ${gameData.games.length} game(s)\n`);

  const runs: Array<{ label: string; detailLevel: 'flash' | 'recap' | 'deep_dive'; format: 'text' | 'audio'; favoriteTeam: string | null }> = [
    { label: 'FLASH — TEXT',       detailLevel: 'flash',     format: 'text',  favoriteTeam: null },
    { label: 'FLASH — AUDIO',      detailLevel: 'flash',     format: 'audio', favoriteTeam: null },
    { label: 'RECAP — TEXT',       detailLevel: 'recap',     format: 'text',  favoriteTeam: null },
    { label: 'RECAP — AUDIO',      detailLevel: 'recap',     format: 'audio', favoriteTeam: null },
    { label: `DEEP DIVE — TEXT  (fav: ${TEST_FAVORITE_TEAM})`,  detailLevel: 'deep_dive', format: 'text',  favoriteTeam: TEST_FAVORITE_TEAM },
    { label: `DEEP DIVE — AUDIO (fav: ${TEST_FAVORITE_TEAM})`,  detailLevel: 'deep_dive', format: 'audio', favoriteTeam: TEST_FAVORITE_TEAM },
  ];

  for (const run of runs) {
    header(run.label);
    process.stdout.write('Generating...');
    const recap = await generateRecap({
      detailLevel: run.detailLevel,
      format: run.format,
      favoriteTeam: run.favoriteTeam,
      gameData,
    });
    process.stdout.write('\r                \r'); // clear "Generating..."
    console.log(recap);
  }

  header('DONE');
  console.log('All six variants generated. Review output quality above.\n');
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
