const { getPosition, deletePosition, updateWallet, getWallet, logTrade } = require('../db/database');
const { fetchPrice } = require('../utils/fetchPrice');
const { applyFee } = require('../utils/fee');

async function liquidatePosition(client, guildId, userId, reason) {
    const pos = getPosition(guildId, userId);
    if (!pos) return;

    const currentPrice = await fetchPrice(pos.symbol);

    const wallet = getWallet(guildId, userId);
    const entryCost = pos.amount * pos.entry / pos.leverage;
    let pnl = 0;

    if (pos.type === 'LONG') {
        pnl = (currentPrice - pos.entry) * pos.amount * pos.leverage;
    } else if (pos.type === 'SHORT') {
        pnl = (pos.entry - currentPrice) * pos.amount * pos.leverage;
    }

    const netPnl = await applyFee(userId, pnl);
    const newBalance = wallet.balance + entryCost + netPnl;
    updateWallet(guildId, userId, newBalance);
    await logTrade({
    guildId,
    userId,
    symbol: pos.symbol,
    type: pos.type,
    entryPrice: pos.entry,
    exitPrice: currentPrice,
    amount: pos.amount,
    leverage: pos.leverage,
    pnl,
    timestamp: Math.floor(Date.now() / 1000)
});
    deletePosition(guildId, userId);

    const user = await client.users.fetch(userId);
    const guild = await client.guilds.fetch(guildId);
    const guildName = guild?.name || '알 수 없는 서버';

    await user.send(
        `💸 포지션 자동 청산!\n` +
        `서버: **${guildName}**\n` +
        `${reason}\n` +
        `손익: ${pnl.toFixed(2)} USDT\n` +
        `잔고: ${newBalance.toFixed(2)} USDT`
    );

    console.log(`[청산] ${userId} | 서버: ${guildName} | ${pos.symbol} ${pos.type} | ${reason} | PNL: ${pnl.toFixed(2)}`);
}

module.exports = { liquidatePosition };
