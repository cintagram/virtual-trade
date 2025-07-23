const { fetchPrice } = require('../utils/fetchPrice');
const { getWallet, updateWallet, getPosition, deletePosition, logTrade } = require('../db/database');
const { createEmbed } = require('../utils/embed');
const { applyFee } = require('../utils/fee');
const {
  ContainerBuilder,
  SectionBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder  
} = require('discord.js');

async function handleLiquidate(interaction) {
  // 버튼 인터랙션일 때도 대응하도록 수정
  if (!interaction.user) {
    await interaction.reply({ embeds: [createEmbed('오류', '사용자 정보를 찾을 수 없습니다.')] });
    return;
  }

  const userId = interaction.user.id;
  const pos = getPosition(userId);

  if (!pos) {
    await interaction.reply({ embeds: [createEmbed('포지션 없음', '현재 보유 중인 포지션이 없습니다.')], ephemeral: true });
    return;
  }

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
