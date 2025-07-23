const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve(__dirname, 'data.db'));

// 지갑 테이블 생성 (기본 자산: 10,000 USDT)
db.prepare(`
  CREATE TABLE IF NOT EXISTS wallets (
    userId TEXT PRIMARY KEY,
    balance REAL NOT NULL
  )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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

// 포지션 테이블 생성
db.prepare(`
  CREATE TABLE IF NOT EXISTS positions (
    userId TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    entry REAL NOT NULL,
    amount REAL NOT NULL,
    leverage INTEGER NOT NULL DEFAULT 1,
    tp REAL,
    sl REAL
  )
`).run();


db.prepare(`
  CREATE TABLE IF NOT EXISTS attendance (
    userId TEXT PRIMARY KEY,
    lastDate TEXT NOT NULL
  )
`).run();


// 지갑 관련 함수
function getWallet(userId) {
  let row = db.prepare(`SELECT * FROM wallets WHERE userId = ?`).get(userId);
  if (!row) {
    db.prepare(`INSERT INTO wallets (userId, balance) VALUES (?, 10000)`).run(userId);
    row = { userId, balance: 10000 };
  }
  return row;
}

function updateWallet(userId, balance) {
  db.prepare(`INSERT OR REPLACE INTO wallets (userId, balance) VALUES (?, ?)`).run(userId, balance);
}

// 포지션 관련 함수
function setPosition(userId, { symbol, type, entry, amount, leverage, tp = null, sl = null }) {
  db.prepare(`
    INSERT OR REPLACE INTO positions
    (userId, symbol, type, entry, amount, leverage, tp, sl)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, symbol, type, entry, amount, leverage, tp, sl);
}

function getPosition(userId) {
  return db.prepare(`SELECT * FROM positions WHERE userId = ?`).get(userId);
}

function deletePosition(userId) {
  db.prepare(`DELETE FROM positions WHERE userId = ?`).run(userId);
}

function updatePosition(userId, { tp = null, sl = null }) {
  db.prepare(`
    UPDATE positions
    SET tp = ?, sl = ?
    WHERE userId = ?
  `).run(tp, sl, userId);
}

function getLastAttendance(userId) {
  const row = db.prepare('SELECT lastDate FROM attendance WHERE userId = ?').get(userId);
  return row ? row.lastDate : null;
}

function setAttendanceToday(userId, todayDate) {
  db.prepare(`
    INSERT INTO attendance (userId, lastDate)
    VALUES (?, ?)
    ON CONFLICT(userId) DO UPDATE SET lastDate = excluded.lastDate
  `).run(userId, todayDate);
}

function logTrade(tradeData) {
  const {
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
  console.log(timestamp);
  const stmt = db.prepare(`
    INSERT INTO trades (
      user_id, symbol, type,
      entry_price, exit_price,
      amount, leverage, pnl, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
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

function getUserTrades(userId, days = 7) {
  const stmt = db.prepare(`
    SELECT
      DATE(datetime(timestamp, 'unixepoch', 'localtime')) AS date,
      SUM(pnl) AS total_pnl
    FROM trades
    WHERE user_id = ?
      AND timestamp >= strftime('%s', 'now', ?)
    GROUP BY date
    ORDER BY date ASC
  `);

  return stmt.all(userId, `-${days} days`);
}

function getLeaderboard(limit = 10) {
  return db.prepare(`
    SELECT userId, balance FROM wallets
    ORDER BY balance DESC
    LIMIT ?
  `).all(limit);
}


module.exports = { db, getWallet, updateWallet, setPosition, getPosition, deletePosition, getLastAttendance, setAttendanceToday, updatePosition, getUserTrades, logTrade, getLeaderboard };
