const { getWallet } = require('../db/database');
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

async function handleWallet(interaction) {
  const userId = interaction.user.id;
  const wallet = getWallet(userId);

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# :money_with_wings: 내 지갑\n`
        )
    )
    .addSeparatorComponents(
        new SeparatorBuilder().
        setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `보유액: **${wallet.balance.toFixed(2)} USDT**`
        )
    )
    .addSeparatorComponents(
        new SeparatorBuilder().
        setSpacing(SeparatorSpacingSize.Large)
    )
    .addActionRowComponents(
        new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('recordsBtn_fromWallet')
                    .setLabel('🕒 거래내역')
                    .setStyle(ButtonStyle.Primary),
            )
    )
    
    await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2
    });
}

module.exports = { handleWallet };
