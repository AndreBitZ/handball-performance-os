const DB_NAME = "handball-performance-project";
const STORE_NAME = "settings";
const KEY = "project-folder";

function openSessionDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento local."));
  });
}

export async function saveProjectFolderHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openSessionDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(handle, KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Não foi possível guardar a pasta do projeto."));
  });
  db.close();
}

export async function loadProjectFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openSessionDb();
  const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(KEY);
    request.onsuccess = () => resolve((request.result as FileSystemDirectoryHandle | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível recuperar a pasta do projeto."));
  });
  db.close();
  return handle;
}

export async function requestProjectFolderPermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const permission = await handle.queryPermission({ mode: "readwrite" });
  if (permission === "granted") return true;
  const requested = await handle.requestPermission({ mode: "readwrite" });
  return requested === "granted";
}
