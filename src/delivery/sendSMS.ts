// Sends the recap as an SMS via Twilio.
// Truncates to 1600 chars at a clean sentence boundary if needed.
// Appends an optional audio link at the end.
import twilio from 'twilio';
import { log, logError } from '../utils/logger';

const SMS_CHAR_LIMIT = 1600;

// Truncates text to fit within the SMS character limit, breaking at the last
// complete sentence boundary before the limit. Appends "..." if truncated.
function truncateToSMSLimit(text: string, reservedChars = 0): string {
  const limit = SMS_CHAR_LIMIT - reservedChars;
  if (text.length <= limit) return text;

  const truncated = text.slice(0, limit);
  // Find the last sentence-ending punctuation before the limit
  const lastSentence = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? ')
  );

  if (lastSentence > 0) {
    return truncated.slice(0, lastSentence + 1).trimEnd() + '...';
  }

  // Fallback: break at last word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace > 0 ? lastSpace : limit).trimEnd() + '...';
}

// Sends a recap SMS to the given phone number.
// If audioUrl is provided, appends a "Listen" link at the end.
export async function sendSMS(
  phone: string,
  recapText: string,
  audioUrl: string | null
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid) throw new Error('TWILIO_ACCOUNT_SID is not set');
  if (!authToken) throw new Error('TWILIO_AUTH_TOKEN is not set');
  if (!fromNumber) throw new Error('TWILIO_PHONE_NUMBER is not set');

  const audioSuffix = audioUrl ? `\n\n🎧 Listen: ${audioUrl}` : '';
  const body = truncateToSMSLimit(recapText, audioSuffix.length) + audioSuffix;

  log(`Sending SMS to ${phone} (${body.length} chars)...`);

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      body,
      from: fromNumber,
      to: phone,
    });
    log(`SMS sent to ${phone}`);
  } catch (err) {
    logError(`SMS failed for ${phone}`, err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}
