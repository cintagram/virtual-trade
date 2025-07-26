const { SlashCommandBuilder } = require('discord.js');
const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags
} = require('discord.js');

async function helpCommand(interaction) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            `# 💸 가상 선물 거래,\n**이제 디스코드에서 간편하게**\n\n` +
            `코인 투자, 어렵고 무섭게만 느껴졌나요?\n` +
            `이제는 연습부터 재미까지, 봇 하나로 시작해보세요.`
          )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            `## 🔑 **시작은 간단해요**\n` +
            `• /지갑 — 지갑 생성 및 초기 자산 지급\n` +
            `• /매수 — 원하는 코인 롱 진입\n` +
            `• /매도 — 원하는 코인 숏 진입`
          )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            `## ⚙️ **이런 기능도 있어요**\n` +
            `• 실시간 수익 계산 및 수수료 반영\n` +
            `• 목표가(TP) / 손절가(SL) 설정 지원\n` +
            `• 리더보드로 서버 내 수익률 경쟁\n` +
            `• 개별 지갑 안전 관리`
          )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            `## 🧪 **이 봇은…**\n` +
            `> 실제 자산 거래가 아니에요.\n` +
            `> 재미와 연습을 위한 가상 선물 시뮬레이터예요!`
          )
      );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
};


module.exports = { helpCommand };