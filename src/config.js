import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Variavel de ambiente ${name} nao definida. Copie .env.example para .env e preencha.`);
  }
  return value.trim();
}

export const config = {
  token: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  guildId: required('GUILD_ID'),
  reportChannelId: required('REPORT_CHANNEL_ID'),
  timezone: process.env.TIMEZONE?.trim() || 'America/Sao_Paulo',
  reportCron: process.env.REPORT_CRON?.trim() || '0 18 * * 5',
};
