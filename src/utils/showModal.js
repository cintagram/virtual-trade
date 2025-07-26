const { updatePosition, getPosition } = require('../db/database');
const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');

async function showTpModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('set_tp_modal')
        .setTitle('🎯 목표가 설정');

    const input = new TextInputBuilder()
        .setCustomId('tp_input')
        .setLabel('목표가 (USDT)')
        .setPlaceholder('예: 38500')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function showSlModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('set_sl_modal')
        .setTitle('🛑 손절가 설정');

    const input = new TextInputBuilder()
        .setCustomId('sl_input')
        .setLabel('손절가 (USDT)')
        .setPlaceholder('예: 35000')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function saveTpFromModal(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const input = interaction.fields.getTextInputValue('tp_input');
    const tp = parseFloat(input);

    if (!isFinite(tp)) {
        return interaction.reply({ content: '❌ 숫자만 입력해주세요.', ephemeral: true });
    }

    const pos = getPosition(guildId, userId);
    if (!pos) {
        return interaction.reply({ content: '❌ 포지션이 없습니다.', ephemeral: true });
    }

    updatePosition(guildId, userId, { tp, sl: pos.sl });

    await interaction.reply({
        content: `🎯 목표가가 **${tp} USDT**로 저장되었습니다.`,
        ephemeral: true
    });
}

async function saveSlFromModal(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const input = interaction.fields.getTextInputValue('sl_input');
    const sl = parseFloat(input);

    if (!isFinite(sl)) {
        return interaction.reply({ content: '❌ 숫자만 입력해주세요.', ephemeral: true });
    }

    const pos = getPosition(guildId, userId);
    if (!pos) {
        return interaction.reply({ content: '❌ 포지션이 없습니다.', ephemeral: true });
    }

    updatePosition(guildId, userId, { tp: pos.tp, sl });

    await interaction.reply({
        content: `🛑 손절가가 **${sl} USDT**로 저장되었습니다.`,
        ephemeral: true
    });
}

module.exports = { showSlModal, showTpModal, saveSlFromModal, saveTpFromModal };