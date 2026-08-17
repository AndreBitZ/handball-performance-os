import { db } from './db'
import { exportProjectToLocal } from './export-import'
import { readLocalProject } from './import-project'
import { writeProjectFile } from './local-project'

const tables = [
  'clubs',
  'teams',
  'seasons',
  'players',
  'playerTeamSeasons',
  'competitions',
  'matches',
  'matchSquads',
  'events',
  'clips',
  'playlists',
] as const

type TableName = typeof tables[number]

export type RestoreReport = {
  rows: number
  backupFile: string | null
  verified: boolean
}

export async function restoreProjectFromLocal(
  folder: FileSystemDirectoryHandle,
): Promise<RestoreReport> {
  if (!db) throw new Error('Local database is only available in the browser.')

  const { data, rows } = await readLocalProject(folder)

  // Always snapshot the current Dexie state before replacing it.
  const current = await exportProjectToLocal(folder)
  const safetyBackup = current.backupFile

  try {
    await db.transaction(
      'rw',
      tables.map((table) => (db as any)[table]),
      async () => {
        for (const table of tables) {
          await (db as any)[table].clear()
          await (db as any)[table].bulkPut(data[table] ?? [])
        }

        // Verify inside the transaction. Any mismatch aborts the transaction.
        for (const table of tables) {
          const expected = (data[table] ?? []).length
          const actual = await (db as any)[table].count()
          if (actual !== expected) {
            throw new Error(`Falha no restore: tabela ${table} ficou com ${actual} de ${expected} registos.`)
          }
        }
      },
    )
  } catch (error) {
    // Dexie's transaction is atomic: if anything above fails, the previous
    // database state remains intact. Keep the safety backup for manual recovery.
    throw new Error(
      `Restore abortado; a base de dados anterior foi preservada. ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }

  // Persist a small audit marker only after the transaction commits.
  const stamp = new Date().toISOString()
  await writeProjectFile(
    folder,
    'database',
    'last-restore.json',
    JSON.stringify({ restoredAt: stamp, rows, backupFile: safetyBackup }, null, 2),
  )

  return { rows, backupFile: safetyBackup, verified: true }
}
