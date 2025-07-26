const { fetchPrice } = require('../utils/fetchPrice');
const { getPosition } = require('../db/database');
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

async function handlePosition(interaction, refresh = false) {
  const userId = interaction.user.id;
  const guildId = interaction.guild.id;
  const pos = getPosition(guildId, userId);

  if (!pos) {
    await interaction.reply({
      content: '현재 보유 중인 포지션이 없습니다.',
      ephemeral: true
    });
    return;
  }

  const currentPrice = await fetchPrice(pos.symbol);
  const pnl = pos.type === 'LONG'
    ? (currentPrice - pos.entry) * pos.amount * pos.leverage
    : (pos.entry - currentPrice) * pos.amount * pos.leverage;

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# 📊 현재 포지션 정보\n`
        )
    )
    .addSeparatorComponents(
        new SeparatorBuilder().
        setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `코인: \`${pos.symbol.replace('USDT', '')}\`\n` +
            `타입: \`${pos.type}\`\n` +
            `진입가: \`${pos.entry}\`\n` +
            `현재가: \`${currentPrice}\`\n` +
            `수량: \`${pos.amount}\` ${pos.symbol.replace('USDT', '')}\n` +
            `레버리지: \`${pos.leverage}x\`\n` +
            `손익: \`${pnl.toFixed(2)} USDT\`\n` +
            `목표가: \`${pos.tp ?? '미설정'}\`\n` +
            `손절가: \`${pos.sl ?? '미설정'}\``
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
                    .setCustomId('set_tp')
                    .setLabel('🎯 목표가 설정')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('set_sl')
                    .setLabel('🛑 손절가 설정')
                    .setStyle(ButtonStyle.Danger)
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
                    .setCustomId('liquidate_position')
                    .setLabel('💸 포지션 청산')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('refresh_position')
                    .setLabel('↻')
                    .setStyle(ButtonStyle.Secondary)
            )
    );
    

  if (refresh == true) {
        await interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    } else {
        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
}



module.exports = { handlePosition };
