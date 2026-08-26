import type { LocalProjectHandle, ProjectFolderHandle } from './local-project'

const DB_NAME = "handball-performance-project";
const STORE_NAME = "settings";
const KEY = "project-folder";

type DirectoryPermissionHandle = FileSystemDirectoryHandle & {
  queryPermission: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
};

function openSessionDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento local."));
  });
}

export async function saveProjectFolderHandle(handle: ProjectFolderHandle): Promise<void> {
  const database = await openSessionDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(handle, KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível guardar a sessão local."));
  });
  database.close();
}

export async function loadProjectFolderHandle(): Promise<ProjectFolderHandle | null> {
  const database = await openSessionDb();
  const handle = await new Promise<ProjectFolderHandle | null>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(KEY);
    request.onsuccess = () => resolve((request.result as ProjectFolderHandle | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível recuperar o armazenamento local."));
  });
  database.close();
  return handle;
}

export async function requestProjectFolderPermission(handle: ProjectFolderHandle): Promise<boolean> {
  if (typeof handle === "object" && "kind" in handle && handle.kind === "indexeddb") return true;
  const permissionHandle = handle as DirectoryPermissionHandle;
  const permission = await permissionHandle.queryPermission({ mode: "readwrite" });
  if (permission === "granted") return true;
  const requested = await permissionHandle.requestPermission({ mode: "readwrite" });
  return requested === "granted";
}
