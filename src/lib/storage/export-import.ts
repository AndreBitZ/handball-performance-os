import { db } from './db'
import { readProjectFile, writeProjectFile } from './local-project'

const tables = ['clubs','teams','seasons','players','playerTeamSeasons','competitions','matches','matchSquads','events','clips','playlists'] as const
const PROJECT_FILE = 'project-v1.json'

type TableName = typeof tables[number]
export type ProjectDump = { version: 1; exportedAt: string; data: Record<TableName, unknown[]> }

export type LocalExportReport = {
  rows: number
  bytes: number
  verified: boolean
  backupFile: string | null
}

function validateProjectDump(value: unknown): ProjectDump {
  if (!value || typeof value !== 'object') throw new Error('Ficheiro de projeto inválido.')
  const parsed = value as Partial<ProjectDump>
  if (parsed.version !== 1 || !parsed.data || typeof parsed.data !== 'object') {
    throw new Error('Ficheiro de projeto inválido ou incompatível.')
  }

  const data = parsed.data as Record<string, unknown>
  for (const table of tables) {
    if (!Array.isArray(data[table])) {
      throw new Error(`Ficheiro de projeto inválido: falta a tabela ${table}.`)
    }
  }

  return parsed as ProjectDump
}

export async function exportProject(): Promise<Blob> {
  if (!db) throw new Error('Local database is only available in the browser.')
  const data = {} as Record<TableName, unknown[]>
  for (const table of tables) data[table] = await (db as any)[table].toArray()
  return new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data } satisfies ProjectDump)], { type: 'application/json' })
}

/** Export the current Dexie database into the selected local project folder. */
export async function exportProjectToLocal(folder: FileSystemDirectoryHandle): Promise<LocalExportReport> {
  const blob = await exportProject()
  const text = await blob.text()
  const dump = validateProjectDump(JSON.parse(text))
  const rows = tables.reduce((total, table) => total + dump.data[table].length, 0)

  let backupFile: string | null = null
  try {
    const previous = await readProjectFile(folder, 'database', PROJECT_FILE)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    backupFile = `project-v1-${stamp}.json`
    await writeProjectFile(folder, 'backups', backupFile, previous)
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'NotFoundError')) {
      throw error
    }
  }

  await writeProjectFile(folder, 'database', PROJECT_FILE, text)

  const written = await readProjectFile(folder, 'database', PROJECT_FILE)
  const verified = written === text && validateProjectDump(JSON.parse(written)).version === 1
  if (!verified) throw new Error('Falha na verificação do projeto exportado.')

  return { rows, bytes: new TextEncoder().encode(text).byteLength, verified, backupFile }
}

export async function importProject(file: File): Promise<void> {
  if (!db) throw new Error('Local database is only available in the browser.')
  const parsed = validateProjectDump(JSON.parse(await file.text()))
  await db.transaction('rw', tables.map(t => (db as any)[t]), async () => {
    for (const table of tables) {
      await (db as any)[table].clear()
      await (db as any)[table].bulkPut(parsed.data[table])
    }
  })
}
