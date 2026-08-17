import { describe, expect, it } from 'vitest'
import { exportProjectToLocal } from '../../src/lib/storage/export-import'
import { readProjectFile, listProjectFiles } from '../../src/lib/storage/local-project'

type MemoryEntry =
  | { kind: 'file'; content: string }
  | { kind: 'directory'; entries: Map<string, MemoryEntry> }

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
      return (async function* () {
        for (const [name, entry] of entries) {
          yield [name, entry.kind === 'file' ? file(name, entry) : directory(entry.entries)] as [string, FileSystemDirectoryHandle | FileSystemFileHandle]
        }
      })()
    },
    keys() {
      return (async function* () {
        for (const name of entries.keys()) yield name
      })()
    },
    values() {
      return (async function* () {
        for (const [name, entry] of entries) yield entry.kind === 'file' ? file(name, entry) : directory(entry.entries)
      })()
    },
    removeEntry: async (name: string) => { entries.delete(name) },
    resolve: async () => null,
    isSameEntry: async () => false,
  } as unknown as FileSystemDirectoryHandle

  return handle
}

function file(name: string, entry: { kind: 'file'; content: string }): FileSystemFileHandle {
  return {
    kind: 'file',
    name,
    async getFile() { return new File([entry.content], name, { type: 'application/json' }) },
    async createWritable() {
      let next = entry.content
      return {
        async write(data: FileSystemWriteChunkType) { next = typeof data === 'string' ? data : await new Response(data as BodyInit).text() },
        async close() { entry.content = next },
        async abort() {},
        locked: false,
      } as FileSystemWritableFileStream
    },
    isSameEntry: async () => false,
  }
}

const dump = (players: unknown[] = [{ id: 'p1', displayName: 'Player 1' }]) => JSON.stringify({
  version: 1,
  exportedAt: '2026-08-17T12:00:00.000Z',
  data: {
    clubs: [], teams: [], seasons: [], players, playerTeamSeasons: [], competitions: [], matches: [], matchSquads: [], events: [], clips: [], playlists: [],
  },
})

describe('project export to local filesystem', () => {
  it('writes, verifies and reports the exported project', async () => {
    const root = directory()
    const report = await exportProjectToLocal(root, new Blob([dump()]))
    expect(report).toMatchObject({ rows: 1, verified: true, backupFile: null })
    expect(await readProjectFile(root, 'database', 'project-v1.json')).toBe(dump())
  })

  it('backs up the previous project before replacing it', async () => {
    const root = directory()
    await exportProjectToLocal(root, new Blob([dump()]))
    const next = dump([{ id: 'p2', displayName: 'Player 2' }])
    const report = await exportProjectToLocal(root, new Blob([next]))
    expect(report.backupFile).toMatch(/^project-v1-.*\.json$/)
    expect(await listProjectFiles(root, 'backups')).toEqual([report.backupFile!])
    expect(await readProjectFile(root, 'database', 'project-v1.json')).toBe(next)
    expect(await readProjectFile(root, 'backups', report.backupFile!)).toBe(dump())
  })

  it('rejects an incompatible project before writing', async () => {
    const root = directory()
    await expect(exportProjectToLocal(root, new Blob([JSON.stringify({ version: 2, data: {} })]))).rejects.toThrow('incompatível')
  })
})
