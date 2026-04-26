import { closeOpenSession, openSession } from './db.js';

export function attachTracker(client) {
  client.on('voiceStateUpdate', (oldState, newState) => {
    const member = newState.member ?? oldState.member;
    if (!member || member.user.bot) return;

    const guildId = newState.guild.id;
    const userId = member.id;
    const oldChannel = oldState.channelId;
    const newChannel = newState.channelId;
    const ts = Date.now();

    if (oldChannel === newChannel) return;

    if (oldChannel) closeOpenSession(guildId, userId, ts);
    if (newChannel) openSession(guildId, userId, newChannel, ts);
  });
}
