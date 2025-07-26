process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { monitorPositions } = require('./engine');
const { getWallet, updateWallet, getPosition, deletePosition } = require('./db/database');
const { showTpModal, showSlModal, saveTpFromModal, saveSlFromModal } = require('./utils/showModal');

//명령어 로직
const { handleWallet } = require('./commands/wallet');
const { handleBuy } = require('./commands/buy');
const { handlePosition } = require('./commands/position');
const { handleLiquidate } = require('./commands/liquidate');
const { handleSell } = require('./commands/sell');
const { handleRecharge } = require('./commands/recharge');
const { handleTransfer } = require('./commands/transfer');
const { handleAttendance } = require('./commands/attendance');
const { handleRecords } = require('./commands/records');
const { helpCommand } = require('./commands/help');
const { leaderboard } = require('./commands/leaderboard');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  new SlashCommandBuilder().setName('지갑').setDescription('내 지갑 확인하고 시작하기.'),
  new SlashCommandBuilder()
    .setName('매수')
    .setDescription('롱 포지션 진입 (잔고 차감)')
    .addStringOption(option =>
      option.setName('코인')
        .setDescription('코인 종류')
        .setRequired(true)
        .addChoices(
          { name: 'BTC', value: 'BTCUSDT' },
          { name: 'ETH', value: 'ETHUSDT' },
          { name: 'SOL', value: 'SOLUSDT' }
        )
    )
    .addNumberOption(option =>
      option.setName('usdt')
        .setDescription('투자할 USDT 금액')
        .setRequired(true)
    )
    .addIntegerOption(option =>
        option.setName('레버리지')
          .setDescription('레버리지 (1~100, 기본 5)')
          .setRequired(false)
      ),
  new SlashCommandBuilder()
      .setName('매도')
      .setDescription('숏 포지션 진입 (잔고 차감)')
      .addStringOption(option =>
        option.setName('코인')
          .setDescription('BTC 또는 ETH')
          .setRequired(true)
          .addChoices(
            { name: 'BTC', value: 'BTCUSDT' },
            { name: 'ETH', value: 'ETHUSDT' }
          )
      )
      .addNumberOption(option =>
        option.setName('usdt')
          .setDescription('투자할 USDT금액')
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option.setName('레버리지')
          .setDescription('레버리지 (1~100, 기본 5)')
          .setRequired(false)
      ),
    
  new SlashCommandBuilder()
  .setName('충전')
  .setDescription('관리자 전용: 유저 지갑에 수동으로 충전')
  .addUserOption(option =>
    option.setName('유저')
      .setDescription('충전할 유저를 선택')
      .setRequired(true))
  .addNumberOption(option =>
    option.setName('금액')
      .setDescription('충전할 USDT 금액')
      .setRequired(true)
    ),

  new SlashCommandBuilder()
  .setName('송금')
  .setDescription('다른 유저에게 USDT 송금')
  .addUserOption(option =>
    option.setName('받는유저')
      .setDescription('USDT를 받을 유저')
      .setRequired(true))
  .addNumberOption(option =>
    option.setName('금액')
      .setDescription('송금할 USDT 금액')
      .setRequired(true)
    ),
    
  new SlashCommandBuilder()
  .setName('출석')
  .setDescription('하루 1회 출석체크 후 보상 지급'),
    
  new SlashCommandBuilder().setName('포지션').setDescription('현재 내 포지션 확인'),
  new SlashCommandBuilder().setName('도움말').setDescription('도움말 확인하기'),
  new SlashCommandBuilder()
    .setName('리더보드')
    .setDescription('서버 내 가상 자산 보유량 리더보드를 보여줍니다.'),
  new SlashCommandBuilder()
  .setName('거래내역')
  .setDescription('최근 7일간 거래 내역을 확인합니다.'),

].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

client.once('ready', () => {
  console.log(`✅ 봇 로그인됨: ${client.user.tag}`);
  monitorPositions(client);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    switch (interaction.commandName) {
      case '지갑':
        await handleWallet(interaction);
        break;
      case '매수':
        await handleBuy(interaction);
        break;
      case '매도':
        await handleSell(interaction);
        break;
      case '포지션':
        await handlePosition(interaction);
        break;
      case '충전':
        await handleRecharge(interaction);
        break;
      case '송금':
        await handleTransfer(interaction);
        break;
      case '출석':
        await handleAttendance(interaction);
        break;
      case 'set_tp':
        await showTpModal(interaction);
        break;
      case 'set_sl':
        await showSlModal(interaction);
        break;
      case 'liquidate_position':
        await handleLiquidate(interaction);
        break;
      case '거래내역':
        await handleRecords(interaction);
        break;
      case '도움말':
        await helpCommand(interaction);
        break;
      case '리더보드':
        await leaderboard(interaction);
        break;

    }
  } else if (interaction.isButton()) {
    const pos = getPosition(interaction.user.id);
    if (interaction.customId === 'liquidate_position') {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate();
      }
      await handleLiquidate(interaction);
    } else if (interaction.customId === 'set_tp') {
        return showTpModal(interaction, pos);
    } else if (interaction.customId === 'set_sl') {
        return showSlModal(interaction, pos);
    } else if (interaction.customId === 'refresh_position') {
        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferUpdate();
        }
        await handlePosition(interaction, true);
    } else if (interaction.customId === 'show_pnl_chart') {
        const { execute: showPnlChart } = require('./interactions/pnlChart');
        await showPnlChart(interaction);
    } else if (interaction.customId === 'recordsBtn_fromWallet') {
        await handleRecords(interaction, true);
    }


      
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === 'set_tp_modal') {
      await saveTpFromModal(interaction);
    } else if (interaction.customId === 'set_sl_modal') {
      await saveSlFromModal(interaction);
    }
  }
});

client.login(process.env.BOT_TOKEN);
