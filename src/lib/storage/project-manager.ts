import { initializeProjectStorage, readProjectManifest, type ProjectManifest } from './project-manifest'
import { loadProjectFolderHandle, requestProjectFolderPermission, saveProjectFolderHandle } from './project-session'
import { openProjectFolder, type ProjectFolder } from './local-project'

export type ProjectOpenResult = {
  project: ProjectFolder
  manifest: ProjectManifest
  created: boolean
}

/** Create a brand-new local project and remember its folder handle for this browser. */
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
  const permitted = await requestProjectFolderPermission(project.handle)

  if (!permitted) {
    throw new Error('A aplicação não tem permissão para escrever na pasta do projeto.')
  }

  await saveProjectFolderHandle(project.handle)
  return { project, manifest, created: false }
}

/** Reconnect to the last project without showing the folder picker again. */
export async function reconnectLocalProject(): Promise<ProjectOpenResult | null> {
  const handle = await loadProjectFolderHandle()
  if (!handle) return null

  const permitted = await requestProjectFolderPermission(handle)
  if (!permitted) return null

  const manifest = await readProjectManifest(handle)
  return {
    project: { name: 'Handball Performance OS', handle },
    manifest,
    created: false,
  }
}
