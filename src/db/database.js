const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve(__dirname, 'data.db'));

db.prepare(`
  CREATE TABLE IF NOT EXISTS wallets (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    balance REAL NOT NULL,
    PRIMARY KEY (guildId, userId)
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS trades (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    entry_price REAL NOT NULL,
    exit_price REAL NOT NULL,
    amount REAL NOT NULL,
    leverage INTEGER NOT NULL,
    pnl REAL NOT NULL,
    timestamp INTEGER NOT NULL
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS positions (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    entry REAL NOT NULL,
    amount REAL NOT NULL,
    leverage INTEGER NOT NULL DEFAULT 1,
    tp REAL,
    sl REAL,
    PRIMARY KEY (guildId, userId)
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS attendance (
    guildId TEXT NOT NULL,
    userId TEXT NOT NULL,
    lastDate TEXT NOT NULL,
    PRIMARY KEY (guildId, userId)
  );
`).run();

function getWallet(guildId, userId) {
  let row = db.prepare(`SELECT * FROM wallets WHERE guildId = ? AND userId = ?`).get(guildId, userId);
  if (!row) {
    db.prepare(`INSERT INTO wallets (guildId, userId, balance) VALUES (?, ?, 10000)`).run(guildId, userId);
    row = { guildId, userId, balance: 100 };
  }
  return row;
}

function updateWallet(guildId, userId, balance) {
  db.prepare(`INSERT OR REPLACE INTO wallets (guildId, userId, balance) VALUES (?, ?, ?)`).run(guildId, userId, balance);
}

function setPosition(guildId, userId, { symbol, type, entry, amount, leverage, tp = null, sl = null }) {
  db.prepare(`
    INSERT OR REPLACE INTO positions
    (guildId, userId, symbol, type, entry, amount, leverage, tp, sl)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(guildId, userId, symbol, type, entry, amount, leverage, tp, sl);
}

function getPosition(guildId, userId) {
  return db.prepare(`SELECT * FROM positions WHERE guildId = ? AND userId = ?`).get(guildId, userId);
}

function deletePosition(guildId, userId) {
  db.prepare(`DELETE FROM positions WHERE guildId = ? AND userId = ?`).run(guildId, userId);
}

function updatePosition(guildId, userId, { tp = null, sl = null }) {
  db.prepare(`
    UPDATE positions
    SET tp = ?, sl = ?
    WHERE guildId = ? AND userId = ?
  `).run(tp, sl, guildId, userId);
}

function getLastAttendance(guildId, userId) {
  const row = db.prepare(`SELECT lastDate FROM attendance WHERE guildId = ? AND userId = ?`).get(guildId, userId);
  return row ? row.lastDate : null;
}

function setAttendanceToday(guildId, userId, todayDate) {
  db.prepare(`
    INSERT INTO attendance (guildId, userId, lastDate)
    VALUES (?, ?, ?)
    ON CONFLICT(guildId, userId) DO UPDATE SET lastDate = excluded.lastDate
  `).run(guildId, userId, todayDate);
}

function logTrade(tradeData) {
  const {
    guildId,  // 추가됨
    userId,
    symbol,
    type,
    entryPrice,
    exitPrice,
    amount,
    leverage,
    pnl,
    timestamp
  } = tradeData;

  const stmt = db.prepare(`
    INSERT INTO trades (
      guild_id, user_id, symbol, type,
      entry_price, exit_price,
      amount, leverage, pnl, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    guildId,
    userId,
    symbol,
    type,
    entryPrice,
    exitPrice,
    amount,
    leverage,
    pnl,
    timestamp
  );
}


function getUserTrades(guildId, userId, days = 7) {
  const stmt = db.prepare(`
    SELECT
      DATE(datetime(timestamp, 'unixepoch', 'localtime')) AS date,
      SUM(pnl) AS total_pnl
    FROM trades
    WHERE guild_id = ?
      AND user_id = ?
      AND timestamp >= strftime('%s', 'now', ?)
    GROUP BY date
    ORDER BY date ASC
  `);

  return stmt.all(guildId, userId, `-${days} days`);
}


function getLeaderboard(limit = 10) {
  return db.prepare(`
    SELECT userId, balance FROM wallets
    ORDER BY balance DESC
    LIMIT ?
  `).all(limit);
}


module.exports = { db, getWallet, updateWallet, setPosition, getPosition, deletePosition, getLastAttendance, setAttendanceToday, updatePosition, getUserTrades, logTrade, getLeaderboard };
