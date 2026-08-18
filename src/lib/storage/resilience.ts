import type { HandballPerformanceDB } from './db';

export const BACKUP_SCHEMA_VERSION = 1;

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  try { return await navigator.storage.persist(); } catch { return false; }
}

export async function isPersistentStorageGranted(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persisted) return false;
  try { return await navigator.storage.persisted(); } catch { return false; }
}

export async function saveMatchRecoverySnapshot(db: HandballPerformanceDB, matchId: string) {
  const [match, squad, intervals, clockStates, events] = await Promise.all([
    db.matches.get(matchId),
    db.matchSquads.where('matchId').equals(matchId).toArray(),
    db.playerIntervals.where('matchId').equals(matchId).toArray(),
    db.clockStates.where('matchId').equals(matchId).toArray(),
    db.events.where('matchId').equals(matchId).toArray(),
  ]);
  if (!match) return;
  const data = JSON.stringify({ match, squad, intervals, clockStates, events });
  const now = new Date().toISOString();
  await db.backupSnapshots.add({ id: crypto.randomUUID(), matchId, createdAt: now, schemaVersion: BACKUP_SCHEMA_VERSION, data });
  const snapshots = await db.backupSnapshots.where('matchId').equals(matchId).sortBy('createdAt');
  if (snapshots.length > 12) await db.backupSnapshots.bulkDelete(snapshots.slice(0, snapshots.length - 12).map(snapshot => snapshot.id));
}

export async function getLatestMatchRecoverySnapshot(db: HandballPerformanceDB, matchId: string) {
  const snapshots = await db.backupSnapshots.where('matchId').equals(matchId).sortBy('createdAt');
  return snapshots.at(-1) ?? null;
}
