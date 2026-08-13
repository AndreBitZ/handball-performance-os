import Dexie, { type EntityTable } from 'dexie';
import type { Club, Competition, Match, MatchEvent, Player, PlayerTeamSeason, Playlist, Season, Team, Clip, MatchSquad } from './types';

export class HandballPerformanceDB extends Dexie {
  clubs!: EntityTable<Club, 'id'>; teams!: EntityTable<Team, 'id'>; seasons!: EntityTable<Season, 'id'>; players!: EntityTable<Player, 'id'>; playerTeamSeasons!: EntityTable<PlayerTeamSeason, 'id'>; competitions!: EntityTable<Competition, 'id'>; matches!: EntityTable<Match, 'id'>; matchSquads!: EntityTable<MatchSquad, 'id'>; events!: EntityTable<MatchEvent, 'id'>; clips!: EntityTable<Clip, 'id'>; playlists!: EntityTable<Playlist, 'id'>;
  constructor() {
    super('handball-performance-os');
    this.version(1).stores({ clubs: 'id, name', teams: 'id, clubId, name, category, gender, active', seasons: 'id, name, active', players: 'id, displayName, lastName, position, active', playerTeamSeasons: 'id, playerId, teamId, seasonId, [teamId+seasonId]', competitions: 'id, seasonId, name', matches: 'id, seasonId, teamId, competitionId, date, status', events: 'id, matchId, timestampSeconds, type, playerId, teamId', clips: 'id, matchId, eventId, startSeconds, endSeconds, favorite', playlists: 'id, name, createdAt, updatedAt' });
    this.version(2).stores({ matchSquads: 'id, matchId, playerId, [matchId+playerId], starter, captain' });
    this.version(3).stores({ matches: 'id, seasonId, teamId, opponentTeamId, competitionId, date, status', matchSquads: 'id, matchId, playerId, teamId, [matchId+playerId], [matchId+teamId], starter, captain' });
  }
}
export const db = typeof window !== 'undefined' ? new HandballPerformanceDB() : null;
