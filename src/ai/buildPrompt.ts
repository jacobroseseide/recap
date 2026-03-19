// Builds the Claude prompt for a given detail level, format, and game data.
// Single template with injected parameters — do not create separate prompts.
import type { FormattedRecapData, StandingsEntry, GameResult } from '../types/index';

export type DetailLevel = 'flash' | 'recap' | 'deep_dive';
export type RecapFormat = 'text' | 'audio';

export interface BuildPromptParams {
  detailLevel: DetailLevel;
  favoriteTeam: string | null;
  gameData: FormattedRecapData;
  format: RecapFormat;
}

// Sorts standings by wins descending (best record first) and formats as a list.
// Note: raw ESPN data has rank 1 = last place — we sort so Claude sees best-to-worst.
function formatStandingsSection(entries: StandingsEntry[]): string {
  const sorted = [...entries].sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  return sorted
    .map((s, i) => `${i + 1}. ${s.team.fullName} (${s.wins}-${s.losses})`)
    .join('\n');
}

// Formats a single game into a structured text block for the prompt.
// Omits shooting percentages and minutes played (not available from ESPN free data).
function formatGame(game: GameResult): string {
  const winner = game.homeScore > game.awayScore ? game.homeTeam : game.awayTeam;
  const loser = game.homeScore > game.awayScore ? game.awayTeam : game.homeTeam;
  const winScore = Math.max(game.homeScore, game.awayScore);
  const loseScore = Math.min(game.homeScore, game.awayScore);

  let out = `${game.awayTeam.fullName} @ ${game.homeTeam.fullName}`;
  out += `\nResult: ${winner.fullName} def. ${loser.fullName} ${winScore}-${loseScore}`;

  if (game.topPerformers.length > 0) {
    const performers = game.topPerformers
      .map((p) => `${p.playerName} (${p.teamAbbreviation}): ${p.points} pts, ${p.rebounds} reb, ${p.assists} ast`)
      .join(' | ');
    out += `\nTop performers: ${performers}`;
  }

  return out;
}

// Checks whether a given team name/city appears in any of last night's games.
function teamPlayedLastNight(gameData: FormattedRecapData, team: string): boolean {
  const q = team.toLowerCase();
  return gameData.games.some(
    (g) =>
      g.homeTeam.fullName.toLowerCase().includes(q) ||
      g.awayTeam.fullName.toLowerCase().includes(q) ||
      g.homeTeam.city.toLowerCase().includes(q) ||
      g.awayTeam.city.toLowerCase().includes(q) ||
      g.homeTeam.name.toLowerCase().includes(q) ||
      g.awayTeam.name.toLowerCase().includes(q)
  );
}

// Returns the format-specific writing style instructions.
function formatStyleInstructions(format: RecapFormat): string {
  if (format === 'audio') {
    return `WRITING STYLE — AUDIO (spoken word for text-to-speech):
- Short, punchy sentences. Every sentence should land cleanly when spoken aloud.
- No bullet points, no dashes as list markers, no headers, no parentheses for asides.
- Use natural broadcaster transitions: "And over in Boston...", "Meanwhile out west...", "Let's talk about...", "Next up..."
- Avoid hard-to-pronounce abbreviations in running text — say "the Lakers" not "LAL".
- Write exactly as it should sound coming out of a speaker. This goes directly to TTS.`;
  }
  return `WRITING STYLE — TEXT (written recap):
- Plain paragraphs only. No markdown whatsoever.
- Do NOT use #, ##, or any header syntax.
- Do NOT use *, **, or _ for emphasis or italics.
- Do NOT use bullet points, dashes as list markers, or numbered lists.
- Natural paragraph breaks for readability — one paragraph per highlighted game.
- Punchy, energetic writing — written sports journalism tone.`;
}

