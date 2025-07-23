const { getPosition, deletePosition, updateWallet, getWallet, logTrade } = require('../db/database');
const { fetchPrice } = require('../utils/fetchPrice');
const { applyFee } = require('../utils/fee');

async function liquidatePosition(client, userId, reason) {
    const pos = getPosition(userId);
    if (!pos) return;

    const currentPrice = await fetchPrice(pos.symbol);

    const wallet = getWallet(userId);

    // 포지션 진입 시 증거금(원금)은 포지션 생성 시 차감했으니, 청산 시엔 원금과 손익 모두 더해줘야 함
    //const entryCost = pos.amount * pos.entry / pos.leverage * pos.leverage; 
    // 단, pos.amount는 코인 수량, pos.entry는 진입 가격, 레버리지는 곱해져 있으므로,
    // pos.amount * pos.entry가 실제 USDT 투자 원금과 같음 (leverage는 곱할 필요 없음, 곱하면 금액이 과대 계산됨)
    
    // 그러니 entryCost는 아래처럼 단순 계산 가능
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
