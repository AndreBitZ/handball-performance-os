import { db } from './db'
import { readProjectFile } from './local-project'

const TABLES = ['clubs','teams','seasons','players','playerTeamSeasons','competitions','matches','matchSquads','events','clips','playlists'] as const
type TableName = typeof TABLES[number]
type Snapshot = { version: 1; exportedAt: string; data: Record<TableName, unknown[]> }
export type TableDiff = { table: TableName; current: number; backup: number; added: number; removed: number; changed: number }

function rowKey(row: unknown, index: number): string {
  if (row && typeof row === 'object' && 'id' in row) {
    const id = (row as { id?: unknown }).id
    if (id !== undefined && id !== null) return String(id)
  }
  return `__index_${index}`
}

function rowSignature(row: unknown): string {
  return JSON.stringify(row)
}

export async function compareDatabaseWithSnapshot(folder: FileSystemDirectoryHandle): Promise<{ exportedAt: string; totalCurrent: number; totalBackup: number; tables: TableDiff[] }> {
  if (!db) throw new Error('Local database is only available in the browser.')
  const snapshot = JSON.parse(await readProjectFile(folder, 'database', 'project-v1.json')) as Snapshot
  if (snapshot.version !== 1 || !snapshot.data) throw new Error('Backup inválido.')

  const tables: TableDiff[] = []
  for (const table of TABLES) {
    const currentRows = await (db as any)[table].toArray() as unknown[]
    const backupRows = Array.isArray(snapshot.data[table]) ? snapshot.data[table] : []
    const currentMap = new Map(currentRows.map((row, index) => [rowKey(row, index), rowSignature(row)]))
    const backupMap = new Map(backupRows.map((row, index) => [rowKey(row, index), rowSignature(row)]))
    let added = 0, removed = 0, changed = 0
    for (const [key, signature] of backupMap) {
      if (!currentMap.has(key)) added++
      else if (currentMap.get(key) !== signature) changed++
    }
    for (const key of currentMap.keys()) if (!backupMap.has(key)) removed++
    tables.push({ table, current: currentRows.length, backup: backupRows.length, added, removed, changed })
  }
  return {
    exportedAt: snapshot.exportedAt,
    totalCurrent: tables.reduce((sum, item) => sum + item.current, 0),
    totalBackup: tables.reduce((sum, item) => sum + item.backup, 0),
    tables,
  }
}
