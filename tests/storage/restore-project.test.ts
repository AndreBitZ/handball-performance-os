import { describe, expect, it, vi } from 'vitest'
import { restoreProjectFromLocal } from '../../src/lib/storage/restore-project'

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

describe('safe local project restore', () => {
  it('restores validated data and returns a verified report', async () => {
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

    vi.mock('../../src/lib/storage/db', () => ({ db: Object.assign(stores, { transaction }) }))

    const folder = {} as FileSystemDirectoryHandle
    vi.mock('../../src/lib/storage/import-project', () => ({
      readLocalProject: vi.fn(async () => ({ data: restoreRows, rows: 5 })),
    }))
    vi.mock('../../src/lib/storage/export-import', () => ({
      exportProjectToLocal: vi.fn(async () => ({ rows: 5, bytes: 100, verified: true, backupFile: 'safety.json' })),
    }))
    vi.mock('../../src/lib/storage/local-project', () => ({
      writeProjectFile: vi.fn(async () => undefined),
    }))

    const { restoreProjectFromLocal: runRestore } = await import('../../src/lib/storage/restore-project')
    const result = await runRestore(folder)

    expect(result).toEqual({ rows: 5, backupFile: 'safety.json', verified: true })
    expect(transaction).toHaveBeenCalledTimes(1)
    expect(stores.clubs.clear).toHaveBeenCalledTimes(1)
    expect(stores.players.bulkPut).toHaveBeenCalledWith(restoreRows.players)
  })
})
