export type UUID = string;
export type Position = 'GR' | 'PE' | 'LE' | 'CE' | 'LD' | 'PD' | 'PIV';
export interface Club { id: UUID; name: string; shortName?: string; country?: string; createdAt: string; updatedAt: string; }
export interface Team { id: UUID; clubId: UUID; name: string; category: string; gender: 'F' | 'M' | 'MIXED'; active: boolean; createdAt: string; updatedAt: string; }
export interface Season { id: UUID; name: string; startDate?: string; endDate?: string; active: boolean; }
export interface Player { id: UUID; firstName: string; lastName: string; displayName: string; birthDate?: string; shirtNumber?: number; position?: Position; hand?: 'LEFT' | 'RIGHT' | 'BOTH'; photoPath?: string; active: boolean; createdAt: string; updatedAt: string; }
export interface PlayerTeamSeason { id: UUID; playerId: UUID; teamId: UUID; seasonId: UUID; shirtNumber?: number; position?: Position; startDate?: string; endDate?: string; }
export interface Competition { id: UUID; name: string; seasonId: UUID; category?: string; }
export interface Match { id: UUID; seasonId: UUID; competitionId?: UUID; teamId: UUID; opponentTeamId?: UUID; opponentName: string; date: string; venue?: string; homeAway: 'HOME' | 'AWAY' | 'NEUTRAL'; goalsFor?: number; goalsAgainst?: number; status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'; sourceVideoPath?: string; videoDurationSeconds?: number; createdAt: string; updatedAt: string; }
export interface MatchSquad { id: UUID; matchId: UUID; playerId: UUID; teamId?: UUID; starter: boolean; captain: boolean; shirtNumber?: number; position?: Position; }
export interface MatchPlayerInterval { id: UUID; matchId: UUID; playerId: UUID; period: 1 | 2; startSeconds: number; endSeconds?: number; createdAt: string; updatedAt: string; }
export interface MatchClockState { id: UUID; matchId: UUID; period: 1 | 2; elapsedSeconds: number; running: boolean; lastStartedAt?: string; updatedAt: string; }
export interface MatchBackupSnapshot { id: UUID; matchId: UUID; createdAt: string; schemaVersion: number; data: string; }
export interface MatchEvent { id: UUID; matchId: UUID; timestampSeconds: number; period?: 1 | 2; durationSeconds?: number; type: string; teamId?: UUID; playerId?: UUID; position?: Position; zone?: string; distance?: string; shotType?: string; result?: string; attackPhase?: string; xg?: number; notes?: string; tags?: string[]; createdAt: string; }
export interface Clip { id: UUID; matchId: UUID; eventId?: UUID; startSeconds: number; endSeconds: number; title?: string; notes?: string; generatedPath?: string; favorite: boolean; createdAt: string; }
export interface Playlist { id: UUID; name: string; description?: string; clipIds: UUID[]; createdAt: string; updatedAt: string; }