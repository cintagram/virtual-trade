const { EmbedBuilder } = require('discord.js');

function createEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0x00BFFF)
    .setTimestamp();
}

module.exports = { createEmbed };
