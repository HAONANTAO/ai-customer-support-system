const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, 'chat.db'))

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT    NOT NULL,
    role       TEXT    NOT NULL,
    content    TEXT    NOT NULL,
    timestamp  TEXT    NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_session ON conversations (session_id, id);
`)

const stmtInsert = db.prepare(
  'INSERT INTO conversations (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)'
)

const stmtGetHistory = db.prepare(
  'SELECT role, content, timestamp FROM conversations WHERE session_id = ? ORDER BY id ASC'
)

function saveMessage(sessionId, role, content) {
  stmtInsert.run(sessionId, role, content, new Date().toISOString())
}

function getHistory(sessionId) {
  return stmtGetHistory.all(sessionId)
}

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

module.exports = { saveMessage, getHistory, getAdminStats, getRecentSessions }
