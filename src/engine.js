const { db } = require('./db/database');
const { fetchPrice } = require('./utils/fetchPrice');
const { liquidatePosition } = require('./utils/autoLiquidator');

async function monitorPositions(client) {
  const rows = db.prepare(`SELECT guildId, userId FROM positions`).all();

  for (const { guildId, userId } of rows) {
    const pos = db.prepare(`SELECT * FROM positions WHERE guildId = ? AND userId = ?`).get(guildId, userId);
    if (!pos) continue;

    const currentPrice = await fetchPrice(pos.symbol);
    const entryPrice = pos.entry;
    const leverage = pos.leverage;
    const liquidationPrice =
      pos.type === 'LONG'
        ? entryPrice - (entryPrice / leverage)
        : entryPrice + (entryPrice / leverage);

    if (
      (pos.type === 'LONG' && currentPrice <= liquidationPrice) ||
      (pos.type === 'SHORT' && currentPrice >= liquidationPrice)
    ) {
      await liquidatePosition(client, guildId, userId, `⚠️ 강제청산 트리거됨: 청산가 ${liquidationPrice.toFixed(4)} USDT`);
      continue;
    }

    //tp sl 쳌
    if (pos.type === 'LONG') {
      if (pos.tp && currentPrice >= pos.tp) {
        await liquidatePosition(client, guildId, userId, `🎯 목표가 ${pos.tp} 도달`);
      } else if (pos.sl && currentPrice <= pos.sl) {
        await liquidatePosition(client, guildId, userId, `🛑 손절가 ${pos.sl} 도달`);
      }
    }

    if (pos.type === 'SHORT') {
      if (pos.tp && currentPrice <= pos.tp) {
        await liquidatePosition(client, guildId, userId, `🎯 목표가 ${pos.tp} 도달`);
      } else if (pos.sl && currentPrice >= pos.sl) {
        await liquidatePosition(client, guildId, userId, `🛑 손절가 ${pos.sl} 도달`);
      }
    }
  }

  setTimeout(() => monitorPositions(client), 2000);
}

module.exports = { monitorPositions };
