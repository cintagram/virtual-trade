const { getPosition, deletePosition, updateWallet, getWallet, logTrade } = require('../db/database');
const { fetchPrice } = require('../utils/fetchPrice');
const { applyFee } = require('../utils/fee');

async function liquidatePosition(client, userId, reason) {
    const pos = getPosition(userId);
    if (!pos) return;

    const currentPrice = await fetchPrice(pos.symbol);

    const wallet = getWallet(userId);
    const entryCost = pos.amount * pos.entry / pos.leverage;
    let pnl = 0;

    if (pos.type === 'LONG') {
        pnl = (currentPrice - pos.entry) * pos.amount * pos.leverage;
    } else if (pos.type === 'SHORT') {
        pnl = (pos.entry - currentPrice) * pos.amount * pos.leverage;
    }

    const netPnl = await applyFee(userId, pnl);
    const newBalance = wallet.balance + entryCost + netPnl;
    updateWallet(userId, newBalance);
    deletePosition(userId);

    const user = await client.users.fetch(userId);
    await user.send(`💸 포지션 자동 청산!\n${reason}\n손익: ${pnl.toFixed(2)} USDT\n잔고: ${newBalance.toFixed(2)} USDT`);

    console.log(`[청산] ${userId} ${pos.symbol} ${pos.type} | ${reason} | PNL: ${pnl.toFixed(2)}`);
}

module.exports = { liquidatePosition };
