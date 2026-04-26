import { REST, Routes } from 'discord.js';
import { config } from '../config.js';
import { data as statsCommand } from './stats.js';

const commands = [statsCommand.toJSON()];

const rest = new REST({ version: '10' }).setToken(config.token);

try {
  console.log(`Registrando ${commands.length} slash command(s) na guild ${config.guildId}...`);
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
    body: commands,
  });
  console.log('Slash commands registrados com sucesso.');
} catch (err) {
  console.error('Falha ao registrar slash commands:', err);
  process.exit(1);
}
