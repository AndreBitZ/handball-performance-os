import type { HandballPerformanceDB } from '../storage/db';
import type { CanonicalMatchPackage } from './matchContract';

export function validateImportedMatchPackage(payload: unknown): payload is CanonicalMatchPackage {
  const value = payload as CanonicalMatchPackage;
  return !!value && typeof value === 'object' && value.schemaVersion === '1.1' && !!value.match?.id && Array.isArray(value.players) && Array.isArray(value.roster) && Array.isArray(value.events);
}

export async function importAndebolStatsResult(database: HandballPerformanceDB, payload: CanonicalMatchPackage) {
  if (!validateImportedMatchPackage(payload)) throw new Error('UNSUPPORTED_MATCH_PACKAGE');
  const existingMatch = await database.matches.get(payload.match.id);
  if (!existingMatch) throw new Error('MATCH_NOT_FOUND');

  const now = new Date().toISOString();
  await database.transaction('rw', database.matches, database.matchSquads, database.events, async () => {
    await database.matches.update(payload.match.id, {
      goalsFor: payload.match.homeScore ?? existingMatch.goalsFor,
      goalsAgainst: payload.match.awayScore ?? existingMatch.goalsAgainst,
      status: payload.match.status === 'finished' ? 'COMPLETED' : existingMatch.status,
      updatedAt: now,
    });

    const existingSquad = await database.matchSquads.where('matchId').equals(payload.match.id).toArray();
    const existingSquadIds = new Set(existingSquad.map(item => item.id));
    for (const roster of payload.roster) {
      if (existingSquadIds.has(roster.id)) {
        await database.matchSquads.update(roster.id, { starter: roster.starter, shirtNumber: roster.shirtNumber ?? undefined, position: roster.position as never });
      } else {
        await database.matchSquads.add({ id: roster.id, matchId: payload.match.id, playerId: roster.playerId, teamId: roster.teamId, starter: roster.starter, captain: false, shirtNumber: roster.shirtNumber ?? undefined, position: roster.position as never });
      }
    }

    const existingEvents = await database.events.where('matchId').equals(payload.match.id).toArray();
    const existingEventIds = new Set(existingEvents.map(event => event.id));
    for (const event of payload.events) {
      const shot = event.metadata?.shot;
      const record = {
        id: event.id,
        matchId: payload.match.id,
        timestampSeconds: Number(event.gameTime),
        period: event.period,
        type: event.type,
        teamId: event.teamId ?? undefined,
        playerId: event.playerId ?? undefined,
        position: shot?.position as never,
        zone: shot?.zone ?? undefined,
        distance: shot?.distance ?? undefined,
        shotType: shot?.type ?? undefined,
        result: shot?.outcome ?? undefined,
        xg: shot?.xg ?? undefined,
        createdAt: now,
        updatedAt: now,
      };
      if (existingEventIds.has(event.id)) await database.events.update(event.id, record);
      else await database.events.add(record);
    }
  });
}
