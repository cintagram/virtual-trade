const { getWallet, updateWallet } = require('../db/database');
const { createEmbed } = require('../utils/embed');

const ADMIN_USER_ID = '1129696291631419432';

async function handleRecharge(interaction) {
  if (interaction.user.id !== ADMIN_USER_ID) {
    await interaction.reply({ embeds: [createEmbed('권한 없음', '이 명령어를 사용할 권한이 없습니다.')], ephemeral: true });
    return;
  }

  const targetUser = interaction.options.getUser('유저');
  const amount = interaction.options.getNumber('금액');

  if (amount <= 0) {
    await interaction.reply({ embeds: [createEmbed('오류', '금액은 0보다 커야 합니다.')], ephemeral: true });
    return;
  }

  const wallet = getWallet(targetUser.id);
  const newBalance = wallet.balance + amount;
  updateWallet(targetUser.id, newBalance);

  await interaction.reply({
    embeds: [createEmbed('충전 완료', `${targetUser.tag} 님의 지갑에 ${amount.toFixed(2)} USDT가 충전되었습니다.\n잔고: ${newBalance.toFixed(2)} USDT`)],
  });
}

module.exports = { handleRecharge };
