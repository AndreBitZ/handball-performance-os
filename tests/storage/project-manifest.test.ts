import { describe, expect, it } from 'vitest'
import { initializeProjectStorage, readProjectManifest, projectFolderNames } from '../../src/lib/storage/project-manifest'

type Entry = { kind: 'file'; content: string } | { kind: 'directory'; entries: Map<string, Entry> }

function makeDirectory(entries = new Map<string, Entry>()): FileSystemDirectoryHandle {
  return {
    kind: 'directory',
    name: 'project',
    async getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions) {
      const entry = entries.get(name)
      if (entry?.kind === 'directory') return makeDirectory(entry.entries)
      if (options?.create) {
        const created: Entry = { kind: 'directory', entries: new Map() }
        entries.set(name, created)
        return makeDirectory(created.entries)
      }
      throw new DOMException('Not found', 'NotFoundError')
    },
    async getFileHandle(name: string, options?: FileSystemGetFileOptions) {
      const entry = entries.get(name)
      if (entry?.kind === 'file') return makeFile(name, entry)
      if (options?.create) {
        const created: Entry = { kind: 'file', content: '' }
        entries.set(name, created)
        return makeFile(name, created)
      }
      throw new DOMException('Not found', 'NotFoundError')
    },
    async *entries() {
      for (const [name, entry] of entries) yield [name, entry as unknown as FileSystemDirectoryHandle]
    },
    async *keys() { for (const name of entries.keys()) yield name },
    async *values() { for (const entry of entries.values()) yield entry as unknown as FileSystemDirectoryHandle },
    async removeEntry(name: string) { entries.delete(name) },
    async resolve() { return null },
  } as unknown as FileSystemDirectoryHandle
}

function makeFile(name: string, entry: { kind: 'file'; content: string }): FileSystemFileHandle {
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

describe('project manifest', () => {
  it('creates the complete local project structure and manifest', async () => {
    const root = makeDirectory()
    const manifest = await initializeProjectStorage(root)

    expect(manifest.version).toBe(1)
    expect(manifest.app).toBe('handball-performance-os')
    expect(projectFolderNames()).toContain('players')
    expect(projectFolderNames()).toContain('matches')
    expect(await readProjectManifest(root)).toEqual(manifest)
  })

  it('rejects an incompatible project manifest', async () => {
    const root = makeDirectory()
    const database = await root.getDirectoryHandle('database', { create: true })
    const file = await database.getFileHandle('project.json', { create: true })
    const writable = await file.createWritable()
    await writable.write('{"version":99,"app":"other"}')
    await writable.close()

    await expect(readProjectManifest(root)).rejects.toThrow('não é compatível')
  })
})
