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

export type LocalProjectHandle = {
  kind: "indexeddb";
  name: string;
};

export type ProjectFolderHandle = FileSystemDirectoryHandle | LocalProjectHandle;

export type ProjectFolder = {
  name: string;
  handle: ProjectFolderHandle;
  mode: "filesystem" | "indexeddb";
};

export const PROJECT_FOLDERS: readonly ProjectFolderName[] = [
  "database", "clubs", "teams", "players", "seasons", "competitions", "matches", "reports", "backups", "exports",
] as const;

const FILE_DB = "handball-performance-project-files";
const FILE_STORE = "files";

type StoredFile = { key: string; content: string; updatedAt: string };

function openFileDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FILE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(FILE_STORE, { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento local do projeto."));
  });
}

function isIndexedDbProject(handle: ProjectFolderHandle): handle is LocalProjectHandle {
  return typeof handle === "object" && "kind" in handle && handle.kind === "indexeddb";
}

function fileKey(folder: LocalProjectHandle, relativeFolder: ProjectFolderName, filename: string) {
  return `${folder.name}/${relativeFolder}/${filename}`;
}

async function localWrite(folder: LocalProjectHandle, relativeFolder: ProjectFolderName, filename: string, content: string) {
  const database = await openFileDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(FILE_STORE, "readwrite");
    transaction.objectStore(FILE_STORE).put({ key: fileKey(folder, relativeFolder, filename), content, updatedAt: new Date().toISOString() } satisfies StoredFile);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível guardar o ficheiro local."));
  });
  database.close();
}

async function localRead(folder: LocalProjectHandle, relativeFolder: ProjectFolderName, filename: string) {
  const database = await openFileDb();
  const result = await new Promise<StoredFile | undefined>((resolve, reject) => {
    const request = database.transaction(FILE_STORE, "readonly").objectStore(FILE_STORE).get(fileKey(folder, relativeFolder, filename));
    request.onsuccess = () => resolve(request.result as StoredFile | undefined);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível ler o ficheiro local."));
  });
  database.close();
  if (!result) throw new Error(`Ficheiro não encontrado: ${relativeFolder}/${filename}`);
  return result.content;
}

async function localList(folder: LocalProjectHandle, relativeFolder: ProjectFolderName) {
  const database = await openFileDb();
  const prefix = `${folder.name}/${relativeFolder}/`;
  const values = await new Promise<StoredFile[]>((resolve, reject) => {
    const request = database.transaction(FILE_STORE, "readonly").objectStore(FILE_STORE).getAll();
    request.onsuccess = () => resolve((request.result as StoredFile[]).filter((item) => item.key.startsWith(prefix)));
    request.onerror = () => reject(request.error ?? new Error("Não foi possível listar os ficheiros locais."));
  });
  database.close();
  return values.map((item) => item.key.slice(prefix.length)).sort();
}

export async function openProjectFolder(): Promise<ProjectFolder> {
  if (typeof window === "undefined") throw new Error("O armazenamento local só está disponível no navegador.");

  if ("showDirectoryPicker" in window) {
    const picker = (window as Window & { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
    const handle = await picker();
    for (const folder of PROJECT_FOLDERS) await handle.getDirectoryHandle(folder, { create: true });
    return { name: "Handball Performance OS", handle, mode: "filesystem" };
  }

  if ("indexedDB" in window) {
    const handle: LocalProjectHandle = { kind: "indexeddb", name: "Handball Performance OS — Safari Local" };
    for (const folder of PROJECT_FOLDERS) await localWrite(handle, folder, ".folder", "local");
    return { name: handle.name, handle, mode: "indexeddb" };
  }

  throw new Error("Este navegador não disponibiliza armazenamento local compatível.");
}

export async function writeProjectFile(folder: ProjectFolderHandle, relativeFolder: ProjectFolderName, filename: string, content: string): Promise<void> {
  if (isIndexedDbProject(folder)) return localWrite(folder, relativeFolder, filename, content);
  const directory = await folder.getDirectoryHandle(relativeFolder, { create: true });
  const file = await directory.getFileHandle(filename, { create: true });
  const writable = await file.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function readProjectFile(folder: ProjectFolderHandle, relativeFolder: ProjectFolderName, filename: string): Promise<string> {
  if (isIndexedDbProject(folder)) return localRead(folder, relativeFolder, filename);
  const directory = await folder.getDirectoryHandle(relativeFolder);
  const file = await directory.getFileHandle(filename);
  return (await file.getFile()).text();
}

export async function listProjectFiles(folder: ProjectFolderHandle, relativeFolder: ProjectFolderName): Promise<string[]> {
  if (isIndexedDbProject(folder)) return (await localList(folder, relativeFolder)).filter((name) => name !== ".folder");
  const directory = await folder.getDirectoryHandle(relativeFolder);
  const files: string[] = [];
  for await (const [name, entry] of directory.entries()) if (entry.kind === "file") files.push(name);
  return files.sort();
}
