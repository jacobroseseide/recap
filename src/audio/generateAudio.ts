// Converts a recap script string to an MP3 using the ElevenLabs TTS API.
// Saves the file to output/recap-[YYYY-MM-DD].mp3 and returns the path.
import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { log, logError } from '../utils/logger';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const MODEL_ID = 'eleven_multilingual_v2';

// Returns the output file path for a given date string (YYYY-MM-DD).
// Creates the output directory if it doesn't already exist.
// Falls back to today's date if none provided.
function buildOutputPath(date?: string): string {
  const d = date ?? new Date().toISOString().split('T')[0];
  const outputDir = path.resolve(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  return path.join(outputDir, `recap-${d}.mp3`);
}

// Calls ElevenLabs TTS, saves the MP3 to disk, and returns the file path.
// Throws a descriptive error if the API call fails.
export async function generateAudio(script: string, date?: string): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not set in .env');
  if (!voiceId) throw new Error('ELEVENLABS_VOICE_ID is not set in .env');

  const url = `${ELEVENLABS_API_URL}/${voiceId}`;

  log(`Calling ElevenLabs TTS API (voice: ${voiceId})...`);

  let response: Awaited<ReturnType<typeof axios.post>>;
  try {
    response = await axios.post(
      url,
      {
        text: script,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        responseType: 'arraybuffer',
      }
    );
  } catch (err) {
    logError('ElevenLabs API call failed', err instanceof Error ? err : new Error(String(err)));
    throw new Error(`ElevenLabs API failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const outputPath = buildOutputPath(date);
  fs.writeFileSync(outputPath, Buffer.from(response.data as ArrayBuffer));
  log(`Audio saved to ${outputPath}`);
  return outputPath;
}
