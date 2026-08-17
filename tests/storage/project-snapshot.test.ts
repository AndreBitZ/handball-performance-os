import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { files } = vi.hoisted(() => ({ files: new Map<string, string>() }))

vi.mock('../../src/lib/storage/local-project', () => ({
  writeProjectFile: vi.fn(async (_folder: unknown, relativeFolder: string, filename: string, content: string) => {
    files.set(`${relativeFolder}/${filename}`, content)
  }),
  readProjectFile: vi.fn(async (_folder: unknown, relativeFolder: string, filename: string) => {
    const content = files.get(`${relativeFolder}/${filename}`)
    if (content === undefined) throw new Error(`Ficheiro não encontrado: ${relativeFolder}/${filename}`)
    return content
  }),
}))

Object.defineProperty(globalThis, 'window', {
  value: globalThis,
  configurable: true,
})

const { db } = await import('../../src/lib/storage/db')
const database = db
if (!database) throw new Error('A base local não foi inicializada para os testes.')

const {
  saveDatabaseSnapshot,
  verifyDatabaseSnapshot,
  previewDatabaseRestore,
  compareDatabaseRestore,
  restoreDatabaseMerge,
  rollbackDatabaseRestore,
} = await import('../../src/lib/storage/project-snapshot')

const folder = {} as FileSystemDirectoryHandle
const now = '2026-01-01T00:00:00.000Z'

const club = (id: string, name: string) => ({
  id,
  name,
  shortName: name.slice(0, 2),
  createdAt: now,
  updatedAt: now,
})

const player = (id: string, displayName: string) => ({
  id,
  displayName,
  firstName: displayName.split(' ')[0],
  lastName: displayName.split(' ').slice(1).join(' ') || displayName,
  position: 'PE' as const,
  shirtNumber: 7,
  photoPath: '',
  active: true,
  createdAt: now,
  updatedAt: now,
})

async function clearDatabase() {
  for (const table of database.tables) await table.clear()
}

describe('local project storage: backup, restore and rollback', () => {
  beforeEach(async () => {
    files.clear()
    await clearDatabase()
  })

  it('creates and validates a complete database snapshot', async () => {
    await database.clubs.put(club('club-1', 'Clube Teste'))
    await database.players.put(player('player-1', 'Jogador Teste'))
    await database.matchSquads.put({ id: 'squad-1', matchId: 'match-1', playerId: 'player-1', teamId: 'team-1', starter: true, captain: false })

    await expect(saveDatabaseSnapshot(folder)).resolves.toBe('project-v1.json')

    const verification = await verifyDatabaseSnapshot(folder)
    expect(verification.filename).toBe('project-v1.json')
    expect(verification.tableCounts.clubs).toBe(1)
    expect(verification.tableCounts.players).toBe(1)
    expect(verification.tableCounts.matchSquads).toBe(1)
    expect(files.has('database/project-v1.json')).toBe(true)
  })

  it('previews the backup without changing the current database', async () => {
    await database.clubs.put(club('club-1', 'Clube Teste'))
    await saveDatabaseSnapshot(folder)

    await database.clubs.update('club-1', { name: 'Alterado localmente' })

    const preview = await previewDatabaseRestore(folder)
    expect(preview.totalRows).toBe(1)
    expect(await database.clubs.get('club-1')).toMatchObject({ name: 'Alterado localmente' })
  })

  it('detects added, removed and changed rows before restoring', async () => {
    await database.clubs.bulkPut([
      club('club-1', 'Clube Original'),
      club('club-2', 'Só no backup'),
    ])
    await saveDatabaseSnapshot(folder)

    await database.clubs.put(club('club-1', 'Clube Alterado'))
    await database.clubs.put(club('club-3', 'Só no atual'))
    await database.clubs.delete('club-2')

    const diff = await compareDatabaseRestore(folder)
    expect(diff.tables.clubs).toEqual({ current: 2, backup: 2, added: 1, removed: 1, changed: 1 })
    expect(diff.added).toBe(1)
    expect(diff.removed).toBe(1)
    expect(diff.changed).toBe(1)
  })

  it('merges the backup without deleting current-only rows and creates a safety backup', async () => {
    await database.clubs.put(club('club-1', 'Nome original'))
    await database.players.put(player('player-1', 'Jogador Original'))
    await saveDatabaseSnapshot(folder)

    await database.clubs.put(club('club-1', 'Nome alterado'))
    await database.players.put(player('player-2', 'Só no atual'))

    const result = await restoreDatabaseMerge(folder)
    expect(result.restoredRows).toBe(2)
    expect(result.preservedRows).toBe(1)
    expect(result.safetyBackup).toMatch(/^pre-restore-.*\.json$/)
    expect(files.has(`database/${result.safetyBackup}`)).toBe(true)
    expect(await database.clubs.get('club-1')).toMatchObject({ name: 'Nome original' })
    expect(await database.players.get('player-2')).toMatchObject({ displayName: 'Só no atual' })
  })

  it('rolls back to the exact pre-restore state', async () => {
    await database.clubs.put(club('club-1', 'Estado antes'))
    await database.players.put(player('player-1', 'Jogador Antes'))
    await saveDatabaseSnapshot(folder)

    await database.clubs.put(club('club-1', 'Estado modificado'))
    await database.players.put(player('player-2', 'Extra antes do restore'))

    const restoreResult = await restoreDatabaseMerge(folder)
    await database.clubs.put(club('club-1', 'Estado depois do restore'))

    const rollback = await rollbackDatabaseRestore(folder, restoreResult.safetyBackup)
    expect(rollback.restoredRows).toBe(3)
    expect(await database.clubs.get('club-1')).toMatchObject({ name: 'Estado modificado' })
    expect(await database.players.get('player-2')).toMatchObject({ displayName: 'Extra antes do restore' })
  })
})
