import type { HandballPerformanceDB } from '../storage/db';
import type { MatchEvent, MatchSquad } from '../storage/types';
import { buildPreMatchStats, type PreMatchStats } from './preMatchStats';

export const MATCH_CONTRACT_VERSION = '1.1.0';
export const MATCH_CONTRACT_SOURCE = 'handball-performance-os';

export type CanonicalShot = {
  shooterId?: string | null;
  position?: string | null;
  zone?: string | null;
  distance?: string | null;
  type?: string | null;
  outcome?: string | null;
  xg?: number | null;
};

export type CanonicalEvent = {
  id: string;
  matchId: string;
  period: 1 | 2;
  gameTime: number;
  teamId?: string | null;
  playerId?: string | null;
  type: string;
  metadata?: { shot?: CanonicalShot; [key: string]: unknown };
};

export type CanonicalMatchPackage = {
  schemaVersion: typeof MATCH_CONTRACT_VERSION;
  source: typeof MATCH_CONTRACT_SOURCE;
  match: {
    id: string;
    seasonId: string;
    competitionId?: string | null;
    date: string;
    venue?: string | null;
    homeTeamId: string;
    awayTeamId?: string | null;
    homeTeamName: string;
    awayTeamName: string;
    ownTeamId: string;
    ownTeamName: string;
    homeAway: 'HOME' | 'AWAY' | 'NEUTRAL';
    status: 'planned' | 'live' | 'finished';
    durationMinutes: number;
    currentPeriod: 1 | 2;
    gameTime: number;
    homeScore?: number;
    awayScore?: number;
  };
  players: Array<{ id: string; name: string; shirtNumber?: number | null; position?: string; teamId: string; active: boolean }>;
  roster: Array<{ id: string; playerId: string; teamId?: string; shirtNumber?: number | null; position?: string; starter: boolean; available: boolean }>;
  events: CanonicalEvent[];
  situations: unknown[];
  statistics: Record<string, unknown>;
  preMatchStats: PreMatchStats;
  metadata: { adapterVersion: string; exportedAt: string };
};

const outcome = (event: MatchEvent) => event.result ?? (event.type === 'GOAL' ? 'goal' : null);

export async function exportMatchPackage(database: HandballPerformanceDB, matchId: string): Promise<CanonicalMatchPackage> {
  const match = await database.matches.get(matchId);
  if (!match) throw new Error('MATCH_NOT_FOUND');

  const [ownTeam, opponentTeam, players, roster, events, preMatchStats] = await Promise.all([
    database.teams.get(match.teamId),
    match.opponentTeamId ? database.teams.get(match.opponentTeamId) : Promise.resolve(undefined),
    database.players.toArray(),
    database.matchSquads.where('matchId').equals(matchId).toArray(),
    database.events.where('matchId').equals(matchId).sortBy('timestampSeconds'),
    buildPreMatchStats(database, matchId),
  ]);

  const homeAway = match.homeAway === 'AWAY';
  const homeTeamId = homeAway ? match.opponentTeamId ?? '' : match.teamId;
  const awayTeamId = homeAway ? match.teamId : match.opponentTeamId ?? '';
  const homeTeamName = homeAway ? opponentTeam?.name ?? match.opponentName : ownTeam?.name ?? match.teamId;
  const awayTeamName = homeAway ? ownTeam?.name ?? match.teamId : opponentTeam?.name ?? match.opponentName;
  const ownTeamName = ownTeam?.name ?? match.teamId;
  const rosterForMatch = roster.filter(item => players.some(player => player.id === item.playerId));
  const teamPlayers = new Map(players.map(player => [player.id, player]));

  const canonicalPlayers = rosterForMatch.map(item => {
    const player = teamPlayers.get(item.playerId)!;
    return {
      id: player.id,
      name: player.displayName,
      shirtNumber: item.shirtNumber ?? player.shirtNumber ?? null,
      position: item.position ?? player.position,
      teamId: item.teamId ?? match.teamId,
      active: player.active,
    };
  });

  const canonicalRoster = rosterForMatch.map((item: MatchSquad) => ({
    id: item.id,
    playerId: item.playerId,
    teamId: item.teamId ?? match.teamId,
    shirtNumber: item.shirtNumber ?? null,
    position: item.position,
    starter: item.starter,
    available: true,
  }));

  const canonicalEvents: CanonicalEvent[] = events.map(event => ({
    id: event.id,
    matchId: event.matchId,
    period: event.period ?? 1,
    gameTime: event.timestampSeconds,
    teamId: event.teamId ?? match.teamId,
    playerId: event.playerId ?? null,
    type: event.type.toLowerCase(),
    metadata: event.shotType || event.zone || event.distance || event.attackPhase || event.xg != null
      ? {
          shot: {
            shooterId: event.playerId ?? null,
            position: event.position ?? null,
            zone: event.zone ?? null,
            distance: event.distance ?? null,
            type: event.shotType ?? null,
            outcome: outcome(event),
            xg: event.xg ?? null,
          },
          source: MATCH_CONTRACT_SOURCE,
        }
      : { source: MATCH_CONTRACT_SOURCE },
  }));

  const orientation = match.homeAway === 'NEUTRAL' ? 'NEUTRAL' : match.homeAway;

  return {
    schemaVersion: MATCH_CONTRACT_VERSION,
    source: MATCH_CONTRACT_SOURCE,
    match: {
      id: match.id,
      seasonId: match.seasonId,
      competitionId: match.competitionId ?? null,
      date: match.date,
      venue: match.venue ?? null,
      homeTeamId,
      awayTeamId,
      homeTeamName,
      awayTeamName,
      ownTeamId: match.teamId,
      ownTeamName,
      homeAway: orientation,
      status: match.status === 'COMPLETED' ? 'finished' : match.status === 'IN_PROGRESS' ? 'live' : 'planned',
      durationMinutes: 30,
      currentPeriod: 1,
      gameTime: 0,
      homeScore: homeAway ? match.goalsAgainst ?? 0 : match.goalsFor ?? 0,
      awayScore: homeAway ? match.goalsFor ?? 0 : match.goalsAgainst ?? 0,
    },
    players: canonicalPlayers,
    roster: canonicalRoster,
    events: canonicalEvents,
    situations: [],
    statistics: {},
    preMatchStats,
    metadata: { adapterVersion: MATCH_CONTRACT_VERSION, exportedAt: new Date().toISOString() },
  };
}

export function validateMatchPackage(payload: unknown): payload is CanonicalMatchPackage {
  const value = payload as CanonicalMatchPackage;
  return !!value
    && typeof value === 'object'
    && value.schemaVersion === MATCH_CONTRACT_VERSION
    && value.source === MATCH_CONTRACT_SOURCE
    && !!value.match?.id
    && !!value.match?.homeTeamId
    && !!value.match?.awayTeamId
    && !!value.match?.ownTeamId
    && !!value.match?.homeAway
    && Array.isArray(value.players)
    && Array.isArray(value.roster)
    && Array.isArray(value.events)
    && Array.isArray(value.situations)
    && typeof value.statistics === 'object'
    && typeof value.preMatchStats === 'object'
    && !!value.preMatchStats?.version
    && !!value.metadata?.adapterVersion;
}
