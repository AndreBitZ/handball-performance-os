import Dexie, { type Table } from 'dexie';

export type Entity = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type Club = Entity & { name: string; shortName?: string; logoUrl?: string };
export type Team = Entity & { clubId: string; name: string; category?: string; gender?: string };
export type Season = Entity & { name: string; startDate?: string; endDate?: string };
export type Player = Entity & { firstName: string; lastName: string; displayName: string; position?: string; hand?: string; shirtNumber?: number; photoUrl?: string };
export type PlayerTeamSeason = Entity & { playerId: string; teamId: string; seasonId: string; status?: string };
export type Match = Entity & { seasonId: string; teamId: string; opponent: string; competition?: string; date: string; homeAway?: 'home' | 'away'; goalsFor?: number; goalsAgainst?: number };
export type Video = Entity & { matchId: string; name: string; mimeType: string; size: number; duration?: number; blob: Blob };
export type Event = Entity & { matchId: string; videoId?: string; timestamp: number; type: string; playerId?: string; notes?: string };
export type Clip = Entity & { matchId: string; eventId?: string; videoId?: string; start: number; end: number; title: string; notes?: string };
export type Playlist = Entity & { name: string; description?: string; clipIds: string[] };

export class LocalDatabase extends Dexie {
  clubs!: Table<Club, string>;
  teams!: Table<Team, string>;
  seasons!: Table<Season, string>;
  players!: Table<Player, string>;
  playerTeamSeasons!: Table<PlayerTeamSeason, string>;
  matches!: Table<Match, string>;
  videos!: Table<Video, string>;
  events!: Table<Event, string>;
  clips!: Table<Clip, string>;
  playlists!: Table<Playlist, string>;

  constructor() {
    super('handball-performance-os');
    this.version(1).stores({
      clubs: 'id, name',
      teams: 'id, clubId, name',
      seasons: 'id, name',
      players: 'id, displayName, lastName',
      playerTeamSeasons: 'id, playerId, teamId, seasonId, [teamId+seasonId]',
      matches: 'id, seasonId, teamId, date',
      videos: 'id, matchId, name',
      events: 'id, matchId, videoId, timestamp, type, playerId',
      clips: 'id, matchId, eventId, start, end',
      playlists: 'id, name'
    });
  }
}

export const db = new LocalDatabase();

export function makeId(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function now() {
  return new Date().toISOString();
}