// Returns the detail-level-specific content instructions.
function detailLevelInstructions(
  detailLevel: DetailLevel,
  favoriteTeam: string | null,
  gameData: FormattedRecapData
): string {
  if (detailLevel === 'flash') {
    const teamNote = favoriteTeam
      ? `- If ${favoriteTeam} played last night, mention their game first.`
      : '';
    return `DETAIL LEVEL — FLASH:
- Cover every game. One sentence per game, max.
- Each sentence must include: teams, final score, winner, and one standout player name.
- No elaboration. Just the facts, sharp and clean.
${teamNote}
- Target length: ~60 seconds when read aloud.`.trim();
  }

  if (detailLevel === 'recap') {
    const teamNote = favoriteTeam
      ? `- Favorite team: ${favoriteTeam}. If they played last night, they must be one of your highlighted games — lead with their game. If they did not play, open with a one-liner: "The ${favoriteTeam} were off last night — here's what happened around the league."`
      : '- Editorially pick the 2-3 most compelling games (closest contest, biggest blowout, wildest individual performance — your call).';
    return `DETAIL LEVEL — RECAP:
${teamNote}
- For each highlighted game: one full paragraph covering the game story and top performers.
- For all other games: one tight sentence each — score, winner, one name.
- Close with a brief standings snapshot mentioning where relevant teams stand. Use records (e.g. "32-18") or relative terms ("leads the East", "third-best in the West") — never say "ranked 3rd" or use a rank number.
- Target length: ~2-3 minutes when read aloud.`;
  }

  // deep_dive
  if (!favoriteTeam) {
    return `DETAIL LEVEL — DEEP DIVE:
- No favorite team set. Cover the full night comprehensively.
- Lead with the 2-3 most compelling games: full game stories with narrative arc, key moments, and performances.
- One tight paragraph for each remaining game.
- Close with a standings snapshot — use records or relative terms, never rank numbers.
- Target length: ~4-5 minutes when read aloud.`;
  }

  const played = teamPlayedLastNight(gameData, favoriteTeam);

  if (played) {
    return `DETAIL LEVEL — DEEP DIVE (favorite team: ${favoriteTeam}):
- Lead with the full ${favoriteTeam} game: build-up, key moments, turning points, who stepped up or fell short.
- Then cover the 1-2 other most notable games with full paragraphs.
- Then a brief one-liner for each remaining game.
- Close with a standings note for ${favoriteTeam} and the broader league picture. Use records, not rank numbers.
- Target length: ~4-5 minutes when read aloud.`;
  } else {
    return `DETAIL LEVEL — DEEP DIVE (favorite team: ${favoriteTeam}):
- Open with: "The ${favoriteTeam} were off last night — here's what happened around the league."
- Then treat this as a Recap: pick the 2-3 best games for full paragraphs, one-liner for the rest.
- Close with a standings note mentioning where ${favoriteTeam} sits relative to the field. Use records, not rank numbers.
- Target length: ~4-5 minutes when read aloud.`;
  }
}

// Assembles the full prompt string from all parameters.
// This is the single entry point — all detail levels and formats go through here.
export function buildPrompt({ detailLevel, favoriteTeam, gameData, format }: BuildPromptParams): string {
  const gamesSection = gameData.games.length === 0
    ? 'No games were played last night.'
    : gameData.games.map(formatGame).join('\n\n---\n\n');

  const eastStandings = formatStandingsSection(gameData.standings.east);
  const westStandings = formatStandingsSection(gameData.standings.west);

  return `You are a sharp, engaging NBA sports broadcaster writing a morning recap.
Date: the morning after ${gameData.date} — covering last night's action.

${detailLevelInstructions(detailLevel, favoriteTeam, gameData)}

${formatStyleInstructions(format)}

CRITICAL DATA RULES:
- Do NOT mention shooting percentages (FG%, 3P%, free throw %) — this data is unavailable.
- Do NOT reference minutes played.
- When describing standings, always use a team's record (e.g., "33-18") or a relative phrase ("best in the East", "fighting for a playoff spot"). Never use a number ranking like "third in the conference."

===== LAST NIGHT'S GAMES =====

${gamesSection}

===== EASTERN CONFERENCE STANDINGS (best to worst) =====
${eastStandings}

===== WESTERN CONFERENCE STANDINGS (best to worst) =====
${westStandings}

Write the recap now.`;
}
