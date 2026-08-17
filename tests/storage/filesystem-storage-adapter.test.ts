import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  saveDatabaseSnapshot: vi.fn(),
  verifyDatabaseSnapshot: vi.fn(),
  previewDatabaseRestore: vi.fn(),
  compareDatabaseRestore: vi.fn(),
  restoreDatabaseMerge: vi.fn(),
  rollbackDatabaseRestore: vi.fn(),
}))

vi.mock('../../src/lib/storage/project-snapshot', () => mocks)

import { FileSystemStorageAdapter } from '../../src/lib/storage/filesystem-storage-adapter'

describe('FileSystemStorageAdapter', () => {
  const handle = { name: 'handball-data', kind: 'directory' } as FileSystemDirectoryHandle
  let adapter: FileSystemStorageAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new FileSystemStorageAdapter(handle)
  })

  it('keeps the explicitly granted directory handle', () => {
    expect(adapter.getDirectoryHandle()).toBe(handle)
  })

  it('writes snapshots through the filesystem snapshot implementation', async () => {
    mocks.saveDatabaseSnapshot.mockResolvedValue('project-v1.json')

    await expect(adapter.saveDatabaseSnapshot()).resolves.toBe('project-v1.json')
    expect(mocks.saveDatabaseSnapshot).toHaveBeenCalledWith(handle)
  })

  it('reads and verifies snapshots through the same directory', async () => {
    mocks.verifyDatabaseSnapshot.mockResolvedValue({
      filename: 'project-v1.json',
      exportedAt: '2026-01-01T00:00:00.000Z',
      tableCounts: { clubs: 1 },
    })

    await expect(adapter.verifyDatabaseSnapshot()).resolves.toMatchObject({
      filename: 'project-v1.json',
      tableCounts: { clubs: 1 },
    })
    expect(mocks.verifyDatabaseSnapshot).toHaveBeenCalledWith(handle)
  })
})
