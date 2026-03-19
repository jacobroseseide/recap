// Simple logger that prefixes every message with an ISO timestamp and level tag.
// All output goes to stdout (log/warn) or stderr (error).

// Returns the current timestamp formatted as YYYY-MM-DD HH:MM:SS
function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return `${date} ${time}`;
}

// Logs an informational message to stdout with a timestamp prefix.
export function log(message: string): void {
  console.log(`[${timestamp()}] [INFO] ${message}`);
}

// Logs a warning message to stdout with a timestamp prefix.
export function logWarn(message: string): void {
  console.warn(`[${timestamp()}] [WARN] ${message}`);
}

// Logs an error message to stderr with a timestamp prefix.
// Optionally appends the error's message if an Error object is provided.
export function logError(message: string, error?: unknown): void {
  const suffix =
    error instanceof Error
      ? `: ${error.message}`
      : error !== undefined
      ? `: ${String(error)}`
      : '';
  console.error(`[${timestamp()}] [ERROR] ${message}${suffix}`);
}
