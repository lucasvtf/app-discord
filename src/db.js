import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, '..', 'data', 'calls.sqlite');

mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS call_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    left_at INTEGER,
    duration_ms INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_user_time
    ON call_sessions(guild_id, user_id, joined_at);
  CREATE INDEX IF NOT EXISTS idx_open
    ON call_sessions(guild_id, user_id) WHERE left_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_range
    ON call_sessions(guild_id, joined_at, left_at);
`);

const stmts = {
  insertSession: db.prepare(`
    INSERT INTO call_sessions (guild_id, user_id, channel_id, joined_at)
    VALUES (?, ?, ?, ?)
  `),
  findOpenSession: db.prepare(`
    SELECT id, joined_at FROM call_sessions
    WHERE guild_id = ? AND user_id = ? AND left_at IS NULL
    ORDER BY joined_at DESC
    LIMIT 1
  `),
  closeSessionById: db.prepare(`
    UPDATE call_sessions
    SET left_at = ?, duration_ms = ? - joined_at
    WHERE id = ?
  `),
  allOpenSessions: db.prepare(`
    SELECT id, guild_id, user_id, channel_id, joined_at
    FROM call_sessions
    WHERE left_at IS NULL
  `),
};

export function openSession(guildId, userId, channelId, ts) {
  stmts.insertSession.run(guildId, userId, channelId, ts);
}

export function closeOpenSession(guildId, userId, ts) {
  const open = stmts.findOpenSession.get(guildId, userId);
  if (!open) return false;
  stmts.closeSessionById.run(ts, ts, open.id);
  return true;
}

export function getAllOpenSessions() {
  return stmts.allOpenSessions.all();
}

/**
 * Aggregate call time per user, clipping each session to [from, to].
 * Open sessions use `now` as the closing time.
 */
export function aggregatePerUser(guildId, from, to, now, limit) {
  return db.prepare(`
    SELECT
      user_id,
      SUM(MIN(COALESCE(left_at, ?), ?) - MAX(joined_at, ?)) AS total_ms,
      COUNT(*) AS sessions
    FROM call_sessions
    WHERE guild_id = ?
      AND joined_at < ?
      AND COALESCE(left_at, ?) > ?
    GROUP BY user_id
    HAVING total_ms > 0
    ORDER BY total_ms DESC
    LIMIT ?
  `).all(now, to, from, guildId, to, now, from, limit);
}

export function aggregatePerChannel(guildId, from, to, now) {
  return db.prepare(`
    SELECT
      channel_id,
      SUM(MIN(COALESCE(left_at, ?), ?) - MAX(joined_at, ?)) AS total_ms
    FROM call_sessions
    WHERE guild_id = ?
      AND joined_at < ?
      AND COALESCE(left_at, ?) > ?
    GROUP BY channel_id
    HAVING total_ms > 0
    ORDER BY total_ms DESC
    LIMIT 1
  `).get(now, to, from, guildId, to, now, from);
}

export function longestSession(guildId, from, to, now) {
  return db.prepare(`
    SELECT
      user_id,
      channel_id,
      MIN(COALESCE(left_at, ?), ?) - MAX(joined_at, ?) AS duration
    FROM call_sessions
    WHERE guild_id = ?
      AND joined_at < ?
      AND COALESCE(left_at, ?) > ?
    ORDER BY duration DESC
    LIMIT 1
  `).get(now, to, from, guildId, to, now, from);
}
