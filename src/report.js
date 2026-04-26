import { EmbedBuilder } from 'discord.js';
import dayjs from 'dayjs';
import { aggregatePerChannel, aggregatePerUser, longestSession } from './db.js';
import { formatDuration, padTable } from './format.js';
import { getRange } from './periods.js';
import { config } from './config.js';

const TOP_N = 10;

async function resolveDisplayName(guild, userId) {
  try {
    const member = await guild.members.fetch(userId);
    return member.displayName;
  } catch {
    try {
      const user = await guild.client.users.fetch(userId);
      return user.username;
    } catch {
      return userId;
    }
  }
}

function resolveChannelName(guild, channelId) {
  const channel = guild.channels.cache.get(channelId);
  return channel ? channel.name : channelId;
}

export async function buildReport(client, guildId, period) {
  const guild = await client.guilds.fetch(guildId);
  const range = getRange(period, config.timezone);
  const now = Date.now();

  const top = aggregatePerUser(guildId, range.from, range.to, now, TOP_N);
  const topChannel = aggregatePerChannel(guildId, range.from, range.to, now);
  const longest = longestSession(guildId, range.from, range.to, now);

  const embed = new EmbedBuilder()
    .setTitle(`Tempo em Call - ${range.label}`)
    .setColor(0x5865f2)
    .setFooter({ text: `Gerado em ${dayjs().tz(config.timezone).format('DD/MM HH:mm')}` });

  if (top.length === 0) {
    embed.setDescription('Nenhuma sessao de call registrada no periodo.');
    return { embeds: [embed] };
  }

  const names = await Promise.all(top.map((row) => resolveDisplayName(guild, row.user_id)));
  const tableRows = top.map((row, i) => [
    String(i + 1),
    names[i].slice(0, 20),
    formatDuration(row.total_ms),
    String(row.sessions),
  ]);
  const table = padTable(tableRows, ['#', 'Usuario', 'Tempo', 'Sessoes']);

  embed.addFields({ name: 'Ranking', value: '```\n' + table + '\n```' });

  if (longest && longest.duration > 0) {
    const longestUser = await resolveDisplayName(guild, longest.user_id);
    const longestChannel = resolveChannelName(guild, longest.channel_id);
    embed.addFields({
      name: 'Sessao mais longa',
      value: `${longestUser} - ${formatDuration(longest.duration)} em #${longestChannel}`,
    });
  }

  if (topChannel) {
    const channelName = resolveChannelName(guild, topChannel.channel_id);
    embed.addFields({
      name: 'Canal mais usado',
      value: `#${channelName} - ${formatDuration(topChannel.total_ms)}`,
    });
  }

  return { embeds: [embed] };
}
