import type { HandballPerformanceDB } from '../storage/db';

export const HISTORICAL_MATCH_VERSION = '1.0.0';
export type DataConfidence = 'UNKNOWN' | 'RECORDED';
export type HistoricalMatchInput = {
  matchId: string;
  goalsFor?: number;
  goalsAgainst?: number;
  players: Array<{ playerId: string; goals?: number; twoMin?: number; red?: number; selected?: boolean }>;
};

/** Applies only facts present on a paper match sheet. Unknown metrics stay unknown; they are never converted to zero. */
export async function applyHistoricalMatchSheet(db: HandballPerformanceDB, input: HistoricalMatchInput) {
  const match = await db.matches.get(input.matchId);
  if (!match) throw new Error('MATCH_NOT_FOUND');
  await db.matches.update(input.matchId, {
    ...(input.goalsFor === undefined ? {} : { goalsFor: input.goalsFor }),
    ...(input.goalsAgainst === undefined ? {} : { goalsAgainst: input.goalsAgainst }),
    status: 'COMPLETED',
    updatedAt: new Date().toISOString()
  });
  const existing = await db.events.where('matchId').equals(input.matchId).toArray();
  const existingIds = new Set(existing.map(e => `${e.playerId}|${e.type}`));
  const now = new Date().toISOString();
  const events = input.players.flatMap(player => {
    const rows: any[] = [];
    if (player.goals !== undefined) for (let i = 0; i < player.goals; i++) rows.push({ id: crypto.randomUUID(), matchId: input.matchId, timestampSeconds: 0, period: 1, type: 'goal', playerId: player.playerId, result: 'recorded_sheet', notes: 'Ficha de jogo; minuto desconhecido', tags: ['source:match-sheet'], createdAt: now });
    if (player.twoMin !== undefined) for (let i = 0; i < player.twoMin; i++) rows.push({ id: crypto.randomUUID(), matchId: input.matchId, timestampSeconds: 0, period: 1, type: 'two_min', playerId: player.playerId, result: 'recorded_sheet', notes: 'Ficha de jogo; minuto desconhecido', tags: ['source:match-sheet'], createdAt: now });
    if (player.red !== undefined) for (let i = 0; i < player.red; i++) rows.push({ id: crypto.randomUUID(), matchId: input.matchId, timestampSeconds: 0, period: 1, type: 'red', playerId: player.playerId, result: 'recorded_sheet', notes: 'Ficha de jogo; minuto desconhecido', tags: ['source:match-sheet'], createdAt: now });
    return rows;
  });
  if (events.length) await db.events.bulkAdd(events as any);
  return { version: HISTORICAL_MATCH_VERSION, matchId: input.matchId, importedEvents: events.length, confidence: 'RECORDED' as DataConfidence };
}
