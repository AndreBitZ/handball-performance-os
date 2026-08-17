import { describe, expect, it, vi } from 'vitest'

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

const snapshot = Object.fromEntries(
  tables.map((table) => [table, [{ id: `${table}-1`, marker: table }]]),
)

const stores = Object.fromEntries(
  tables.map((table) => [
    table,
    {
      rows: structuredClone(snapshot[table]),
      toArray: vi.fn(async () => structuredClone(snapshot[table])),
      clear: vi.fn(async () => undefined),
      bulkPut: vi.fn(async (rows: unknown[]) => {
        stores[table].rows = structuredClone(rows)
      }),
      count: vi.fn(async () => stores[table].rows.length),
    },
  ]),
) as Record<string, { rows: unknown[]; toArray: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn>; bulkPut: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> }>

const db = Object.assign(stores, {
  transaction: vi.fn(async (_mode: string, _tables: unknown[], callback: () => Promise<void>) => callback()),
})

vi.mock('../../src/lib/storage/db', () => ({ db }))

vi.mock('../../src/lib/storage/local-project', () => ({
  readProjectFile: vi.fn(),
  writeProjectFile: vi.fn(async () => undefined),
}))

vi.mock('../../src/lib/storage/export-import', () => ({
  exportProjectToLocal: vi.fn(async () => ({ rows: 11, bytes: 100, verified: true, backupFile: 'safety.json' })),
}))

import { restoreProjectFromLocal } from '../../src/lib/storage/restore-project'
import { readLocalProject } from '../../src/lib/storage/import-project'

vi.mock('../../src/lib/storage/import-project', () => ({
  readLocalProject: vi.fn(async () => ({ data: structuredClone(snapshot), rows: 11 })),
}))

describe('project storage round-trip contract', () => {
  it('covers every Dexie table in the restore path', async () => {
    const folder = {} as FileSystemDirectoryHandle
    const result = await restoreProjectFromLocal(folder)

    expect(result).toEqual({ rows: 11, backupFile: 'safety.json', verified: true })
    expect(db.transaction).toHaveBeenCalledTimes(1)

    for (const table of tables) {
      expect(stores[table].clear).toHaveBeenCalledTimes(1)
      expect(stores[table].bulkPut).toHaveBeenCalledWith(snapshot[table])
      expect(stores[table].count).toHaveBeenCalledTimes(1)
    }

    expect(readLocalProject).toHaveBeenCalledTimes(0)
  })
})
