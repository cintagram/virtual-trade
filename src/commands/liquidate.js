const { fetchPrice } = require('../utils/fetchPrice');
const { getWallet, updateWallet, getPosition, deletePosition, logTrade } = require('../db/database');
const { createEmbed } = require('../utils/embed');
const { applyFee } = require('../utils/fee');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');

async function handleLiquidate(interaction) {
  if (!interaction.user) {
    await interaction.reply({ embeds: [createEmbed('오류', '사용자 정보를 찾을 수 없습니다.')] });
    return;
  }

  const userId = interaction.user.id;
  const guildId = interaction.guild.id;
  const pos = getPosition(userId);

  if (!pos) {
    await interaction.reply({ embeds: [createEmbed('포지션 없음', '현재 서버에서 보유 중인 포지션이 없습니다.')], ephemeral: true });
    return;
  }

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


  const container = new ContainerBuilder()
    .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 💸 포지션 청산 완료\n`
        )
    )
    .addSeparatorComponents(
        new SeparatorBuilder().
        setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `- 손익: ${pnl.toFixed(2)} USDT\n` +
            `- 새 잔고: ${newBalance.toFixed(2)} USDT`
        )
    );

  if (interaction.isButton()) {
    await interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
  } else {
    await interaction.editReply({
      embeds: [
        createEmbed('💸 포지션 청산 완료', `
- 손익: ${pnl.toFixed(2)} USDT
- 새 잔고: ${newBalance.toFixed(2)} USDT
        `)
      ]
    });
  }
}

module.exports = { handleLiquidate };
