// Test script for Phase 1: fetches last night's NBA data and prints it.
// Run with: npx ts-node src/scripts/test-data.ts
import 'dotenv/config';
import { getRecapData } from '../data/fetchRecapData';

async function main() {
  const data = await getRecapData();

  console.log('\n===== NBA RECAP DATA =====\n');
  console.log(`Date: ${data.date}`);
  console.log(`Games played: ${data.games.length}`);

  if (data.games.length === 0) {
    console.log('No games last night.');
  } else {
    for (const game of data.games) {
      const winner =
        game.homeScore > game.awayScore ? game.homeTeam.fullName : game.awayTeam.fullName;
      console.log(`\n${game.awayTeam.fullName} @ ${game.homeTeam.fullName}`);
      console.log(`  Final: ${game.awayScore} - ${game.homeScore}  (${winner} wins)`);
      console.log(`  Status: ${game.status}`);

      if (game.topPerformers.length > 0) {
        console.log('  Top performers:');
        for (const p of game.topPerformers) {
          console.log(
            `    ${p.playerName} (${p.teamAbbreviation}): ` +
              `${p.points} pts / ${p.rebounds} reb / ${p.assists} ast`
          );
        }
      }
    }
  }

  console.log('\n--- STANDINGS (East, top 8) ---');
  for (const s of data.standings.east.slice(0, 8)) {
    console.log(
      `  ${s.conferenceRank}. ${s.team.fullName.padEnd(30)} ${s.wins}-${s.losses} (${s.winPercentage.toFixed(3)})`
    );
  }

  console.log('\n--- STANDINGS (West, top 8) ---');
  for (const s of data.standings.west.slice(0, 8)) {
    console.log(
      `  ${s.conferenceRank}. ${s.team.fullName.padEnd(30)} ${s.wins}-${s.losses} (${s.winPercentage.toFixed(3)})`
    );
  }

  console.log('\n===== RAW JSON SNAPSHOT =====\n');
  console.log(JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
