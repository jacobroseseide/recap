// Express server — serves the signup page and handles form submissions.
// Initializes the database on startup.
import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { validateEnv } from '../utils/validateEnv';
import { log, logError } from '../utils/logger';
import { initDb } from '../db/database';
import { insertUser, DuplicateUserError } from '../db/queries';
import type { NewUser, DeliveryPref, ContentPref, DetailLevel } from '../types/index';

// Validate required env vars before anything else can fail cryptically
validateEnv();

const app = express();
const PORT = process.env.PORT ?? 3000;

// Initialize database on startup
try {
  initDb();
  log('Database initialized.');
} catch (err) {
  logError('Failed to initialize database at startup', err instanceof Error ? err : new Error(String(err)));
  process.exit(1);
}

// Parse JSON bodies
app.use(express.json());

// Serves the signup HTML page
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'signup.html'));
});

// Validates and inserts a new subscriber
app.post('/signup', (req: Request, res: Response) => {
  const { name, email, phone, delivery_pref, content_pref, detail_level, favorite_team, focus } =
    req.body as Record<string, string | null>;

  // Required field checks
  if (!name || typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'Name is required.' });
    return;
  }

  if (!email && !phone) {
    res.status(400).json({ error: 'At least one of email or phone is required.' });
    return;
  }

  const validDelivery: DeliveryPref[] = ['email', 'sms', 'both'];
  const validContent: ContentPref[] = ['text', 'audio', 'both'];
  const validDetail: DetailLevel[] = ['flash', 'recap', 'deep_dive'];

  if (!delivery_pref || !validDelivery.includes(delivery_pref as DeliveryPref)) {
    res.status(400).json({ error: 'Invalid delivery preference.' });
    return;
  }

  if (!content_pref || !validContent.includes(content_pref as ContentPref)) {
    res.status(400).json({ error: 'Invalid content preference.' });
    return;
  }

  if (!detail_level || !validDetail.includes(detail_level as DetailLevel)) {
    res.status(400).json({ error: 'Invalid detail level.' });
    return;
  }

  // Deep dive + my_team focus requires a favorite team to be set
  if (detail_level === 'deep_dive' && focus === 'my_team' && !favorite_team?.trim()) {
    res.status(400).json({ error: 'Please select your favorite team for Deep Dive.' });
    return;
  }

  const newUser: NewUser = {
    name: name.trim(),
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    delivery_pref: delivery_pref as DeliveryPref,
    content_pref: content_pref as ContentPref,
    detail_level: detail_level as DetailLevel,
    favorite_team: favorite_team?.trim() || null,
  };

  try {
    const user = insertUser(newUser);
    log(`New subscriber signed up: ${user.name} (id=${user.id})`);
    res.status(201).json({ ok: true, user });
  } catch (err) {
    if (err instanceof DuplicateUserError) {
      res.status(409).json({ error: err.message });
      return;
    }
    logError('Unexpected error during signup', err instanceof Error ? err : new Error(String(err)));
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

app.listen(PORT, () => {
  log(`Server running at http://localhost:${PORT}`);
});
