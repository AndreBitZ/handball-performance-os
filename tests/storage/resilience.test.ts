import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { HandballPerformanceDB } from '../../src/lib/storage/db';
import { getLatestMatchRecoverySnapshot, saveMatchRecoverySnapshot } from '../../src/lib/storage/resilience';

describe('match recovery snapshots', () => {
  it('keeps the latest recovery state and prunes old snapshots', async () => {
    const db = new HandballPerformanceDB();
    const now = new Date().toISOString();
    await db.matches.add({ id: 'm1', seasonId: 's1', teamId: 't1', opponentName: 'Teste', date: now, homeAway: 'HOME', status: 'IN_PROGRESS', createdAt: now, updatedAt: now });
    for (let i = 0; i < 14; i++) await saveMatchRecoverySnapshot(db, 'm1');
    const snapshots = await db.backupSnapshots.where('matchId').equals('m1').toArray();
    expect(snapshots).toHaveLength(12);
    expect(JSON.parse((await getLatestMatchRecoverySnapshot(db, 'm1'))!.data).match.id).toBe('m1');
    await db.delete();
  });
});
