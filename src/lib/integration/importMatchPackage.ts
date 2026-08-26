import type { HandballPerformanceDB } from '../storage/db';
import type { CanonicalMatchPackage } from './matchContract';
import { MATCH_CONTRACT_SOURCE, MATCH_CONTRACT_VERSION } from './matchContract';

const ANDEBOL_STATS_SCHEMA = '1.2.0';

type AndebolStatsResultPackage = {
  schemaVersion: typeof ANDEBOL_STATS_SCHEMA;
  source: 'andebol-stats';
  match: CanonicalMatchPackage['match'];
  players: Array<CanonicalMatchPackage['players'][number]>;
  roster: CanonicalMatchPackage['roster'];
  events: CanonicalMatchPackage['events'];
  situations?: unknown[];
  statistics?: Record<string, unknown>;
  metadata?: { adapterVersion?: string; exportedAt?: string };
};

function isAndebolStatsResult(payload: unknown): payload is AndebolStatsResultPackage {
  const value = payload as AndebolStatsResultPackage;
  return !!value
    && typeof value === 'object'
    && value.schemaVersion === ANDEBOL_STATS_SCHEMA
    && value.source === 'andebol-stats'
    && !!value.match?.id
    && !!value.match?.ownTeamId
    && !!value.match?.homeTeamId
    && !!value.match?.awayTeamId
    && Array.isArray(value.players)
    && Array.isArray(value.roster)
    && Array.isArray(value.events);
}

function normalizeImportedPackage(payload: unknown): CanonicalMatchPackage {
  if (isAndebolStatsResult(payload)) {
    return {
      schemaVersion: MATCH_CONTRACT_VERSION,
      source: MATCH_CONTRACT_SOURCE,
      match: payload.match,
      players: payload.players,
      roster: payload.roster,
      events: payload.events,
      situations: payload.situations ?? [],
      statistics: payload.statistics ?? {},
      metadata: {
        adapterVersion: `andebol-stats/${payload.schemaVersion}`,
        exportedAt: payload.metadata?.exportedAt ?? new Date().toISOString(),
      },
    };
  }
  const value = payload as CanonicalMatchPackage;
  if (validateImportedMatchPackage(value)) return value;
  throw new Error('UNSUPPORTED_MATCH_PACKAGE');
}

export function validateImportedMatchPackage(payload: unknown): payload is CanonicalMatchPackage {
  const value = payload as CanonicalMatchPackage;
  return !!value
    && typeof value === 'object'
    && value.schemaVersion === MATCH_CONTRACT_VERSION
    && value.source === MATCH_CONTRACT_SOURCE
    && !!value.match?.id
    && !!value.match?.homeTeamId
    && !!value.match?.awayTeamId
    && Array.isArray(value.players)
    && Array.isArray(value.roster)
    && Array.isArray(value.events)
    && Array.isArray(value.situations)
    && typeof value.statistics === 'object'
    && !!value.metadata?.adapterVersion;
}

export async function importAndebolStatsResult(database: HandballPerformanceDB, payload: unknown) {
  const normalized = normalizeImportedPackage(payload);
  const existingMatch = await database.matches.get(normalized.match.id);
  if (!existingMatch) throw new Error('MATCH_NOT_FOUND');
  const now = new Date().toISOString();

  await database.transaction('rw', database.matches, database.matchSquads, database.events, database.players, async () => {
    const isAway = existingMatch.homeAway === 'AWAY';
    const ownScore = isAway ? normalized.match.awayScore : normalized.match.homeScore;
    const opponentScore = isAway ? normalized.match.homeScore : normalized.match.awayScore;

    await database.matches.update(normalized.match.id, {
      goalsFor: ownScore ?? existingMatch.goalsFor,
      goalsAgainst: opponentScore ?? existingMatch.goalsAgainst,
      status: normalized.match.status === 'finished' ? 'COMPLETED' : existingMatch.status,
      updatedAt: now,
    });

    const existingSquad = await database.matchSquads.where('matchId').equals(normalized.match.id).toArray();
    const existingSquadIds = new Set(existingSquad.map(item => item.id));
    for (const roster of normalized.roster) {
      const position = roster.position as never;
      if (existingSquadIds.has(roster.id)) {
        await database.matchSquads.update(roster.id, {
          starter: roster.starter,
          shirtNumber: roster.shirtNumber ?? undefined,
          position,
        });
      } else {
        await database.matchSquads.add({
          id: roster.id,
          matchId: normalized.match.id,
          playerId: roster.playerId,
          teamId: roster.teamId,
          starter: roster.starter,
          captain: false,
          shirtNumber: roster.shirtNumber ?? undefined,
          position,
        });
      }
    }

    for (const importedPlayer of normalized.players) {
      if (!importedPlayer.hpi) continue;
      const current = await database.players.get(importedPlayer.id);
      if (!current) continue;
      const snapshot = { ...importedPlayer.hpi, matchId: normalized.match.id, updatedAt: importedPlayer.hpi.updatedAt || now };
      const history = (current.hpiHistory ?? []).filter(item => item.matchId !== normalized.match.id);
      history.push(snapshot);
      history.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      await database.players.update(current.id, { hpi: snapshot, hpiHistory: history.slice(-50), updatedAt: now });
    }

    const existingEvents = await database.events.where('matchId').equals(normalized.match.id).toArray();
    const existingEventIds = new Set(existingEvents.map(event => event.id));
    for (const event of normalized.events) {
      const shot = event.metadata?.shot;
      const record = {
        id: event.id,
        matchId: normalized.match.id,
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
