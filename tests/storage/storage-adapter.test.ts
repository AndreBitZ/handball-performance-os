import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  saveDatabaseSnapshot: vi.fn(async () => 'project-v1.json'),
  verifyDatabaseSnapshot: vi.fn(async () => ({ filename: 'project-v1.json', exportedAt: '2026-01-01T00:00:00.000Z', tableCounts: { clubs: 1 } })),
  previewDatabaseRestore: vi.fn(async () => ({ filename: 'project-v1.json', exportedAt: '2026-01-01T00:00:00.000Z', tableCounts: { clubs: 1 }, totalRows: 1 })),
  compareDatabaseRestore: vi.fn(async () => ({ filename: 'project-v1.json', exportedAt: '2026-01-01T00:00:00.000Z', totalCurrent: 1, totalBackup: 1, added: 0, removed: 0, changed: 0, tables: {} })),
  restoreDatabaseMerge: vi.fn(async () => ({ restoredRows: 1, preservedRows: 0, safetyBackup: 'pre-restore-test.json' })),
  rollbackDatabaseRestore: vi.fn(async () => ({ restoredRows: 1, safetyBackup: 'pre-restore-test.json' })),
}))

vi.mock('../../src/lib/storage/project-snapshot', () => mocks)

const { dexieStorageAdapter } = await import('../../src/lib/storage/storage-adapter')

describe('storage adapter boundary', () => {
  const folder = {} as FileSystemDirectoryHandle

  it('delegates snapshot creation and verification', async () => {
    await expect(dexieStorageAdapter.saveDatabaseSnapshot(folder)).resolves.toBe('project-v1.json')
    await expect(dexieStorageAdapter.verifyDatabaseSnapshot(folder)).resolves.toMatchObject({ filename: 'project-v1.json' })
    expect(mocks.saveDatabaseSnapshot).toHaveBeenCalledWith(folder)
    expect(mocks.verifyDatabaseSnapshot).toHaveBeenCalledWith(folder)
  })

  it('delegates preview and comparison without changing the contract', async () => {
    await expect(dexieStorageAdapter.previewDatabaseRestore(folder)).resolves.toMatchObject({ totalRows: 1 })
    await expect(dexieStorageAdapter.compareDatabaseRestore(folder)).resolves.toMatchObject({ changed: 0 })
  })

  it('delegates restore and rollback operations', async () => {
    await expect(dexieStorageAdapter.restoreDatabaseMerge(folder)).resolves.toMatchObject({ safetyBackup: 'pre-restore-test.json' })
    await expect(dexieStorageAdapter.rollbackDatabaseRestore(folder, 'pre-restore-test.json')).resolves.toMatchObject({ restoredRows: 1 })
    expect(mocks.restoreDatabaseMerge).toHaveBeenCalledWith(folder)
    expect(mocks.rollbackDatabaseRestore).toHaveBeenCalledWith(folder, 'pre-restore-test.json')
  })
})
