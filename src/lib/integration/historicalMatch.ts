import type { HandballPerformanceDB } from '../storage/db';

export const HISTORICAL_MATCH_VERSION = '1.1.0';
export type DataConfidence = 'UNKNOWN' | 'RECORDED';
export type HistoricalMatchInput = {
  matchId: string;
  goalsFor?: number;
  goalsAgainst?: number;
  players: Array<{ playerId: string; goals?: number; twoMin?: number; red?: number; selected?: boolean }>;
};

/** Applies only facts present on a paper match sheet. Unknown metrics and times stay unknown. */
export async function applyHistoricalMatchSheet(db: HandballPerformanceDB, input: HistoricalMatchInput) {
  const match = await db.matches.get(input.matchId);
  if (!match) throw new Error('MATCH_NOT_FOUND');
  await db.matches.update(input.matchId, {
    ...(input.goalsFor === undefined ? {} : { goalsFor: input.goalsFor }),
    ...(input.goalsAgainst === undefined ? {} : { goalsAgainst: input.goalsAgainst }),
    status: 'COMPLETED', dataQualityLevel: 0, dataSources: ['MATCH_SHEET'], updatedAt: new Date().toISOString()
  });
  const now = new Date().toISOString();
  const events = input.players.flatMap(player => {
    const rows: any[] = [];
    const add = (type: string, count: number | undefined) => {
      if (count === undefined) return;
      for (let i = 0; i < count; i++) rows.push({ id: crypto.randomUUID(), matchId: input.matchId, timestampKnown: false, type, playerId: player.playerId, result: 'recorded_sheet', source: 'MATCH_SHEET', notes: 'Ficha de jogo; minuto/período desconhecidos', tags: ['source:match-sheet'], createdAt: now });
    };
    add('goal', player.goals); add('two_min', player.twoMin); add('red', player.red);
    return rows;
  });
  if (events.length) await db.events.bulkAdd(events as any);
  return { version: HISTORICAL_MATCH_VERSION, matchId: input.matchId, importedEvents: events.length, confidence: 'RECORDED' as DataConfidence };
}
