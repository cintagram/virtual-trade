const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../db/database'); // better-sqlite3 연결된 객체를 불러옴


async function leaderboard(interaction) {
    const guildId = interaction.guild.id;

    const topUsers = db.prepare(`
        SELECT userId, balance
        FROM wallets
        WHERE guildId = ?
        ORDER BY balance DESC
        LIMIT 10;
    `).all(guildId);

    if (topUsers.length === 0) {
        return interaction.reply({
        content: '💡 이 서버에는 아직 리더보드에 등록된 유저가 없습니다.',
        ephemeral: true
        });
    }

    const leaderboard = topUsers.map((user, index) => {
        const mention = `<@${user.userId}>`;
        const formattedBalance = user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `**${index + 1}.** ${mention} — \`${formattedBalance} USDT\``;
    }).join('\n');

    const embed = new EmbedBuilder()
        .setTitle(`🏆 서버 리더보드`)
        .setDescription(leaderboard)
        .setColor(0xFFD700)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

module.exports = { leaderboard };
