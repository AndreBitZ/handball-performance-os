import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const restoreRows = {
    clubs: [{ id: 'club-1', name: 'Clube Teste' }],
    teams: [{ id: 'team-1', name: 'Seniores' }],
    seasons: [{ id: 'season-1', name: '2026/27' }],
    players: [{ id: 'player-1', name: 'Jogador Teste' }],
    playerTeamSeasons: [],
    competitions: [{ id: 'competition-1', name: 'Campeonato' }],
    matches: [{ id: 'match-1', home: 'Clube Teste', away: 'Adversário' }],
    matchSquads: [],
    events: [],
    clips: [],
    playlists: [],
  }

  const transaction = vi.fn(async (_mode: string, _tables: unknown[], callback: () => Promise<void>) => callback())
  const stores = Object.fromEntries(
    Object.entries(restoreRows).map(([name, rows]) => [
      name,
      {
        clear: vi.fn(async () => undefined),
        bulkPut: vi.fn(async () => undefined),
        count: vi.fn(async () => rows.length),
      },
    ]),
  )

  return { restoreRows, transaction, stores }
})

vi.mock('../../src/lib/storage/db', () => ({
  db: Object.assign(mocks.stores, { transaction: mocks.transaction }),
}))

vi.mock('../../src/lib/storage/import-project', () => ({
  readLocalProject: vi.fn(async () => ({ data: mocks.restoreRows, rows: 5 })),
}))

vi.mock('../../src/lib/storage/export-import', () => ({
  exportProjectToLocal: vi.fn(async () => ({
    rows: 5,
    bytes: 100,
    verified: true,
    backupFile: 'safety.json',
  })),
}))

vi.mock('../../src/lib/storage/local-project', () => ({
  writeProjectFile: vi.fn(async () => undefined),
}))

import { restoreProjectFromLocal } from '../../src/lib/storage/restore-project'

describe('safe local project restore', () => {
  it('restores validated data and returns a verified report', async () => {
    const folder = {} as FileSystemDirectoryHandle
    const result = await restoreProjectFromLocal(folder)

    expect(result).toEqual({ rows: 5, backupFile: 'safety.json', verified: true })
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
    expect(mocks.stores.clubs.clear).toHaveBeenCalledTimes(1)
    expect(mocks.stores.players.bulkPut).toHaveBeenCalledWith(mocks.restoreRows.players)
  })
})
