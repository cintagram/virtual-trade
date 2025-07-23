const { db } = require('../db/database');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { formatDateShort } = require('../utils/date');

async function execute(interaction) {
  const userId = interaction.user.id;

  const trades = db.prepare(`
    SELECT * FROM trades
    WHERE user_id = ?
    ORDER BY timestamp ASC
    LIMIT 7
  `).all(userId);

  if (trades.length === 0) {
    return interaction.reply({
      content: 'PnL 데이터가 없습니다.',
      ephemeral: true,
    });
  }

  const labels = trades.map(t => formatDateShort(t.timestamp));
  const pnlData = trades.map(t => parseFloat(t.pnl?.toFixed(2)) || 0);

  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify({
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'PnL',
            data: pnlData,
            borderColor: 'rgba(0, 200, 255, 1)',
            backgroundColor: 'rgba(0, 200, 255, 0.2)',
            fill: true,
            tension: 0.3,
            segment: {
              backgroundColor: ctx => {
                return ctx.p0.parsed.y < 0 ? 'rgba(255, 99, 132, 0.3)' : 'rgba(0, 200, 255, 0.2)';
              },
              borderColor: ctx => {
                return ctx.p0.parsed.y < 0 ? 'rgba(255, 99, 132, 1)' : 'rgba(0, 200, 255, 1)';
              },
            },
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            labels: {
              color: '#ffffff',
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#ffffff' },
          },
          y: {
            ticks: { color: '#ffffff' },
          },
        },
        backgroundColor: '#1e1e2f',
      },
    }))}`;


  const embed = new EmbedBuilder()
    .setTitle('📊 최근 7일간 PnL 그래프')
    .setImage(chartUrl)
    .setColor('#00bcd4');

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

module.exports = { execute };
