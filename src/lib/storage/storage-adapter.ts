import {
  compareDatabaseRestore,
  previewDatabaseRestore,
  restoreDatabaseMerge,
  rollbackDatabaseRestore,
  saveDatabaseSnapshot,
  verifyDatabaseSnapshot,
  type DatabaseRestoreDiff,
  type DatabaseRestoreResult,
  type DatabaseRollbackResult,
} from './project-snapshot'

/**
 * Stable storage boundary for the application.
 *
 * Pages should depend on this contract rather than directly depending on
 * Dexie/IndexedDB. The current implementation delegates to the existing
 * browser-backed storage; a filesystem implementation can replace it later
 * without changing the domain/UI code.
 */
export interface StorageAdapter {
  saveDatabaseSnapshot(folder: FileSystemDirectoryHandle): Promise<string>
  verifyDatabaseSnapshot(folder: FileSystemDirectoryHandle): ReturnType<typeof verifyDatabaseSnapshot>
  previewDatabaseRestore(folder: FileSystemDirectoryHandle): ReturnType<typeof previewDatabaseRestore>
  compareDatabaseRestore(folder: FileSystemDirectoryHandle): Promise<DatabaseRestoreDiff>
  restoreDatabaseMerge(folder: FileSystemDirectoryHandle): Promise<DatabaseRestoreResult>
  rollbackDatabaseRestore(folder: FileSystemDirectoryHandle, safetyBackup: string): Promise<DatabaseRollbackResult>
}

/** Current adapter. Intentionally thin: this step introduces the seam only. */
export const dexieStorageAdapter: StorageAdapter = {
  saveDatabaseSnapshot,
  verifyDatabaseSnapshot,
  previewDatabaseRestore,
  compareDatabaseRestore,
  restoreDatabaseMerge,
  rollbackDatabaseRestore,
}
