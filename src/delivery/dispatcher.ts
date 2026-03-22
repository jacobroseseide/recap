// Orchestrates recap generation and delivery for all users.
// Fetches real game data once, then generates and sends per-user recaps.
// Individual user failures are logged but do not stop the run.
import { getRecapData } from '../data/fetchRecapData';
import { generateRecap } from '../ai/generateRecap';
import { sendSMS } from './sendSMS';
import { sendEmail } from './sendEmail';
import { log, logError, logWarn } from '../utils/logger';
import type { User } from '../types/index';
import type { DetailLevel } from '../ai/buildPrompt';

export interface DispatchResult {
  userId: number;
  name: string;
  success: boolean;
  error?: string;
}

// Runs the full delivery pipeline for a list of users on a given date.
// Returns a summary of results per user.
export async function runDispatcher(
  users: User[],
  dateOverride?: string
): Promise<DispatchResult[]> {
  log('=== Dispatcher starting ===');
  log(`Processing ${users.length} user(s)`);

  // Fetch game data once — shared across all users
  const gameData = await getRecapData(dateOverride);

  if (gameData.games.length === 0) {
    logWarn('No games found for this date — recaps will note a rest day.');
  }

  const results: DispatchResult[] = [];

  for (const user of users) {
    log(`\n--- Processing user: ${user.name} (id: ${user.id}) ---`);
    try {
      const wantsText = user.content_pref === 'text' || user.content_pref === 'both';
      const wantsAudio = user.content_pref === 'audio' || user.content_pref === 'both';

      // Generate text recap (always needed — used for SMS and email body)
      const textRecap = await generateRecap({
        detailLevel: user.detail_level as DetailLevel,
        favoriteTeam: user.favorite_team,
        gameData,
        format: 'text',
      });

      // Audio recap script generated but TTS/upload skipped until Phase 6
      if (wantsAudio) {
        log(`User wants audio — skipping TTS/upload until Phase 6`);
      }

      // audioUrl is null until Phase 6 wires up storage + upload
      const audioUrl: string | null = null;

      // Deliver via preferred channel(s)
      const wantsSMS = user.delivery_pref === 'sms' || user.delivery_pref === 'both';
      const wantsEmail = user.delivery_pref === 'email' || user.delivery_pref === 'both';

      if (wantsSMS) {
        if (!user.phone) {
          logWarn(`User ${user.name} wants SMS but has no phone number — skipping SMS`);
        } else {
          await sendSMS(user.phone, textRecap, audioUrl);
        }
      }

      if (wantsEmail) {
        if (!user.email) {
          logWarn(`User ${user.name} wants email but has no email address — skipping email`);
        } else {
          await sendEmail(user.name, user.email, textRecap, gameData.date, audioUrl);
        }
      }

      results.push({ userId: user.id, name: user.name, success: true });
      log(`✓ ${user.name} delivered successfully`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logError(`Delivery failed for ${user.name}`, err instanceof Error ? err : new Error(message));
      results.push({ userId: user.id, name: user.name, success: false, error: message });
    }
  }

  return results;
}
