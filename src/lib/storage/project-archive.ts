import JSZip from 'jszip'
import { exportProject, importProject } from './export-import'
import { db } from './db'
import { PROJECT_FOLDERS, type ProjectFolderName } from './local-project'

const ARCHIVE_VERSION = 1

export async function createProjectArchive(): Promise<Blob> {
  if (!db) throw new Error('A base de dados local só está disponível no navegador.')
  const zip = new JSZip()
  const dump = await exportProject()
  zip.file('README.txt', 'Handball Performance OS — projeto local\n\nEste arquivo contém a base de dados do projeto e a estrutura de pastas.\nNo Safari, use Importar projeto para restaurar os dados.\n')
  zip.file('project/manifest.json', JSON.stringify({ version: ARCHIVE_VERSION, createdAt: new Date().toISOString(), folders: PROJECT_FOLDERS }, null, 2))
  zip.file('project/database/project-v1.json', await dump.text())
  for (const folder of PROJECT_FOLDERS) if (folder !== 'database') zip.file(`project/${folder}/.folder`, '')
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

export async function restoreProjectArchive(file: File): Promise<void> {
  if (!db) throw new Error('A base de dados local só está disponível no navegador.')
  const zip = await JSZip.loadAsync(file)
  const manifestEntry = zip.file('project/manifest.json')
  const databaseEntry = zip.file('project/database/project-v1.json')
  if (!manifestEntry || !databaseEntry) throw new Error('Arquivo inválido: falta o manifesto ou a base de dados do projeto.')
  const manifest = JSON.parse(await manifestEntry.async('text')) as { version?: number }
  if (manifest.version !== ARCHIVE_VERSION) throw new Error('Versão de arquivo de projeto não suportada.')
  const databaseJson = await databaseEntry.async('text')
  const projectFile = new File([databaseJson], 'project-v1.json', { type: 'application/json' })
  await importProject(projectFile)
}

export function downloadProjectArchive(blob: Blob, filename = `handball-performance-os-${new Date().toISOString().slice(0,10)}.zip`) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type ProjectArchiveFolder = ProjectFolderName
