const { fetchPrice } = require('../utils/fetchPrice');
const { getWallet, updateWallet, setPosition, getPosition } = require('../db/database');
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

async function handleSell(interaction) {
  const userId = interaction.user.id;
  const symbol = interaction.options.getString('코인');
  const usdtAmount = interaction.options.getNumber('usdt');  // 변경
  const leverage = interaction.options.getInteger('레버리지') || 5;

  if (leverage < 1 || leverage > 500) {
    await interaction.reply({ embeds: [createEmbed('❌ 오류', '레버리지는 1~500 사이여야 합니다.')] });
    return;
  }

  if (usdtAmount <= 0) {
    await interaction.reply({ embeds: [createEmbed('❌ 오류', 'USDT 금액은 0보다 커야 합니다.')] });
    return;
  }

  const price = await fetchPrice(symbol);
  const wallet = getWallet(userId);
  const amount = (usdtAmount * leverage) / price;
  const cost = usdtAmount;


  if (wallet.balance < cost) {
    await interaction.reply({ embeds: [createEmbed('❌ 잔고 부족', `잔고: ${wallet.balance.toFixed(2)} USDT, 필요한 금액: ${cost.toFixed(2)} USDT`)] });
    return;
  }

  updateWallet(userId, wallet.balance - cost);

  setPosition(userId, {
    symbol,
    type: 'SHORT',
    entry: price,
    amount,
    leverage
  });

  const pos = getPosition(userId);
  const currentPrice = price;
  const pnl = pos.type === 'LONG'
    ? (currentPrice - pos.entry) * pos.amount * pos.leverage
    : (pos.entry - currentPrice) * pos.amount * pos.leverage;

  const container = new ContainerBuilder()
    .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# :chart_with_downwards_trend: 숏 포지션 진입\n`
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
    

  if (interaction.replied || interaction.deferred) {
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

module.exports = { handleSell };
