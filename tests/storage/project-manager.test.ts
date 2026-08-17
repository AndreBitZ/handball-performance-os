import { describe, expect, it, vi } from 'vitest'
import {
  createLocalProject,
  openLocalProject,
  reconnectLocalProject,
} from '../../src/lib/storage/project-manager'

const handle = {} as FileSystemDirectoryHandle

vi.mock('../../src/lib/storage/local-project', () => ({
  openProjectFolder: vi.fn(async () => ({ name: 'Handball Performance OS', handle })),
}))

vi.mock('../../src/lib/storage/project-manifest', () => ({
  initializeProjectStorage: vi.fn(async () => ({
    version: 1,
    app: 'handball-performance-os',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  })),
  readProjectManifest: vi.fn(async () => ({
    version: 1,
    app: 'handball-performance-os',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  })),
}))

vi.mock('../../src/lib/storage/project-session', () => ({
  loadProjectFolderHandle: vi.fn(async () => handle),
  requestProjectFolderPermission: vi.fn(async () => true),
  saveProjectFolderHandle: vi.fn(async () => undefined),
}))

describe('local project lifecycle', () => {
  it('creates a project and persists its folder handle', async () => {
    const result = await createLocalProject()
    expect(result.created).toBe(true)
    expect(result.project.handle).toBe(handle)
    expect(result.manifest.version).toBe(1)
  })

  it('opens an existing compatible project only after permission is granted', async () => {
    const result = await openLocalProject()
    expect(result.created).toBe(false)
    expect(result.manifest.app).toBe('handball-performance-os')
  })

  it('reconnects to the last project without a picker', async () => {
    const result = await reconnectLocalProject()
    expect(result?.created).toBe(false)
    expect(result?.project.handle).toBe(handle)
  })
})
