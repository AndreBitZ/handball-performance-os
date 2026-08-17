import { describe, expect, it } from 'vitest'
import { LocalProjectDataStore } from '../../src/lib/storage/local-data-store'

type Entry =
  | { kind: 'file'; content: string }
  | { kind: 'directory'; entries: Map<string, Entry> }

function file(name: string, entry: { kind: 'file'; content: string }): FileSystemFileHandle {
  return {
    kind: 'file',
    name,
    async getFile() { return new File([entry.content], name) },
    async createWritable() {
      let next = entry.content
      return {
        async write(data: FileSystemWriteChunkType) {
          next = typeof data === 'string' ? data : await new Response(data as BodyInit).text()
        },
        async close() { entry.content = next },
        async abort() {},
        locked: false,
      } as FileSystemWritableFileStream
    },
    isSameEntry: async () => false,
  }
}

function directory(entries = new Map<string, Entry>()): FileSystemDirectoryHandle {
  return {
    kind: 'directory',
    name: 'memory',
    async getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions) {
      const entry = entries.get(name)
      if (entry?.kind === 'directory') return directory(entry.entries)
      if (options?.create) {
        const created: Entry = { kind: 'directory', entries: new Map() }
        entries.set(name, created)
        return directory(created.entries)
      }
      throw new DOMException(`Directory ${name} not found`, 'NotFoundError')
    },
    async getFileHandle(name: string, options?: FileSystemGetFileOptions) {
      const entry = entries.get(name)
      if (entry?.kind === 'file') return file(name, entry)
      if (options?.create) {
        const created: Entry = { kind: 'file', content: '' }
        entries.set(name, created)
        return file(name, created)
      }
      throw new DOMException(`File ${name} not found`, 'NotFoundError')
    },
    async *entries() {
      for (const [name, entry] of entries) {
        yield [name, entry.kind === 'file' ? file(name, entry) : directory(entry.entries)]
      }
    },
    async *keys() { for (const name of entries.keys()) yield name },
    async *values() {
      for (const [name, entry] of entries) {
        yield entry.kind === 'file' ? file(name, entry) : directory(entry.entries)
      }
    },
    async removeEntry(name: string) { entries.delete(name) },
    async resolve() { return null },
    isSameEntry: async () => false,
  } as unknown as FileSystemDirectoryHandle
}

describe('LocalProjectDataStore', () => {
  it('creates, reads, updates and deletes entities', async () => {
    const store = new LocalProjectDataStore(directory())

    await store.upsert('players', { id: 'p1', name: 'Ana' })
    await expect(store.get('players', 'p1')).resolves.toEqual({ id: 'p1', name: 'Ana' })

    await store.upsert('players', { id: 'p1', name: 'Ana Silva', number: 7 })
    await expect(store.list('players')).resolves.toEqual([
      { id: 'p1', name: 'Ana Silva', number: 7 },
    ])

    await expect(store.remove('players', 'p1')).resolves.toBe(true)
    await expect(store.get('players', 'p1')).resolves.toBeNull()
    await expect(store.remove('players', 'missing')).resolves.toBe(false)
  })

  it('keeps tables isolated and persists data between store instances', async () => {
    const root = directory()
    const first = new LocalProjectDataStore(root)

    await first.upsert('teams', { id: 't1', name: 'Seniores' })
    await first.upsert('players', { id: 'p1', name: 'Maria' })

    const second = new LocalProjectDataStore(root)
    await expect(second.list('teams')).resolves.toEqual([{ id: 't1', name: 'Seniores' }])
    await expect(second.list('players')).resolves.toEqual([{ id: 'p1', name: 'Maria' }])
    await expect(second.list('matches')).resolves.toEqual([])
  })
})
