const { getWallet, updateWallet } = require('../db/database');
const { createEmbed } = require('../utils/embed');

async function handleTransfer(interaction) {
  const fromUserId = interaction.user.id;
  const toUser = interaction.options.getUser('받는유저');
  const amount = interaction.options.getNumber('금액');

  if (toUser.id === fromUserId) {
    await interaction.reply({ embeds: [createEmbed('오류', '자기 자신에게는 송금할 수 없습니다.')], ephemeral: true });
    return;
  }

  if (amount <= 0) {
    await interaction.reply({ embeds: [createEmbed('오류', '금액은 0보다 커야 합니다.')], ephemeral: true });
    return;
  }

  const fromWallet = getWallet(fromUserId);
  if (fromWallet.balance < amount) {
    await interaction.reply({ embeds: [createEmbed('잔고 부족', `현재 잔고: ${fromWallet.balance.toFixed(2)} USDT`)], ephemeral: true });
    return;
  }

  const toWallet = getWallet(toUser.id);

  updateWallet(fromUserId, fromWallet.balance - amount);
  updateWallet(toUser.id, toWallet.balance + amount);

  await interaction.reply({
    embeds: [createEmbed('송금 완료', `
${interaction.user.tag} → ${toUser.tag}
금액: ${amount.toFixed(2)} USDT
내 잔고: ${(fromWallet.balance - amount).toFixed(2)} USDT
받는 사람 잔고: ${(toWallet.balance + amount).toFixed(2)} USDT
    `)]
  });
}

module.exports = { handleTransfer };
