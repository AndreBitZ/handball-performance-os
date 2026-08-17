import { PROJECT_FOLDERS, type ProjectFolderName } from './local-project'
import { readProjectFile, writeProjectFile } from './local-project'

export const PROJECT_MANIFEST_FILENAME = 'project.json'
export const PROJECT_MANIFEST_VERSION = 1 as const

export type ProjectManifest = {
  version: typeof PROJECT_MANIFEST_VERSION
  app: 'handball-performance-os'
  createdAt: string
  updatedAt: string
}

export async function initializeProjectStorage(
  root: FileSystemDirectoryHandle,
): Promise<ProjectManifest> {
  const now = new Date().toISOString()
  const manifest: ProjectManifest = {
    version: PROJECT_MANIFEST_VERSION,
    app: 'handball-performance-os',
    createdAt: now,
    updatedAt: now,
  }

  for (const folder of PROJECT_FOLDERS) {
    await root.getDirectoryHandle(folder, { create: true })
  }

  await writeProjectFile(root, 'database', PROJECT_MANIFEST_FILENAME, JSON.stringify(manifest, null, 2))
  return manifest
}

export async function readProjectManifest(
  root: FileSystemDirectoryHandle,
): Promise<ProjectManifest> {
  const text = await readProjectFile(root, 'database', PROJECT_MANIFEST_FILENAME)
  let manifest: unknown

  try {
    manifest = JSON.parse(text)
  } catch {
    throw new Error('O projeto local contém um manifesto JSON inválido.')
  }

  if (
    !manifest ||
    typeof manifest !== 'object' ||
    (manifest as ProjectManifest).version !== PROJECT_MANIFEST_VERSION ||
    (manifest as ProjectManifest).app !== 'handball-performance-os'
  ) {
    throw new Error('O projeto local não é compatível com esta versão da aplicação.')
  }

  return manifest as ProjectManifest
}

export function projectFolderNames(): readonly ProjectFolderName[] {
  return PROJECT_FOLDERS
}
