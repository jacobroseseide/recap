// Sends the recap as an HTML email via Resend.
// Renders recap paragraphs cleanly and optionally includes an audio button.
import { Resend } from 'resend';
import { log, logError } from '../utils/logger';

// Formats a date string (YYYY-MM-DD) as "Monday, March 17, 2026"
function formatSubjectDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Converts a plain-text recap into HTML paragraphs.
// Splits on double newlines; single newlines become <br>.
function recapToHtml(text: string): string {
  return text
    .trim()
    .split(/\n\n+/)
    .map((para) => `<p style="margin:0 0 16px 0;line-height:1.7;">${para.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

// Builds the full HTML email body.
function buildEmailHtml(name: string, recapText: string, audioUrl: string | null, date: string): string {
  const audioButton = audioUrl
    ? `<div style="text-align:center;margin:32px 0;">
        <a href="${audioUrl}"
           style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;
                  padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;">
          🎧 Listen Now
        </a>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">

    <!-- Header -->
    <div style="margin-bottom:32px;">
      <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:2px;color:#f97316;text-transform:uppercase;">
        NBA Morning Recap
      </p>
      <h1 style="margin:0;font-size:26px;font-weight:800;color:#fff;line-height:1.2;">
        Good morning, ${name}.
      </h1>
      <p style="margin:8px 0 0 0;font-size:14px;color:#9ca3af;">${formatSubjectDate(date)}</p>
    </div>

    <!-- Divider -->
    <hr style="border:none;border-top:1px solid #2a2a2a;margin:0 0 28px 0;">

    <!-- Recap text -->
    <div style="font-size:15px;color:#d1d5db;">
      ${recapToHtml(recapText)}
    </div>

    ${audioButton}

    <!-- Divider -->
    <hr style="border:none;border-top:1px solid #2a2a2a;margin:32px 0 20px 0;">

    <!-- Footer -->
    <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;">
      You're receiving this because you signed up for NBA Morning Recap.
    </p>

  </div>
</body>
</html>`;
}

// Sends the recap as an HTML email to the given address.
// If audioUrl is provided, a "Listen Now" button is included.
export async function sendEmail(
  name: string,
  email: string,
  recapText: string,
  date: string,
  audioUrl: string | null
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) throw new Error('RESEND_API_KEY is not set');
  if (!fromEmail) throw new Error('RESEND_FROM_EMAIL is not set');

  const subject = `🏀 NBA Morning Recap — ${formatSubjectDate(date)}`;
  const html = buildEmailHtml(name, recapText, audioUrl, date);

  log(`Sending email to ${email}...`);

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      html,
    });
    log(`Email sent to ${email}`);
  } catch (err) {
    logError(`Email failed for ${email}`, err instanceof Error ? err : new Error(String(err)));
    throw err;
  }
}
