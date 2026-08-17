import { describe, expect, it } from 'vitest'
import {
  listProjectFiles,
  readProjectFile,
  writeProjectFile,
} from '../../src/lib/storage/local-project'

type MemoryEntry =
  | { kind: 'file'; content: string }
  | { kind: 'directory'; entries: Map<string, MemoryEntry> }

/** Minimal File System Access API test double with explicit structural typing. */
function directory(entries = new Map<string, MemoryEntry>()): FileSystemDirectoryHandle {
  const handle = {
    kind: 'directory' as const,
    name: 'memory',
    async getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions) {
      const entry = entries.get(name)
      if (entry?.kind === 'directory') return directory(entry.entries)
      if (options?.create) {
        const created: MemoryEntry = { kind: 'directory', entries: new Map() }
        entries.set(name, created)
        return directory(created.entries)
      }
      throw new DOMException(`Directory ${name} not found`, 'NotFoundError')
    },
    async getFileHandle(name: string, options?: FileSystemGetFileOptions) {
      const entry = entries.get(name)
      if (entry?.kind === 'file') return file(name, entry)
      if (options?.create) {
        const created: MemoryEntry = { kind: 'file', content: '' }
        entries.set(name, created)
        return file(name, created)
      }
      throw new DOMException(`File ${name} not found`, 'NotFoundError')
    },
    entries() {
      return (async function* (): AsyncGenerator<
        [string, FileSystemDirectoryHandle | FileSystemFileHandle],
        void,
        unknown
      > {
        for (const [name, entry] of entries) {
          yield [name, entry.kind === 'file' ? file(name, entry) : directory(entry.entries)]
        }
      })()
    },
    keys() {
      return (async function* (): AsyncGenerator<string, void, unknown> {
        for (const name of entries.keys()) yield name
      })()
    },
    values() {
      return (async function* (): AsyncGenerator<
        FileSystemDirectoryHandle | FileSystemFileHandle,
        void,
        unknown
      > {
        for (const [name, entry] of entries) {
          yield entry.kind === 'file' ? file(name, entry) : directory(entry.entries)
        }
      })()
    },
    async removeEntry(name: string) {
      entries.delete(name)
    },
    async resolve() {
      return null
    },
    isSameEntry: async () => false,
  } as unknown as FileSystemDirectoryHandle

  return handle
}

function file(name: string, entry: { kind: 'file'; content: string }): FileSystemFileHandle {
  return {
    kind: 'file',
    name,
    async getFile() {
      return new File([entry.content], name, { type: 'application/json' })
    },
    async createWritable() {
      let next = entry.content
      return {
        async write(data: FileSystemWriteChunkType) {
          next = typeof data === 'string' ? data : await new Response(data as BodyInit).text()
        },
        async close() {
          entry.content = next
        },
        async abort() {},
        locked: false,
      } as FileSystemWritableFileStream
    },
    isSameEntry: async () => false,
  }
}

describe('local project filesystem operations', () => {
  it('writes a file and reads the exact content back', async () => {
    const root = directory()
    const content = JSON.stringify({ version: 1, players: [{ id: 'p1' }] })

    await writeProjectFile(root, 'players', 'players.json', content)
    await expect(readProjectFile(root, 'players', 'players.json')).resolves.toBe(content)
  })

  it('lists only files and sorts them deterministically', async () => {
    const root = directory()

    await writeProjectFile(root, 'reports', 'z-report.json', '{}')
    await writeProjectFile(root, 'reports', 'a-report.json', '{}')

    await expect(listProjectFiles(root, 'reports')).resolves.toEqual([
      'a-report.json',
      'z-report.json',
    ])
  })

  it('creates the project subdirectory on first write', async () => {
    const root = directory()

    await writeProjectFile(root, 'database', 'project-v1.json', '{"version":1}')
    await expect(readProjectFile(root, 'database', 'project-v1.json')).resolves.toBe('{"version":1}')
  })
})
