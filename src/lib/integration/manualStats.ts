import type { HandballPerformanceDB } from '../storage/db';
import type { DataSource, MatchEvent } from '../storage/types';

export const MANUAL_STATS_VERSION = '1.0.0';
export type ManualPlayerStats = { playerId: string; goals?: number; shots?: number; assists?: number; turnovers?: number; saves?: number; yellow?: number; twoMin?: number; red?: number };
export type ManualMatchInput = { matchId: string; players: ManualPlayerStats[] };

/** Level 1: facts manually reconstructed from a match sheet/video notes. Missing values remain unknown. */
export async function applyManualMatchStats(db: HandballPerformanceDB, input: ManualMatchInput) {
  const match = await db.matches.get(input.matchId);
  if (!match) throw new Error('MATCH_NOT_FOUND');
  const now = new Date().toISOString();
  const events: MatchEvent[] = [];
  const add = (playerId: string, type: string, count: number | undefined) => {
    if (count === undefined) return;
    for (let i = 0; i < count; i++) events.push({ id: crypto.randomUUID(), matchId: input.matchId, type, playerId, teamId: match.teamId, timestampKnown: false, source: 'MANUAL_STATS' as DataSource, result: 'manual', notes: 'Estatística manual; momento não conhecido', createdAt: now });
  };
  for (const p of input.players) {
    add(p.playerId, 'goal', p.goals); add(p.playerId, 'shot', p.shots); add(p.playerId, 'assist', p.assists); add(p.playerId, 'turnover', p.turnovers); add(p.playerId, 'save', p.saves); add(p.playerId, 'yellow', p.yellow); add(p.playerId, 'two_min', p.twoMin); add(p.playerId, 'red', p.red);
  }
  if (events.length) await db.events.bulkAdd(events);
  await db.matches.update(input.matchId, { dataQualityLevel: Math.max(match.dataQualityLevel ?? 0, 1) as 0|1|2|3, dataSources: Array.from(new Set([...(match.dataSources ?? []), 'MANUAL_STATS'])) as DataSource[], updatedAt: now });
  return { version: MANUAL_STATS_VERSION, matchId: input.matchId, importedEvents: events.length, source: 'MANUAL_STATS' as DataSource };
}
