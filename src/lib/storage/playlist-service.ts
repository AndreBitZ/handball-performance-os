import { db } from './db'
import { createId } from './id'
import type { Playlist } from './types'

export async function createPlaylist(name: string, description = '') {
  if (!db) throw new Error('Local database is only available in the browser.')
  const now = new Date().toISOString()
  const playlist: Playlist = { id: createId(), name: name.trim(), description: description.trim() || undefined, clipIds: [], createdAt: now, updatedAt: now }
  await db.playlists.add(playlist)
  return playlist
}

export async function addClipToPlaylist(playlistId: string, clipId: string) {
  if (!db) throw new Error('Local database is only available in the browser.')
  const playlist = await db.playlists.get(playlistId)
  if (!playlist) throw new Error('Playlist não encontrada.')
  if (!playlist.clipIds.includes(clipId)) playlist.clipIds.push(clipId)
  playlist.updatedAt = new Date().toISOString()
  await db.playlists.put(playlist)
  return playlist
}

export async function removeClipFromPlaylist(playlistId: string, clipId: string) {
  if (!db) throw new Error('Local database is only available no browser.')
  const playlist = await db.playlists.get(playlistId)
  if (!playlist) throw new Error('Playlist não encontrada.')
  playlist.clipIds = playlist.clipIds.filter(id => id !== clipId)
  playlist.updatedAt = new Date().toISOString()
  await db.playlists.put(playlist)
  return playlist
}
