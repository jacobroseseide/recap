// Express server — placeholder during Phase 1, fully built in Phase 4.
import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Health check / status page
app.get('/', (_req, res) => {
  res.send(`
    <html>
      <body style="font-family:sans-serif;padding:2rem">
        <h1>NBA Morning Recap</h1>
        <p>Server is running. Signup form coming in Phase 4.</p>
        <ul>
          <li>Phase 1 — Data pipeline ✅</li>
          <li>Phase 2 — AI recap generation (next)</li>
          <li>Phase 3 — Audio generation</li>
          <li>Phase 4 — User signup + database</li>
          <li>Phase 5 — Delivery</li>
          <li>Phase 6 — Scheduler + deployment</li>
        </ul>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
