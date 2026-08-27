import { initializeProjectStorage, readProjectManifest, type ProjectManifest } from './project-manifest'
import { loadProjectFolderHandle, requestProjectFolderPermission, saveProjectFolderHandle } from './project-session'
import { openProjectFolder, type ProjectFolder, type ProjectFolderHandle } from './local-project'

export type ProjectOpenResult = {
  project: ProjectFolder
  manifest: ProjectManifest
  created: boolean
}

export async function createLocalProject(): Promise<ProjectOpenResult> {
  const project = await openProjectFolder()
  const manifest = await initializeProjectStorage(project.handle)
  await saveProjectFolderHandle(project.handle)
  return { project, manifest, created: true }
}

export async function openLocalProject(): Promise<ProjectOpenResult> {
  const project = await openProjectFolder()
  const manifest = await readProjectManifest(project.handle)
  const permitted = await requestProjectFolderPermissionIfSupported(project.handle)
  if (!permitted) throw new Error('A aplicação não tem permissão para escrever na pasta do projeto.')
  await saveProjectFolderHandle(project.handle)
  return { project, manifest, created: false }
}

async function requestProjectFolderPermissionIfSupported(handle: ProjectFolderHandle): Promise<boolean> {
  if (typeof handle === 'object' && 'kind' in handle) return true
  return requestProjectFolderPermission(handle)
}

function modeFromHandle(handle: ProjectFolderHandle): ProjectFolder['mode'] {
  if (typeof handle === 'object' && 'kind' in handle) {
    const kind = handle.kind
    return kind === 'directory' ? 'opfs' : kind
  }
  return 'filesystem'
}

export async function reconnectLocalProject(): Promise<ProjectOpenResult | null> {
  const handle = await loadProjectFolderHandle()
  if (!handle) return null

  const permitted = await requestProjectFolderPermissionIfSupported(handle)
  if (!permitted) return null

  const manifest = await readProjectManifest(handle)
  return {
    project: {
      name: 'Handball Performance OS',
      handle,
      mode: modeFromHandle(handle),
    },
    manifest,
    created: false,
  }
}
