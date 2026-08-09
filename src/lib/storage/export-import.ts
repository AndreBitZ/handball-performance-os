import { db } from './db'

const tables = ['clubs','teams','seasons','players','playerTeamSeasons','competitions','matches','events','clips','playlists'] as const

type TableName = typeof tables[number]
type ProjectDump = { version: 1; exportedAt: string; data: Record<TableName, unknown[]> }

export async function exportProject(): Promise<Blob> {
  if (!db) throw new Error('Local database is only available in the browser.')
  const data = {} as Record<TableName, unknown[]>
  for (const table of tables) data[table] = await (db as any)[table].toArray()
  return new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data } satisfies ProjectDump)], { type: 'application/json' })
}

export async function importProject(file: File): Promise<void> {
  if (!db) throw new Error('Local database is only available in the browser.')
  const parsed = JSON.parse(await file.text()) as ProjectDump
  if (parsed?.version !== 1 || !parsed.data) throw new Error('Ficheiro de projeto inválido.')
  await db.transaction('rw', tables.map(t => (db as any)[t]), async () => {
    for (const table of tables) {
      const rows = parsed.data[table]
      if (Array.isArray(rows)) await (db as any)[table].bulkPut(rows)
    }
  })
}
