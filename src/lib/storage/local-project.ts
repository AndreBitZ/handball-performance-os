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
  kind: "opfs" | "indexeddb";
  name: string;
};

export type ProjectFolderHandle = FileSystemDirectoryHandle | LocalProjectHandle;

export type ProjectFolder = {
  name: string;
  handle: ProjectFolderHandle;
  mode: "filesystem" | "opfs" | "indexeddb";
};

export const PROJECT_FOLDERS: readonly ProjectFolderName[] = [
  "database", "clubs", "teams", "players", "seasons", "competitions", "matches", "reports", "backups", "exports",
] as const;

const FILE_DB = "handball-performance-project-files";
const FILE_STORE = "files";
const OPFS_ROOT = "handball-performance-os";
const PROJECT_MANIFEST = "project-manifest.json";
const PROJECT_VERSION = 1;

type StoredFile = { key: string; content: string; updatedAt: string };

type ProjectManifest = {
  schemaVersion: number;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  storage: "filesystem" | "opfs" | "indexeddb";
  folders: readonly ProjectFolderName[];
};

function openFileDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FILE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(FILE_STORE, { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento local do projeto."));
  });
}

function isLocalProject(handle: ProjectFolderHandle): handle is LocalProjectHandle {
  return typeof handle === "object" && "kind" in handle && (handle.kind === "indexeddb" || handle.kind === "opfs");
}

function isOpfsProject(handle: ProjectFolderHandle): handle is LocalProjectHandle & { kind: "opfs" } {
  return isLocalProject(handle) && handle.kind === "opfs";
}

function fileKey(folder: LocalProjectHandle, relativeFolder: ProjectFolderName, filename: string) {
  return `${folder.name}/${relativeFolder}/${filename}`;
}

async function requestPersistentStorage() {
  if (typeof navigator === "undefined" || !navigator.storage) return false;
  try {
    if (typeof navigator.storage.persist === "function") return await navigator.storage.persist();
  } catch {
    // Safari can reject persistence requests depending on browser mode/storage policy.
  }
  return false;
}

async function opfsProjectDirectory(folder: LocalProjectHandle & { kind: "opfs" }) {
  if (typeof navigator === "undefined" || typeof navigator.storage?.getDirectory !== "function") {
    throw new Error("O armazenamento OPFS não está disponível neste navegador.");
  }
  const root = await navigator.storage.getDirectory();
  const project = await root.getDirectoryHandle(OPFS_ROOT, { create: true });
  return project.getDirectoryHandle(folder.name, { create: true });
}

async function opfsWrite(folder: LocalProjectHandle & { kind: "opfs" }, relativeFolder: ProjectFolderName, filename: string, content: string) {
  const project = await opfsProjectDirectory(folder);
  const directory = await project.getDirectoryHandle(relativeFolder, { create: true });
  const file = await directory.getFileHandle(filename, { create: true });
  const writable = await file.createWritable();
  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
}

async function opfsRead(folder: LocalProjectHandle & { kind: "opfs" }, relativeFolder: ProjectFolderName, filename: string) {
  const project = await opfsProjectDirectory(folder);
  const directory = await project.getDirectoryHandle(relativeFolder);
  const file = await directory.getFileHandle(filename);
  return (await file.getFile()).text();
}

async function opfsList(folder: LocalProjectHandle & { kind: "opfs" }, relativeFolder: ProjectFolderName) {
  const project = await opfsProjectDirectory(folder);
  const directory = await project.getDirectoryHandle(relativeFolder);
  const files: string[] = [];
  for await (const [name, entry] of directory.entries()) if (entry.kind === "file") files.push(name);
  return files.sort();
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

async function initializeProject(folder: ProjectFolder): Promise<ProjectFolder> {
  for (const relativeFolder of PROJECT_FOLDERS) {
    if (folder.mode === "filesystem") {
      await folder.handle.getDirectoryHandle(relativeFolder, { create: true });
    } else if (folder.mode === "opfs") {
      await opfsProjectDirectory(folder.handle as LocalProjectHandle & { kind: "opfs" }).then((project) => project.getDirectoryHandle(relativeFolder, { create: true }));
    } else {
      await localWrite(folder.handle as LocalProjectHandle, relativeFolder, ".folder", "local");
    }
  }
  const now = new Date().toISOString();
  const manifest: ProjectManifest = {
    schemaVersion: PROJECT_VERSION,
    projectName: folder.name,
    createdAt: now,
    updatedAt: now,
    storage: folder.mode,
    folders: PROJECT_FOLDERS,
  };
  await writeProjectFile(folder.handle, "database", PROJECT_MANIFEST, JSON.stringify(manifest, null, 2));
  if (folder.mode !== "filesystem") await requestPersistentStorage();
  return folder;
}

export async function openProjectFolder(): Promise<ProjectFolder> {
  if (typeof window === "undefined") throw new Error("O armazenamento local só está disponível no navegador.");

  if ("showDirectoryPicker" in window) {
    const picker = (window as Window & { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
    const handle = await picker();
    return initializeProject({ name: "Handball Performance OS", handle, mode: "filesystem" });
  }

  if (typeof navigator !== "undefined" && typeof navigator.storage?.getDirectory === "function") {
    const handle: LocalProjectHandle = { kind: "opfs", name: "Handball Performance OS" };
    return initializeProject({ name: handle.name, handle, mode: "opfs" });
  }

  if ("indexedDB" in window) {
    const handle: LocalProjectHandle = { kind: "indexeddb", name: "Handball Performance OS — Local" };
    return initializeProject({ name: handle.name, handle, mode: "indexeddb" });
  }

  throw new Error("Este navegador não disponibiliza armazenamento local compatível.");
}

export async function writeProjectFile(folder: ProjectFolderHandle, relativeFolder: ProjectFolderName, filename: string, content: string): Promise<void> {
  if (isOpfsProject(folder)) return opfsWrite(folder, relativeFolder, filename, content);
  if (isLocalProject(folder)) return localWrite(folder, relativeFolder, filename, content);
  const directory = await folder.getDirectoryHandle(relativeFolder, { create: true });
  const file = await directory.getFileHandle(filename, { create: true });
  const writable = await file.createWritable();
  try {
    await writable.write(content);
  } finally {
    await writable.close();
  }
}

export async function readProjectFile(folder: ProjectFolderHandle, relativeFolder: ProjectFolderName, filename: string): Promise<string> {
  if (isOpfsProject(folder)) return opfsRead(folder, relativeFolder, filename);
  if (isLocalProject(folder)) return localRead(folder, relativeFolder, filename);
  const directory = await folder.getDirectoryHandle(relativeFolder);
  const file = await directory.getFileHandle(filename);
  return (await file.getFile()).text();
}

export async function listProjectFiles(folder: ProjectFolderHandle, relativeFolder: ProjectFolderName): Promise<string[]> {
  if (isOpfsProject(folder)) return (await opfsList(folder, relativeFolder)).filter((name) => name !== ".folder");
  if (isLocalProject(folder)) return (await localList(folder, relativeFolder)).filter((name) => name !== ".folder");
  const directory = await folder.getDirectoryHandle(relativeFolder);
  const files: string[] = [];
  for await (const [name, entry] of directory.entries()) if (entry.kind === "file") files.push(name);
  return files.sort();
}
