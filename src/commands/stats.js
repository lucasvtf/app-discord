import { SlashCommandBuilder } from 'discord.js';
import { buildReport } from '../report.js';
import { PERIODS } from '../periods.js';
import { config } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Mostra tempo em call dos membros.')
  .addStringOption((opt) =>
    opt
      .setName('periodo')
      .setDescription('Periodo do relatorio')
      .addChoices(
        { name: 'Semana atual', value: 'semana' },
        { name: 'Mes atual', value: 'mes' },
        { name: 'Tudo', value: 'tudo' },
      ),
  );

export async function execute(interaction) {
  const period = interaction.options.getString('periodo') ?? 'semana';
  if (!PERIODS.includes(period)) {
    await interaction.reply({ content: 'Periodo invalido.', ephemeral: true });
    return;
  }

  await interaction.deferReply();
  const report = await buildReport(interaction.client, config.guildId, period);
  await interaction.editReply(report);
}
