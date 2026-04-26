import { Client, Events, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { attachTracker } from './tracker.js';
import { reconcile } from './reconcile.js';
import { startScheduler } from './scheduler.js';
import { execute as executeStats, data as statsData } from './commands/stats.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

const handlers = new Map([[statsData.name, executeStats]]);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const handler = handlers.get(interaction.commandName);
  if (!handler) return;
  try {
    await handler(interaction);
  } catch (err) {
    console.error(`Erro no comando ${interaction.commandName}:`, err);
    const reply = { content: 'Erro ao executar o comando.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

client.once(Events.ClientReady, async (c) => {
  console.log(`Logado como ${c.user.tag}`);
  try {
    await reconcile(c, config.guildId);
  } catch (err) {
    console.error('Falha na reconciliacao:', err);
  }
  attachTracker(c);
  startScheduler(c);
});

function shutdown(signal) {
  console.log(`\nRecebido ${signal}, encerrando...`);
  client.destroy().finally(() => process.exit(0));
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

client.login(config.token);
