import { readProjectFile } from './local-project'
import type { LocalProjectData } from './local-data-store'

export type ProjectImportResult = {
  data: LocalProjectData
  rows: number
}

const TABLES: readonly (keyof LocalProjectData)[] = [
  'clubs',
  'teams',
  'seasons',
  'competitions',
  'players',
  'matches',
]

function validateProject(value: unknown): LocalProjectData {
  if (!value || typeof value !== 'object') throw new Error('Projeto local inválido.')

  const root = value as { version?: unknown; data?: unknown }
  if (root.version !== 1 || !root.data || typeof root.data !== 'object') {
    throw new Error('Projeto local incompatível.')
  }

  const data = root.data as Record<string, unknown>
  for (const table of TABLES) {
    if (!Array.isArray(data[table])) {
      throw new Error(`Projeto local inválido: falta a tabela ${table}.`)
    }
    for (const row of data[table]) {
      if (!row || typeof row !== 'object' || typeof (row as { id?: unknown }).id !== 'string') {
        throw new Error(`Projeto local inválido: registo sem id na tabela ${table}.`)
      }
    }
  }

  return structuredClone(data) as LocalProjectData
}

export async function readLocalProject(
  folder: FileSystemDirectoryHandle,
): Promise<ProjectImportResult> {
  const text = await readProjectFile(folder, 'database', 'project-v1.json')
  const data = validateProject(JSON.parse(text))
  const rows = TABLES.reduce((total, table) => total + data[table].length, 0)
  return { data, rows }
}
