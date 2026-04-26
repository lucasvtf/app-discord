import { closeOpenSession, getAllOpenSessions, openSession } from './db.js';

/**
 * Reconcile DB open sessions with current voice state.
 * Closes sessions for users no longer in voice; opens sessions for users
 * currently in voice that have no open record (e.g. joined while bot was off).
 */
export async function reconcile(client, guildId) {
  const guild = await client.guilds.fetch(guildId);
  await guild.members.fetch();

  const now = Date.now();
  const open = getAllOpenSessions().filter((s) => s.guild_id === guildId);
  const openByUser = new Map(open.map((s) => [s.user_id, s]));

  let closed = 0;
  let opened = 0;

  for (const [, voiceState] of guild.voiceStates.cache) {
    if (voiceState.member?.user.bot) continue;
    if (!voiceState.channelId) continue;
    const existing = openByUser.get(voiceState.id);
    if (existing && existing.channel_id === voiceState.channelId) {
      openByUser.delete(voiceState.id);
      continue;
    }
    if (existing) {
      closeOpenSession(guildId, voiceState.id, now);
      openByUser.delete(voiceState.id);
      closed++;
    }
    openSession(guildId, voiceState.id, voiceState.channelId, now);
    opened++;
  }

  for (const session of openByUser.values()) {
    closeOpenSession(guildId, session.user_id, now);
    closed++;
  }

  console.log(`[reconcile] sessoes fechadas: ${closed}, abertas: ${opened}`);
}
