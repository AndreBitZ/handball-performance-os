import { readProjectFile, writeProjectFile } from './local-project'

export type LocalEntity = { id: string; [key: string]: unknown }
export type LocalTableName = 'clubs' | 'teams' | 'seasons' | 'competitions' | 'players' | 'matches'
export type LocalProjectData = Record<LocalTableName, LocalEntity[]>

const DATA_FILE = 'project-v1.json'
const TABLES: readonly LocalTableName[] = [
  'clubs',
  'teams',
  'seasons',
  'competitions',
  'players',
  'matches',
]

function emptyData(): LocalProjectData {
  const data: Partial<LocalProjectData> = {}
  for (const table of TABLES) data[table] = []
  return data as LocalProjectData
}

function parseData(text: string): LocalProjectData {
  const parsed = JSON.parse(text) as { version?: number; data?: unknown }
  if (parsed.version !== 1 || !parsed.data || typeof parsed.data !== 'object') {
    throw new Error('Dados locais inválidos ou incompatíveis.')
  }

  const data = parsed.data as Record<string, unknown>
  for (const table of TABLES) {
    if (!Array.isArray(data[table])) {
      throw new Error(`Dados locais inválidos: falta a tabela ${table}.`)
    }
  }

  return data as LocalProjectData
}

async function readData(folder: FileSystemDirectoryHandle): Promise<LocalProjectData> {
  try {
    return parseData(await readProjectFile(folder, 'database', DATA_FILE))
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') return emptyData()
    if (error instanceof Error && error.message.includes('File project-v1.json not found')) return emptyData()
    throw error
  }
}

async function writeData(folder: FileSystemDirectoryHandle, data: LocalProjectData): Promise<void> {
  await writeProjectFile(
    folder,
    'database',
    DATA_FILE,
    JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), data }, null, 2),
  )
}

export class LocalProjectDataStore {
  constructor(private readonly folder: FileSystemDirectoryHandle) {}

  async list<T extends LocalEntity>(table: LocalTableName): Promise<T[]> {
    const data = await readData(this.folder)
    return structuredClone(data[table]) as T[]
  }

  async get<T extends LocalEntity>(table: LocalTableName, id: string): Promise<T | null> {
    const rows = await this.list<T>(table)
    return rows.find((row) => row.id === id) ?? null
  }

  async upsert<T extends LocalEntity>(table: LocalTableName, entity: T): Promise<T> {
    const data = await readData(this.folder)
    const index = data[table].findIndex((row) => row.id === entity.id)
    const copy = structuredClone(entity) as LocalEntity
    if (index === -1) data[table].push(copy)
    else data[table][index] = copy
    await writeData(this.folder, data)
    return structuredClone(copy) as T
  }

  async remove(table: LocalTableName, id: string): Promise<boolean> {
    const data = await readData(this.folder)
    const before = data[table].length
    data[table] = data[table].filter((row) => row.id !== id)
    if (data[table].length === before) return false
    await writeData(this.folder, data)
    return true
  }

  async replaceAll(data: LocalProjectData): Promise<void> {
    await writeData(this.folder, structuredClone(data))
  }
}

export const localProjectTables = (): readonly LocalTableName[] => TABLES
