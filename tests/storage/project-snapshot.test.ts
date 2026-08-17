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

;(globalThis as typeof globalThis & { window?: object }).window = {}

const { db } = await import('../../src/lib/storage/db')
const {
  saveDatabaseSnapshot,
  verifyDatabaseSnapshot,
  previewDatabaseRestore,
  compareDatabaseRestore,
  restoreDatabaseMerge,
  rollbackDatabaseRestore,
} = await import('../../src/lib/storage/project-snapshot')

const folder = {} as FileSystemDirectoryHandle

async function clearDatabase() {
  for (const table of db.tables) {
    await table.clear()
  }
}

describe('local project storage: backup, restore and rollback', () => {
  beforeEach(async () => {
    files.clear()
    await clearDatabase()
  })

  it('creates and validates a complete database snapshot', async () => {
    await db.clubs.put({ id: 'club-1', name: 'Clube Teste', shortName: 'CT', logoUrl: '' })
    await db.players.put({ id: 'player-1', displayName: 'Jogador Teste', firstName: 'Jogador', lastName: 'Teste', position: 'Ponta', birthDate: '', jerseyNumber: 7, photoUrl: '', active: true })
    await db.matchSquads.put({ id: 'squad-1', matchId: 'match-1', playerId: 'player-1', teamId: 'team-1', starter: true, captain: false })

    await expect(saveDatabaseSnapshot(folder)).resolves.toBe('project-v1.json')

    const verification = await verifyDatabaseSnapshot(folder)
    expect(verification.filename).toBe('project-v1.json')
    expect(verification.tableCounts.clubs).toBe(1)
    expect(verification.tableCounts.players).toBe(1)
    expect(verification.tableCounts.matchSquads).toBe(1)
    expect(files.has('database/project-v1.json')).toBe(true)
  })

  it('previews the backup without changing the current database', async () => {
    await db.clubs.put({ id: 'club-1', name: 'Clube Teste', shortName: 'CT', logoUrl: '' })
    await saveDatabaseSnapshot(folder)

    await db.clubs.update('club-1', { name: 'Alterado localmente' })

    const preview = await previewDatabaseRestore(folder)
    expect(preview.totalRows).toBe(1)
    expect(await db.clubs.get('club-1')).toMatchObject({ name: 'Alterado localmente' })
  })

  it('detects added, removed and changed rows before restoring', async () => {
    await db.clubs.bulkPut([
      { id: 'club-1', name: 'Clube Original', shortName: 'CO', logoUrl: '' },
      { id: 'club-2', name: 'Só no backup', shortName: 'SB', logoUrl: '' },
    ])
    await saveDatabaseSnapshot(folder)

    await db.clubs.put({ id: 'club-1', name: 'Clube Alterado', shortName: 'CA', logoUrl: '' })
    await db.clubs.put({ id: 'club-3', name: 'Só no atual', shortName: 'SA', logoUrl: '' })
    await db.clubs.delete('club-2')

    const diff = await compareDatabaseRestore(folder)
    expect(diff.tables.clubs).toEqual({ current: 2, backup: 2, added: 1, removed: 1, changed: 1 })
    expect(diff.added).toBe(1)
    expect(diff.removed).toBe(1)
    expect(diff.changed).toBe(1)
  })

  it('merges the backup without deleting current-only rows and creates a safety backup', async () => {
    await db.clubs.put({ id: 'club-1', name: 'Nome original', shortName: 'NO', logoUrl: '' })
    await db.players.put({ id: 'player-1', displayName: 'Jogador original', firstName: 'Jogador', lastName: 'Original', position: 'Ponta', birthDate: '', jerseyNumber: 7, photoUrl: '', active: true })
    await saveDatabaseSnapshot(folder)

    await db.clubs.put({ id: 'club-1', name: 'Nome alterado', shortName: 'NA', logoUrl: '' })
    await db.players.put({ id: 'player-2', displayName: 'Só no atual', firstName: 'Só', lastName: 'Atual', position: 'Central', birthDate: '', jerseyNumber: 8, photoUrl: '', active: true })

    const result = await restoreDatabaseMerge(folder)
    expect(result.restoredRows).toBe(2)
    expect(result.preservedRows).toBe(1)
    expect(result.safetyBackup).toMatch(/^pre-restore-.*\.json$/)
    expect(files.has(`database/${result.safetyBackup}`)).toBe(true)
    expect(await db.clubs.get('club-1')).toMatchObject({ name: 'Nome original' })
    expect(await db.players.get('player-2')).toMatchObject({ displayName: 'Só no atual' })
  })

  it('rolls back to the exact pre-restore state', async () => {
    await db.clubs.put({ id: 'club-1', name: 'Estado antes', shortName: 'EA', logoUrl: '' })
    await db.players.put({ id: 'player-1', displayName: 'Jogador antes', firstName: 'Jogador', lastName: 'Antes', position: 'Ponta', birthDate: '', jerseyNumber: 7, photoUrl: '', active: true })
    await saveDatabaseSnapshot(folder)

    await db.clubs.put({ id: 'club-1', name: 'Estado modificado', shortName: 'EM', logoUrl: '' })
    await db.players.put({ id: 'player-2', displayName: 'Extra antes do restore', firstName: 'Extra', lastName: 'Antes', position: 'Central', birthDate: '', jerseyNumber: 8, photoUrl: '', active: true })

    const restoreResult = await restoreDatabaseMerge(folder)
    await db.clubs.put({ id: 'club-1', name: 'Estado depois do restore', shortName: 'ED', logoUrl: '' })

    const rollback = await rollbackDatabaseRestore(folder, restoreResult.safetyBackup)
    expect(rollback.restoredRows).toBe(2)
    expect(await db.clubs.get('club-1')).toMatchObject({ name: 'Estado modificado' })
    expect(await db.players.get('player-2')).toMatchObject({ displayName: 'Extra antes do restore' })
  })
})
