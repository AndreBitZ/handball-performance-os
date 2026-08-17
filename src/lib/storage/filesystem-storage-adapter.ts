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
import type { StorageAdapter } from './storage-adapter'

/**
 * Filesystem-backed storage adapter.
 *
 * The selected FileSystemDirectoryHandle is the boundary for all filesystem
 * persistence. The underlying snapshot implementation uses that handle to
 * write/read real JSON files under the project's `database` directory.
 * Dexie remains the source of truth for database contents during migration.
 */
export class FileSystemStorageAdapter implements StorageAdapter {
  constructor(private readonly directory: FileSystemDirectoryHandle) {}

  getDirectoryHandle(): FileSystemDirectoryHandle {
    return this.directory
  }

  saveDatabaseSnapshot(folder = this.directory): Promise<string> {
    return saveDatabaseSnapshot(folder)
  }

  verifyDatabaseSnapshot(folder = this.directory): ReturnType<StorageAdapter['verifyDatabaseSnapshot']> {
    return verifyDatabaseSnapshot(folder)
  }

  previewDatabaseRestore(folder = this.directory): ReturnType<StorageAdapter['previewDatabaseRestore']> {
    return previewDatabaseRestore(folder)
  }

  compareDatabaseRestore(folder = this.directory): Promise<DatabaseRestoreDiff> {
    return compareDatabaseRestore(folder)
  }

  restoreDatabaseMerge(folder = this.directory): Promise<DatabaseRestoreResult> {
    return restoreDatabaseMerge(folder)
  }

  rollbackDatabaseRestore(
    folder = this.directory,
    safetyBackup: string,
  ): Promise<DatabaseRollbackResult> {
    return rollbackDatabaseRestore(folder, safetyBackup)
  }
}
