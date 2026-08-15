import { exportProject } from './export-import'
import { db } from './db'
import { readProjectFile, writeProjectFile } from './local-project'

const SNAPSHOT_FILENAME = 'project-v1.json'
const EXPECTED_TABLES = [
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

type ProjectSnapshot = {
  version: 1
  exportedAt: string
  data: Record<string, unknown>
}

type TableDiff = {
  current: number
  backup: number
  added: number
  removed: number
  changed: number
}

export type DatabaseRestoreDiff = {
  filename: string
  exportedAt: string
  totalCurrent: number
  totalBackup: number
  added: number
  removed: number
  changed: number
  tables: Record<string, TableDiff>
}

function parseSnapshot(text: string): ProjectSnapshot {
  let parsed: ProjectSnapshot

  try {
    parsed = JSON.parse(text) as ProjectSnapshot
  } catch {
    throw new Error('O backup existe, mas não contém JSON válido.')
  }

  if (parsed?.version !== 1 || !parsed.data || typeof parsed.data !== 'object') {
    throw new Error('O backup existe, mas tem uma estrutura inválida.')
  }

  const missingTables = EXPECTED_TABLES.filter((table) => !Array.isArray(parsed.data[table]))
  if (missingTables.length > 0) {
    throw new Error(`Backup inválido: faltam tabelas ${missingTables.join(', ')}.`)
  }

  return parsed
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
}

function rowId(row: unknown): string | null {
  if (!row || typeof row !== 'object') return null
  const id = (row as Record<string, unknown>).id
  return id === undefined || id === null ? null : String(id)
}

function diffTable(currentRows: unknown[], backupRows: unknown[]): TableDiff {
  const current = new Map<string, string>()
  const backup = new Map<string, string>()

  for (const row of currentRows) {
    const id = rowId(row)
    if (id !== null) current.set(id, stableStringify(row))
  }
  for (const row of backupRows) {
    const id = rowId(row)
    if (id !== null) backup.set(id, stableStringify(row))
  }

  let added = 0
  let removed = 0
  let changed = 0

  for (const [id, value] of backup) {
    if (!current.has(id)) added += 1
    else if (current.get(id) !== value) changed += 1
  }
  for (const id of current.keys()) {
    if (!backup.has(id)) removed += 1
  }

  return { current: current.size, backup: backup.size, added, removed, changed }
}

export async function saveDatabaseSnapshot(folder: FileSystemDirectoryHandle): Promise<string> {
  const dump = await exportProject()
  await writeProjectFile(folder, 'database', SNAPSHOT_FILENAME, await dump.text())
  return SNAPSHOT_FILENAME
}

export async function verifyDatabaseSnapshot(folder: FileSystemDirectoryHandle): Promise<{
  filename: string
  exportedAt: string
  tableCounts: Record<string, number>
}> {
  const parsed = parseSnapshot(await readProjectFile(folder, 'database', SNAPSHOT_FILENAME))

  return {
    filename: SNAPSHOT_FILENAME,
    exportedAt: parsed.exportedAt,
    tableCounts: Object.fromEntries(
      EXPECTED_TABLES.map((table) => [table, (parsed.data[table] as unknown[]).length]),
    ),
  }
}

export async function previewDatabaseRestore(folder: FileSystemDirectoryHandle): Promise<{
  filename: string
  exportedAt: string
  tableCounts: Record<string, number>
  totalRows: number
}> {
  const parsed = parseSnapshot(await readProjectFile(folder, 'database', SNAPSHOT_FILENAME))
  const tableCounts = Object.fromEntries(
    EXPECTED_TABLES.map((table) => [table, (parsed.data[table] as unknown[]).length]),
  )

  return {
    filename: SNAPSHOT_FILENAME,
    exportedAt: parsed.exportedAt,
    tableCounts,
    totalRows: Object.values(tableCounts).reduce((sum, count) => sum + count, 0),
  }
}

export async function compareDatabaseRestore(folder: FileSystemDirectoryHandle): Promise<DatabaseRestoreDiff> {
  if (!db) throw new Error('Local database is only available in the browser.')

  const parsed = parseSnapshot(await readProjectFile(folder, 'database', SNAPSHOT_FILENAME))
  const tables: Record<string, TableDiff> = {}

  for (const table of EXPECTED_TABLES) {
    const currentRows = await (db as any)[table].toArray() as unknown[]
    const backupRows = parsed.data[table] as unknown[]
    tables[table] = diffTable(currentRows, backupRows)
  }

  const totals = Object.values(tables).reduce(
    (acc, table) => ({
      totalCurrent: acc.totalCurrent + table.current,
      totalBackup: acc.totalBackup + table.backup,
      added: acc.added + table.added,
      removed: acc.removed + table.removed,
      changed: acc.changed + table.changed,
    }),
    { totalCurrent: 0, totalBackup: 0, added: 0, removed: 0, changed: 0 },
  )

  return { filename: SNAPSHOT_FILENAME, exportedAt: parsed.exportedAt, ...totals, tables }
}
