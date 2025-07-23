const { getWallet, updateWallet } = require('../db/database');

const ADMIN_ID = '1015868620259217470';
const FEE_RATE = 0.001 //0.1%

async function applyFee(userId, pnl) {
    if (!pnl || pnl === 0) return pnl;

    const fee = Math.abs(pnl) * FEE_RATE;
    if (fee <= 0) return pnl;

    const netPnl = pnl > 0 ? pnl - fee : pnl + fee;

    // 수수료는 따로 반영 (여기서 balance 조작 X)
    const adminWallet = await getWallet(ADMIN_ID);
    await updateWallet(ADMIN_ID, adminWallet.balance + fee);

    return netPnl;
}



module.exports = { applyFee };