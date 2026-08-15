export type ProjectFolder = {
  name: string;
  handle: FileSystemDirectoryHandle;
};

export type ProjectFolderName =
  | "database"
  | "clubs"
  | "teams"
  | "players"
  | "seasons"
  | "competitions"
  | "matches"
  | "reports"
  | "backups"
  | "exports";

export const PROJECT_FOLDERS: readonly ProjectFolderName[] = [
  "database",
  "clubs",
  "teams",
  "players",
  "seasons",
  "competitions",
  "matches",
  "reports",
  "backups",
  "exports",
] as const;

export async function openProjectFolder(): Promise<ProjectFolder> {
  if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
    throw new Error("Acesso a pastas locais não é suportado neste ambiente.");
  }

  const picker = (window as Window & {
    showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
  }).showDirectoryPicker;

  const handle = await picker();

  for (const folder of PROJECT_FOLDERS) {
    await handle.getDirectoryHandle(folder, { create: true });
  }

  return { name: "Handball Performance OS", handle };
}

export async function writeProjectFile(
  folder: FileSystemDirectoryHandle,
  relativeFolder: ProjectFolderName,
  filename: string,
  content: string,
): Promise<void> {
  const directory = await folder.getDirectoryHandle(relativeFolder, { create: true });
  const file = await directory.getFileHandle(filename, { create: true });
  const writable = await file.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function readProjectFile(
  folder: FileSystemDirectoryHandle,
  relativeFolder: ProjectFolderName,
  filename: string,
): Promise<string> {
  const directory = await folder.getDirectoryHandle(relativeFolder);
  const file = await directory.getFileHandle(filename);
  const blob = await file.getFile();
  return blob.text();
}

export async function listProjectFiles(
  folder: FileSystemDirectoryHandle,
  relativeFolder: ProjectFolderName,
): Promise<string[]> {
  const directory = await folder.getDirectoryHandle(relativeFolder);
  const files: string[] = [];

  for await (const [name, entry] of directory.entries()) {
    if (entry.kind === "file") files.push(name);
  }

  return files.sort();
}
