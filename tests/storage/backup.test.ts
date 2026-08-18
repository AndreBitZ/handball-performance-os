import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { HandballPerformanceDB } from '../../src/lib/storage/db';
import { exportDatabase, importDatabase } from '../../src/lib/storage/backup';

describe('database backup round-trip', () => {
  it('exports and restores every structured table without data loss', async () => {
    const db = new HandballPerformanceDB();
    const now = new Date().toISOString();
    await db.matches.add({ id: 'm1', seasonId: 's1', teamId: 't1', opponentName: 'Teste', date: now, homeAway: 'HOME', status: 'IN_PROGRESS', goalsFor: 31, goalsAgainst: 28, createdAt: now, updatedAt: now });
    await db.players.add({ id: 'p1', firstName: 'Ana', lastName: 'Teste', displayName: 'Ana Teste', shirtNumber: 7, position: 'CE', active: true, createdAt: now, updatedAt: now });
    await db.matchSquads.add({ id: 'sq1', matchId: 'm1', playerId: 'p1', starter: true, captain: true, shirtNumber: 7, position: 'CE' });
    await db.playerIntervals.add({ id: 'i1', matchId: 'm1', playerId: 'p1', period: 1, startSeconds: 0, endSeconds: 1200, createdAt: now, updatedAt: now });
    await db.clockStates.add({ id: 'c1', matchId: 'm1', period: 1, elapsedSeconds: 1200, running: false, updatedAt: now });
    await db.events.add({ id: 'e1', matchId: 'm1', timestampSeconds: 100, period: 1, type: 'GOAL', playerId: 'p1', createdAt: now });
    await db.clips.add({ id: 'cl1', matchId: 'm1', startSeconds: 90, endSeconds: 120, favorite: true, createdAt: now });
    await db.playlists.add({ id: 'pl1', name: 'Jogo teste', clipIds: ['cl1'], createdAt: now, updatedAt: now });

    const backup = await exportDatabase(db);
    await db.transaction('rw', db.tables, async () => { for (const table of db.tables) await table.clear(); });
    expect(await db.matches.count()).toBe(0);

    await importDatabase(db, new File([await backup.text()], 'test.hpo', { type: 'application/json' }));

    expect(await db.matches.get('m1')).toMatchObject({ goalsFor: 31, goalsAgainst: 28 });
    expect(await db.players.get('p1')).toMatchObject({ displayName: 'Ana Teste', shirtNumber: 7 });
    expect(await db.matchSquads.get('sq1')).toMatchObject({ starter: true, captain: true });
    expect(await db.playerIntervals.get('i1')).toMatchObject({ startSeconds: 0, endSeconds: 1200 });
    expect(await db.clockStates.get('c1')).toMatchObject({ elapsedSeconds: 1200, running: false });
    expect(await db.events.get('e1')).toMatchObject({ type: 'GOAL', playerId: 'p1' });
    expect(await db.clips.get('cl1')).toMatchObject({ favorite: true });
    expect(await db.playlists.get('pl1')).toMatchObject({ clipIds: ['cl1'] });
    await db.delete();
  });
});
