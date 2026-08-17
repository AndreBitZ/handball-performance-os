import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
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
  ) as Record<string, unknown[]>

  const stores = Object.fromEntries(
    tables.map((table) => [
      table,
      {
        rows: structuredClone(snapshot[table]),
        clear: vi.fn(async () => undefined),
        bulkPut: vi.fn(async (rows: unknown[]) => undefined),
        count: vi.fn(async () => snapshot[table].length),
      },
    ]),
  ) as Record<string, { rows: unknown[]; clear: ReturnType<typeof vi.fn>; bulkPut: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> }>

  const transaction = vi.fn(async (_mode: string, _tables: unknown[], callback: () => Promise<void>) => callback())
  const readLocalProject = vi.fn(async () => ({ data: structuredClone(snapshot), rows: 11 }))
  const exportProjectToLocal = vi.fn(async () => ({ rows: 11, bytes: 100, verified: true, backupFile: 'safety.json' }))

  return { tables, snapshot, stores, transaction, readLocalProject, exportProjectToLocal }
})

vi.mock('../../src/lib/storage/db', () => ({
  db: Object.assign(mocks.stores, { transaction: mocks.transaction }),
}))

vi.mock('../../src/lib/storage/import-project', () => ({
  readLocalProject: mocks.readLocalProject,
}))

vi.mock('../../src/lib/storage/export-import', () => ({
  exportProjectToLocal: mocks.exportProjectToLocal,
}))

vi.mock('../../src/lib/storage/local-project', () => ({
  writeProjectFile: vi.fn(async () => undefined),
}))

import { restoreProjectFromLocal } from '../../src/lib/storage/restore-project'

describe('project storage round-trip contract', () => {
  it('restores every Dexie table and verifies the complete snapshot', async () => {
    const folder = {} as FileSystemDirectoryHandle
    const result = await restoreProjectFromLocal(folder)

    expect(result).toEqual({ rows: 11, backupFile: 'safety.json', verified: true })
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
    expect(mocks.readLocalProject).toHaveBeenCalledTimes(1)
    expect(mocks.exportProjectToLocal).toHaveBeenCalledTimes(1)

    for (const table of mocks.tables) {
      expect(mocks.stores[table].clear).toHaveBeenCalledTimes(1)
      expect(mocks.stores[table].bulkPut).toHaveBeenCalledWith(mocks.snapshot[table])
      expect(mocks.stores[table].count).toHaveBeenCalledTimes(1)
    }
  })
})
