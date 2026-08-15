import { exportProject } from './export-import'
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
  'events',
  'clips',
  'playlists',
] as const

type ProjectSnapshot = {
  version: 1
  exportedAt: string
  data: Record<string, unknown>
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
