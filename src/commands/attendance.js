const { getWallet, updateWallet } = require('../db/database');
const { getLastAttendance, setAttendanceToday } = require('../db/database');
const { createEmbed } = require('../utils/embed');

async function handleAttendance(interaction) {
  const userId = interaction.user.id;
  const guildId = interaction.guild.id;
  const today = new Date().toISOString().slice(0, 10); //yyyy-mm-dd

  const lastDate = getLastAttendance(guildId, userId);

  if (lastDate === today) {
    await interaction.reply({
      embeds: [createEmbed('출석체크 실패', '오늘 이미 출석체크를 하셨습니다.')],
      ephemeral: true
    });
    return;
  }

  const reward = 100;
  const wallet = getWallet(guildId, userId);

  updateWallet(guildId, userId, wallet.balance + reward);
  setAttendanceToday(guildId, userId, today);

  await interaction.reply({
    embeds: [createEmbed('✅ 출석체크 완료', `
출석 보상으로 **${reward} USDT**가 지급되었습니다.
현재 잔고: ${(wallet.balance + reward).toFixed(2)} USDT
    `)]
  });
}

module.exports = { handleAttendance };
