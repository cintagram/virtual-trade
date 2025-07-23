const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { db } = require('../db/database');
const { formatDate } = require('../utils/date');

async function handleRecords(interaction, fromWallet = false) {
  const userId = interaction.user.id;

  const results = db.prepare(`
    SELECT * FROM trades
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT 7
  `).all(userId);

  if (results.length === 0) {
    return interaction.reply({
      content: '최근 7일간의 거래 내역이 없습니다.',
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`📈 최근 거래 내역`)
    .setColor('#00bcd4');

  for (const trade of results.reverse()) {
    const timestamp = formatDate(trade.timestamp);
    console.log(trade.timestamp);
    embed.addFields({
      name: `${timestamp} - ${trade.symbol.replace('USDT', '')} (${trade.type})`,
      value: `> 진입가: **${trade.entry_price}**\n> 청산가: **${trade.exit_price || '진행 중'}**\n> PNL: **${trade.pnl?.toFixed(2) ?? '미정'} USDT**`,
      inline: false,
    });
  }
  if (fromWallet === false) { 
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('show_pnl_chart')
          .setLabel('📊 PnL 그래프 보기')
          .setStyle(ButtonStyle.Primary)
      );
    
      return interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
  } else {
      return interaction.reply({ embeds: [embed], ephemeral: false });
  }
}

module.exports = { handleRecords };
