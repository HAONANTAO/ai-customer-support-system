const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, 'chat.db'))
db.pragma('journal_mode = WAL')

// ── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL,
    plan          TEXT    NOT NULL DEFAULT 'free'
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT    NOT NULL,
    role       TEXT    NOT NULL,
    content    TEXT    NOT NULL,
    timestamp  TEXT    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_session ON conversations (session_id, id);
`)

// Migrate: add user_id column if it doesn't exist yet
try {
  db.exec('ALTER TABLE conversations ADD COLUMN user_id INTEGER REFERENCES users(id)')
} catch { /* column already exists */ }

// ── Prepared statements ───────────────────────────────────────────────────────
const stmtInsert = db.prepare(
  'INSERT INTO conversations (session_id, role, content, timestamp, user_id) VALUES (?, ?, ?, ?, ?)'
)
const stmtGetHistory = db.prepare(
  'SELECT role, content, timestamp FROM conversations WHERE session_id = ? AND user_id = ? ORDER BY id ASC'
)
const stmtGetHistoryAdmin = db.prepare(
  'SELECT role, content, timestamp FROM conversations WHERE session_id = ? ORDER BY id ASC'
)
const stmtCreateUser = db.prepare(
  'INSERT INTO users (email, password_hash, created_at, plan) VALUES (?, ?, ?, ?)'
)
const stmtGetUserByEmail = db.prepare(
  'SELECT id, email, password_hash, plan FROM users WHERE email = ?'
)

// ── Conversation functions ────────────────────────────────────────────────────
function saveMessage(sessionId, role, content, userId = null) {
  stmtInsert.run(sessionId, role, content, new Date().toISOString(), userId)
}

function getHistory(sessionId, userId) {
  return stmtGetHistory.all(sessionId, userId)
}

function getHistoryAdmin(sessionId) {
  return stmtGetHistoryAdmin.all(sessionId)
}

// ── User functions ────────────────────────────────────────────────────────────
function createUser(email, passwordHash) {
  return stmtCreateUser.run(email, passwordHash, new Date().toISOString(), 'free')
}

function getUserByEmail(email) {
  return stmtGetUserByEmail.get(email)
}

// ── Admin stats ───────────────────────────────────────────────────────────────
function getAdminStats() {
  const todaySessions = db.prepare(`
    SELECT COUNT(DISTINCT session_id) AS count
    FROM conversations
    WHERE date(timestamp) = date('now')
  `).get()

  const todayMessages = db.prepare(`
    SELECT COUNT(*) AS count
    FROM conversations
    WHERE date(timestamp) = date('now')
  `).get()

  const avgResult = db.prepare(`
    SELECT AVG(msg_count) AS avg FROM (
      SELECT COUNT(*) AS msg_count
      FROM conversations
      WHERE date(timestamp) = date('now')
      GROUP BY session_id
    )
  `).get()

  return {
    todaySessions: todaySessions.count,
    todayMessages: todayMessages.count,
    avgTurns: Math.round((avgResult.avg || 0) * 10) / 10,
  }
}

function getRecentSessions() {
  return db.prepare(`
    SELECT
      c.session_id,
      MIN(c.timestamp)  AS started_at,
      MAX(c.timestamp)  AS last_at,
      COUNT(*)          AS message_count,
      (
        SELECT content FROM conversations c2
        WHERE c2.session_id = c.session_id AND c2.role = 'user'
        ORDER BY c2.id ASC LIMIT 1
      ) AS first_message
    FROM conversations c
    GROUP BY c.session_id
    ORDER BY last_at DESC
    LIMIT 10
  `).all()
}

module.exports = {
  saveMessage,
  getHistory,
  getHistoryAdmin,
  createUser,
  getUserByEmail,
  getAdminStats,
  getRecentSessions,
}
