// Validates that all required environment variables are set at startup.
// Call this before any API clients are initialized.
import { logError } from './logger';

// The env vars that must be present for the app to function.
const REQUIRED_KEYS = [
  'ANTHROPIC_API_KEY',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID',
] as const;

// Checks that every required env var is set.
// Logs a clear error listing missing keys and exits with code 1 if any are absent.
export function validateEnv(): void {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logError(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Check your .env file and ensure all required keys are set.'
    );
    process.exit(1);
  }
}
