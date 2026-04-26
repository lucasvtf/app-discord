import cron from 'node-cron';
import { config } from './config.js';
import { buildReport } from './report.js';

export function startScheduler(client) {
  if (!cron.validate(config.reportCron)) {
    throw new Error(`REPORT_CRON invalido: "${config.reportCron}"`);
  }

  cron.schedule(
    config.reportCron,
    async () => {
      try {
        const channel = await client.channels.fetch(config.reportChannelId);
        if (!channel?.isTextBased()) {
          console.error('REPORT_CHANNEL_ID nao aponta para um canal de texto.');
          return;
        }
        const report = await buildReport(client, config.guildId, 'semana');
        await channel.send(report);
        console.log('[scheduler] relatorio semanal enviado.');
      } catch (err) {
        console.error('[scheduler] falha ao enviar relatorio:', err);
      }
    },
    { timezone: config.timezone },
  );

  console.log(`[scheduler] armado: ${config.reportCron} (${config.timezone})`);
}
