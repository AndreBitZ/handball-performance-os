import type { HandballPerformanceDB } from './db';

export const BACKUP_VERSION = 1;
const TABLES = ['clubs','teams','seasons','players','playerTeamSeasons','competitions','matches','matchSquads','playerIntervals','clockStates','events','clips','playlists'] as const;

type BackupPayload = { version: number; exportedAt: string; tables: Record<string, unknown[]> };

export async function exportDatabase(db: HandballPerformanceDB): Promise<Blob> {
  const tables: Record<string, unknown[]> = {};
  for (const name of TABLES) tables[name] = await db.table(name).toArray();
  const payload: BackupPayload = { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), tables };
  return new Blob([JSON.stringify(payload)], { type: 'application/json' });
}

export async function importDatabase(db: HandballPerformanceDB, file: File) {
  const payload = JSON.parse(await file.text()) as BackupPayload;
  if (payload.version !== BACKUP_VERSION || !payload.tables || typeof payload.tables !== 'object') throw new Error('BACKUP_VERSION');
  await db.transaction('rw', TABLES.map(name => db.table(name)), async () => {
    for (const name of TABLES) {
      const table = db.table(name);
      await table.clear();
      const rows = Array.isArray(payload.tables[name]) ? payload.tables[name] : [];
      if (rows.length) await table.bulkAdd(rows);
    }
  });
}

export function downloadBackup(blob: Blob, filename = `handball-performance-backup-${new Date().toISOString().slice(0,10)}.hpo`) {
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
