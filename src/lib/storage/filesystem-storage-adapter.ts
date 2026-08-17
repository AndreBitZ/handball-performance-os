import type { StorageAdapter } from './storage-adapter'
import type {
  DatabaseRestoreDiff,
  DatabaseRestoreResult,
  DatabaseRollbackResult,
} from './project-snapshot'

/**
 * Filesystem-backed storage seam.
 *
 * The browser File System Access API only exposes the selected directory to
 * the application after the user explicitly grants access. This adapter
 * therefore receives a directory handle and never assumes access to an
 * arbitrary path on disk.
 *
 * Database migration is intentionally not wired here yet. Keeping the
 * implementation explicit prevents silently falling back to IndexedDB while
 * presenting the UI as if files were already the source of truth.
 */
export class FileSystemStorageAdapter implements StorageAdapter {
  constructor(private readonly directory: FileSystemDirectoryHandle) {}

  private unsupported(operation: string): never {
    throw new Error(
      `Filesystem storage operation "${operation}" is not implemented yet. ` +
        'The directory handle is available, but Dexie remains the source of truth during migration.',
    )
  }

  saveDatabaseSnapshot(_folder: FileSystemDirectoryHandle): Promise<string> {
    return Promise.reject(this.unsupported('saveDatabaseSnapshot'))
  }

  verifyDatabaseSnapshot(_folder: FileSystemDirectoryHandle): ReturnType<StorageAdapter['verifyDatabaseSnapshot']> {
    return Promise.reject(this.unsupported('verifyDatabaseSnapshot')) as ReturnType<StorageAdapter['verifyDatabaseSnapshot']>
  }

  previewDatabaseRestore(_folder: FileSystemDirectoryHandle): ReturnType<StorageAdapter['previewDatabaseRestore']> {
    return Promise.reject(this.unsupported('previewDatabaseRestore')) as ReturnType<StorageAdapter['previewDatabaseRestore']>
  }

  compareDatabaseRestore(_folder: FileSystemDirectoryHandle): Promise<DatabaseRestoreDiff> {
    return Promise.reject(this.unsupported('compareDatabaseRestore'))
  }

  restoreDatabaseMerge(_folder: FileSystemDirectoryHandle): Promise<DatabaseRestoreResult> {
    return Promise.reject(this.unsupported('restoreDatabaseMerge'))
  }

  rollbackDatabaseRestore(
    _folder: FileSystemDirectoryHandle,
    _safetyBackup: string,
  ): Promise<DatabaseRollbackResult> {
    return Promise.reject(this.unsupported('rollbackDatabaseRestore'))
  }

  /** Exposes the explicitly granted directory without exposing filesystem paths. */
  getDirectoryHandle(): FileSystemDirectoryHandle {
    return this.directory
  }
}
