import { exportProject } from './export-import'
import { writeProjectFile } from './local-project'

export async function saveDatabaseSnapshot(folder: FileSystemDirectoryHandle): Promise<string> {
  const dump = await exportProject()
  const filename = 'project-v1.json'
  await writeProjectFile(folder, 'database', filename, await dump.text())
  return filename
}
