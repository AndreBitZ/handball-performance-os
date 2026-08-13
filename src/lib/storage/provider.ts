import type { EntityTable } from 'dexie'
import { db } from './db'
import type { Club, Competition, Match, MatchEvent, MatchSquad, Player, PlayerTeamSeason, Playlist, Season, Team, Clip } from './types'

export interface ProjectDatabase {
  clubs: EntityTable<Club, 'id'>
  teams: EntityTable<Team, 'id'>
  seasons: EntityTable<Season, 'id'>
  players: EntityTable<Player, 'id'>
  playerTeamSeasons: EntityTable<PlayerTeamSeason, 'id'>
  competitions: EntityTable<Competition, 'id'>
  matches: EntityTable<Match, 'id'>
  matchSquads: EntityTable<MatchSquad, 'id'>
  events: EntityTable<MatchEvent, 'id'>
  clips: EntityTable<Clip, 'id'>
  playlists: EntityTable<Playlist, 'id'>
}

export interface FileStorage {
  readonly kind: 'browser' | 'local-project'
  put(path: string, file: Blob): Promise<void>
  get(path: string): Promise<Blob | null>
  remove(path: string): Promise<void>
}

export interface StorageProvider {
  readonly database: ProjectDatabase
  readonly files: FileStorage
}

class BrowserFileStorage implements FileStorage {
  readonly kind = 'browser' as const
  private readonly prefix = 'hp-os:file:'

  async put(path: string, file: Blob) {
    const buffer = await file.arrayBuffer()
    const bytes = Array.from(new Uint8Array(buffer))
    localStorage.setItem(this.prefix + path, JSON.stringify({ type: file.type, bytes }))
  }

  async get(path: string) {
    const value = localStorage.getItem(this.prefix + path)
    if (!value) return null
    const parsed = JSON.parse(value) as { type?: string; bytes: number[] }
    return new Blob([new Uint8Array(parsed.bytes)], { type: parsed.type ?? 'application/octet-stream' })
  }

  async remove(path: string) {
    localStorage.removeItem(this.prefix + path)
  }
}

export function createBrowserStorageProvider(): StorageProvider {
  if (!db) throw new Error('Browser storage is only available in the client.')

  return {
    database: db,
    files: new BrowserFileStorage(),
  }
}

export type StorageMode = 'browser' | 'local-project'

export function getDefaultStorageMode(): StorageMode {
  return 'browser'
}
