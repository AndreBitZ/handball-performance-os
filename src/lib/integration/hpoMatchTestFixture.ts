import type { HpoMatchFile } from './hpoMatchContract';

export const HPO_MATCH_TEST_FIXTURE: HpoMatchFile = {
  format: 'HPO-MATCH',
  version: '1.0',
  direction: 'PERFORMANCE_OS_TO_ANDEBOL_STATS',
  exportedAt: '2026-08-24T18:00:00.000Z',
  match: {
    id: 'TEST-MATCH-001', seasonId: 'TEST-SEASON', competitionId: 'TEST-COMPETITION',
    date: '2026-08-24', venue: 'Test Arena', homeTeamId: 'TEAM-HOME', awayTeamId: 'TEAM-AWAY',
    homeTeamName: 'Test Home', awayTeamName: 'Test Away', ownTeamId: 'TEAM-HOME', ownTeamName: 'Test Home',
    homeAway: 'HOME', status: 'finished', durationMinutes: 60, currentPeriod: 2, gameTime: 17 * 60 + 32,
    homeScore: 21, awayScore: 19
  },
  players: [{ id: 'P1', name: 'Player One', shirtNumber: 7, position: 'LEFT_BACK', teamId: 'TEAM-HOME', active: true }],
  roster: [{ id: 'R1', playerId: 'P1', teamId: 'TEAM-HOME', shirtNumber: 7, position: 'LEFT_BACK', starter: true, available: true }],
  events: [{ id: 'E1', matchId: 'TEST-MATCH-001', period: 2, gameTime: 17 * 60 + 32, timestampKnown: true, videoTimestampSeconds: 60 * 60 + 44, videoValidated: true, teamId: 'TEAM-HOME', playerId: 'P1', type: 'goal', metadata: { source: 'andebol-stats' } }],
  statistics: { preMatch: { team: { matches: 10, wins: 7 }, player: { goalsPerMatch: 4.2 } } },
  timeline: [{ period: 1, type: 'start', gameTime: 0, videoTime: 43 }, { period: 2, type: 'start', gameTime: 0, videoTime: 44 * 60 + 2 }],
  video: {
    anchors: {
      firstHalfStart: { period: 1, gameTime: 0, videoTime: 43 },
      firstHalfEnd: { period: 1, gameTime: 1800, videoTime: 2597 },
      secondHalfStart: { period: 2, gameTime: 0, videoTime: 2642 },
      secondHalfEnd: { period: 2, gameTime: 1800, videoTime: 5231 }
    },
    clips: [{ eventId: 'E1', startSeconds: 3699, endSeconds: 3712, title: 'Goal E1' }]
  },
  metadata: { source: 'handball-performance-os', sourceVersion: '1.0', dataSources: ['live_stats', 'video'] }
};
