const { fetchPrice } = require('../utils/fetchPrice');

async function monitorPositions() {
  const rows = db.prepare(`SELECT userId FROM positions`).all();

  for (const { userId } of rows) {
    const pos = getPosition(userId);
    if (!pos) continue;

    const currentPrice = await fetchPrice(pos.symbol);

    if (pos.type === 'LONG') {
      if (pos.tp && currentPrice >= pos.tp) {
        await liquidatePosition(userId, `🎯 목표가 ${pos.tp} 도달`);
      } else if (pos.sl && currentPrice <= pos.sl) {
        await liquidatePosition(userId, `🛑 손절가 ${pos.sl} 도달`);
      }
    }

    if (pos.type === 'SHORT') {
      if (pos.tp && currentPrice <= pos.tp) {
        await liquidatePosition(userId, `🎯 목표가 ${pos.tp} 도달`);
      } else if (pos.sl && currentPrice >= pos.sl) {
        await liquidatePosition(userId, `🛑 손절가 ${pos.sl} 도달`);
      }
    }
  }

  setTimeout(monitorPositions, 5000);  // 5초마다 반복
}

module.exports = { monitorPositions };