import { describe, expect, it } from 'vitest'
import { FileSystemStorageAdapter } from '../../src/lib/storage/filesystem-storage-adapter'

describe('FileSystemStorageAdapter', () => {
  it('keeps the explicitly granted directory handle', () => {
    const handle = { name: 'handball-data', kind: 'directory' } as FileSystemDirectoryHandle
    const adapter = new FileSystemStorageAdapter(handle)

    expect(adapter.getDirectoryHandle()).toBe(handle)
  })

  it('does not silently fall back to Dexie before filesystem migration is implemented', async () => {
    const handle = { name: 'handball-data', kind: 'directory' } as FileSystemDirectoryHandle
    const adapter = new FileSystemStorageAdapter(handle)

    await expect(adapter.saveDatabaseSnapshot(handle)).rejects.toThrow(
      'Filesystem storage operation "saveDatabaseSnapshot" is not implemented yet',
    )
  })
})
