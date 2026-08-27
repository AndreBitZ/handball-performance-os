import { initializeProjectStorage, readProjectManifest, type ProjectManifest } from './project-manifest'
import { loadProjectFolderHandle, requestProjectFolderPermission, saveProjectFolderHandle } from './project-session'
import { openProjectFolder, type ProjectFolder, type ProjectFolderHandle } from './local-project'

export type ProjectOpenResult = {
  project: ProjectFolder
  manifest: ProjectManifest
  created: boolean
}

/** Create a brand-new local project and remember its handle for this browser. */
export async function createLocalProject(): Promise<ProjectOpenResult> {
  const project = await openProjectFolder()
  const manifest = await initializeProjectStorage(project.handle)
  await saveProjectFolderHandle(project.handle)
  return { project, manifest, created: true }
}

/** Open an existing local project selected by the user and validate its manifest. */
export async function openLocalProject(): Promise<ProjectOpenResult> {
  const project = await openProjectFolder()
  const manifest = await readProjectManifest(project.handle)

  // OPFS/IndexedDB handles do not expose the File System Access permission API.
  const permitted = await requestProjectFolderPermissionIfSupported(project.handle)
  if (!permitted) {
    throw new Error('A aplicação não tem permissão para escrever na pasta do projeto.')
  }

  await saveProjectFolderHandle(project.handle)
  return { project, manifest, created: false }
}

async function requestProjectFolderPermissionIfSupported(handle: ProjectFolderHandle): Promise<boolean> {
  if (typeof handle === 'object' && 'kind' in handle) return true
  return requestProjectFolderPermission(handle)
}

/** Reconnect to the last project without showing the folder picker again. */
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
      mode: typeof handle === 'object' && 'kind' in handle ? handle.kind : 'filesystem',
    },
    manifest,
    created: false,
  }
}
