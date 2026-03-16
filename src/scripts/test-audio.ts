// Phase 3 test: converts the flash audio recap to an MP3 via ElevenLabs.
// Uses the real flash-audio output from our Phase 2 test run (hardcoded).
// Run with: npx ts-node src/scripts/test-audio.ts
import 'dotenv/config';
import { generateAudio } from '../audio/generateAudio';

// Flash-audio recap from the real March 15 2026 test run.
const FLASH_AUDIO_SCRIPT = `Good morning, hoops fans — here is everything that went down on Sunday night.

Out in Oklahoma City, the Thunder stayed dominant, topping the Timberwolves one sixteen to one oh three, with Julius Randle dropping thirty two in a losing effort and Chet Holmgren anchoring the win for the best team in the West.

And down in Cleveland, Dallas pulled off the road upset, beating the Cavaliers one thirty to one twenty, with rookie Cooper Flagg putting up twenty seven points and ten assists for the Mavericks.

Up in Toronto, Brandon Ingram went off for thirty four points to lead the Raptors past Detroit one nineteen to one oh eight.

Over in Milwaukee, Giannis Antetokounmpo and Bobby Portis combined for sixty points as the Bucks rolled past Indiana one thirty four to one twenty three.

In Philadelphia, Quentin Grimes dropped thirty one to carry the Sixers past Portland one oh nine to one oh three.

And finally in New York, Jalen Brunson poured in thirty to hold off Golden State in a tight one, Knicks win one ten to one oh seven.

Six games, six stories. Come back tonight for more. Let's go.`;

async function main(): Promise<void> {
  console.log('Generating audio...');
  const filePath = await generateAudio(FLASH_AUDIO_SCRIPT, '2026-03-15');
  console.log(`\nMP3 saved to: ${filePath}`);
  console.log('Open the file and listen before proceeding to Phase 4.');
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
