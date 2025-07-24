const { db } = require('./db/database');
const { fetchPrice } = require('./utils/fetchPrice');
const { liquidatePosition } = require('./utils/autoLiquidator');

async function monitorPositions(client) {
    const rows = db.prepare(`SELECT userId FROM positions`).all();

    for (const { userId } of rows) {
        const pos = db.prepare(`SELECT * FROM positions WHERE userId = ?`).get(userId);
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
            await liquidatePosition(client, userId, `⚠️ 강제청산 트리거됨: 청산가 ${liquidationPrice.toFixed(4)} USDT`);
            continue;  // 이미 청산됐으니 다음 포지션으로
        }

        // ✅ TP / SL 체크
        if (pos.type === 'LONG') {
            if (pos.tp && currentPrice >= pos.tp) {
                await liquidatePosition(client, userId, `🎯 목표가 ${pos.tp} 도달`);
            } else if (pos.sl && currentPrice <= pos.sl) {
                await liquidatePosition(client, userId, `🛑 손절가 ${pos.sl} 도달`);
            }
        }

        if (pos.type === 'SHORT') {
            if (pos.tp && currentPrice <= pos.tp) {
                await liquidatePosition(client, userId, `🎯 목표가 ${pos.tp} 도달`);
            } else if (pos.sl && currentPrice >= pos.sl) {
                await liquidatePosition(client, userId, `🛑 손절가 ${pos.sl} 도달`);
            }
        }
    }

    setTimeout(() => monitorPositions(client), 5000);
}

module.exports = { monitorPositions };
