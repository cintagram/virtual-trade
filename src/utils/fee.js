const { getWallet, updateWallet } = require('../db/database');

const ADMIN_ID = '1015868620259217470';
const FEE_RATE = 0.001 //0.1%

async function applyFee(userId, pnl) {
    if (!pnl || pnl === 0) return pnl;

    const fee = Math.abs(pnl) * FEE_RATE;
    if (fee <= 0) return pnl;

    const netPnl = pnl > 0 ? pnl - fee : pnl + fee;

    const adminWallet = await getWallet(1300099843125018705, ADMIN_ID);
    await updateWallet(1300099843125018705, ADMIN_ID, adminWallet.balance + fee);

    return netPnl;
}

module.exports = { applyFee };