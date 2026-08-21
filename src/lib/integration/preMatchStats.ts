import type { HandballPerformanceDB } from '../storage/db';
import type { MatchEvent } from '../storage/types';

export const PRE_MATCH_STATS_VERSION = '1.0.0';

type MetricSet = {
  matches: number;
  goals: number;
  shots: number;
  shotGoals: number;
  shotMisses: number;
  saves: number;
  assists: number;
  turnovers: number;
  yellow: number;
  twoMin: number;
  red: number;
};

export type PreMatchPlayerStats = MetricSet & {
  playerId: string;
  name: string;
  position?: string;
  shirtNumber?: number;
  seasonMatches: number;
  last5: MetricSet;
};

export type PreMatchTeamStats = MetricSet & {
  teamId: string;
  seasonId: string;
  goalsForPerMatch: number;
  goalsAgainstPerMatch: number;
  last5: MetricSet;
};

export type PreMatchStats = {
  version: typeof PRE_MATCH_STATS_VERSION;
  generatedAt: string;
  currentMatchId: string;
  scope: { seasonId: string; teamId: string; competitionId?: string | null };
  team: PreMatchTeamStats;
  players: PreMatchPlayerStats[];
};

const emptyMetrics = (): MetricSet => ({ matches: 0, goals: 0, shots: 0, shotGoals: 0, shotMisses: 0, saves: 0, assists: 0, turnovers: 0, yellow: 0, twoMin: 0, red: 0 });

function addEvent(metrics: MetricSet, event: MatchEvent, teamId: string) {
  const own = event.teamId === teamId;
  if (!own) return;
  const type = String(event.type || '').toLowerCase();
  const result = String(event.result || '').toLowerCase();
  if (type === 'goal' || type === 'golo') { metrics.goals += 1; metrics.shotGoals += 1; metrics.shots += 1; }
  if (type.includes('shot') || type.includes('remate') || type.includes('throw') || type.includes('7m')) {
    if (type !== 'goal' && type !== 'golo') metrics.shots += 1;
    if (result === 'goal' || result === 'golo' || result === 'scored') metrics.shotGoals += 1;
    if (result === 'miss' || result === 'saved' || result === 'falhado' || result === 'defended') metrics.shotMisses += 1;
  }
  if (type.includes('assist') || type.includes('assistência')) metrics.assists += 1;
  if (type.includes('turnover') || type.includes('loss') || type.includes('perda')) metrics.turnovers += 1;
  if (type.includes('yellow') || type.includes('amarelo')) metrics.yellow += 1;
  if (type.includes('2min') || type.includes('two') || type.includes('exclusion') || type.includes('exclus')) metrics.twoMin += 1;
  if (type.includes('red') || type.includes('vermelho')) metrics.red += 1;
  if (type.includes('save') || type.includes('defesa')) metrics.saves += 1;
}

function merge(a: MetricSet, b: MetricSet): MetricSet {
  return Object.fromEntries(Object.keys(a).map(key => [key, (a as any)[key] + (b as any)[key]])) as MetricSet;
}

function metricsFor(events: MatchEvent[], teamId: string): MetricSet {
  const metrics = emptyMetrics();
  for (const event of events) addEvent(metrics, event, teamId);
  return metrics;
}

export async function buildPreMatchStats(database: HandballPerformanceDB, matchId: string): Promise<PreMatchStats> {
  const match = await database.matches.get(matchId);
  if (!match) throw new Error('MATCH_NOT_FOUND');

  const [players, squads, matches, events, team] = await Promise.all([
    database.players.toArray(),
    database.matchSquads.where('matchId').equals(matchId).toArray(),
    database.matches.where('teamId').equals(match.teamId).toArray(),
    database.events.toArray(),
    database.teams.get(match.teamId),
  ]);

  const previousMatches = matches
    .filter(item => item.id !== matchId && item.status === 'COMPLETED' && new Date(item.date).getTime() < new Date(match.date).getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const previousIds = new Set(previousMatches.map(item => item.id));
  const historicalEvents = events.filter(event => previousIds.has(event.matchId));
  const teamMetrics = metricsFor(historicalEvents, match.teamId);
  const lastFiveIds = new Set(previousMatches.slice(-5).map(item => item.id));
  const lastFiveEvents = historicalEvents.filter(event => lastFiveIds.has(event.matchId));
  const last5 = metricsFor(lastFiveEvents, match.teamId);
  const goalsFor = previousMatches.reduce((sum, item) => sum + (item.goalsFor ?? 0), 0);
  const goalsAgainst = previousMatches.reduce((sum, item) => sum + (item.goalsAgainst ?? 0), 0);

  const playerById = new Map(players.map(player => [player.id, player]));
  const selectedIds = new Set(squads.map(item => item.playerId));
  const selectedPlayers = players.filter(player => selectedIds.has(player.id));

  const playerStats = selectedPlayers.map(player => {
    const playerEvents = historicalEvents.filter(event => event.playerId === player.id);
    const playerLast5 = playerEvents.filter(event => lastFiveIds.has(event.matchId));
    const all = metricsFor(playerEvents, match.teamId);
    const recent = metricsFor(playerLast5, match.teamId);
    const seasonMatches = new Set(playerEvents.map(event => event.matchId)).size;
    const squad = squads.find(item => item.playerId === player.id);
    return {
      ...all,
      playerId: player.id,
      name: player.displayName,
      position: squad?.position ?? player.position,
      shirtNumber: squad?.shirtNumber ?? player.shirtNumber,
      seasonMatches,
      last5: recent,
    };
  });

  // Keep the contract deterministic and exclude unused players from the pre-game payload.
  void playerById;
  void team;

  return {
    version: PRE_MATCH_STATS_VERSION,
    generatedAt: new Date().toISOString(),
    currentMatchId: match.id,
    scope: { seasonId: match.seasonId, teamId: match.teamId, competitionId: match.competitionId ?? null },
    team: {
      ...teamMetrics,
      teamId: match.teamId,
      seasonId: match.seasonId,
      goalsForPerMatch: previousMatches.length ? goalsFor / previousMatches.length : 0,
      goalsAgainstPerMatch: previousMatches.length ? goalsAgainst / previousMatches.length : 0,
      last5,
    },
    players: playerStats,
  };
}
