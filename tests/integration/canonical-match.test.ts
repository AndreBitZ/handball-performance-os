import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { HandballPerformanceDB } from '../../src/lib/storage/db'
import { exportMatchPackage, MATCH_CONTRACT_VERSION } from '../../src/lib/integration/matchContract'
import { importAndebolStatsResult } from '../../src/lib/integration/importMatchPackage'

const now = new Date().toISOString()

async function seedDatabase(database: HandballPerformanceDB, homeAway: 'HOME' | 'AWAY' = 'HOME') {
  await database.clubs.add({ id:'c1', name:'Clube', createdAt:now, updatedAt:now })
  await database.teams.bulkAdd([
    { id:'t1', clubId:'c1', name:'Casa', category:'Sénior', gender:'F', active:true, createdAt:now, updatedAt:now },
    { id:'t2', clubId:'c1', name:'Fora', category:'Sénior', gender:'F', active:true, createdAt:now, updatedAt:now },
  ])
  await database.seasons.add({ id:'s1', name:'2026/27', active:true })
  await database.matches.add({ id:'m1', seasonId:'s1', teamId:'t1', opponentTeamId:'t2', opponentName:'Fora', date:now, venue:'Pavilhão', homeAway, goalsFor:12, goalsAgainst:10, status:'IN_PROGRESS', createdAt:now, updatedAt:now })
  await database.players.add({ id:'p1', firstName:'Ana', lastName:'Teste', displayName:'Ana Teste', shirtNumber:7, position:'CE', active:true, createdAt:now, updatedAt:now })
  await database.matchSquads.add({ id:'sq1', matchId:'m1', playerId:'p1', teamId:'t1', starter:true, captain:true, shirtNumber:7, position:'CE' })
}

describe('Performance OS ↔ Andebol-Stats canonical match contract', () => {
  it('exports the canonical v1.1.0 setup package', async () => {
    const database = new HandballPerformanceDB()
    await seedDatabase(database)

    const pkg = await exportMatchPackage(database, 'm1')
    expect(pkg.schemaVersion).toBe(MATCH_CONTRACT_VERSION)
    expect(pkg.schemaVersion).toBe('1.1.0')
    expect(pkg.source).toBe('handball-performance-os')
    expect(pkg.match.homeTeamId).toBe('t1')
    expect(pkg.match.awayTeamId).toBe('t2')
    expect(pkg.players[0]).toMatchObject({ id:'p1', shirtNumber:7, position:'CE', teamId:'t1' })
    expect(pkg.roster[0]).toMatchObject({ id:'sq1', playerId:'p1', starter:true })
    expect(pkg.events).toEqual([])

    await database.delete()
  })

  it('maps an away match score back to goalsFor/goalsAgainst correctly', async () => {
    const database = new HandballPerformanceDB()
    await seedDatabase(database, 'AWAY')

    const payload = await exportMatchPackage(database, 'm1')
    const result = { ...payload, match: { ...payload.match, homeScore: 28, awayScore: 31, status:'finished' as const }, events: [{ id:'e1', matchId:'m1', period:1 as const, gameTime:120, teamId:'t1', playerId:'p1', type:'shot', metadata:{ shot:{ shooterId:'p1', position:'CE', zone:'Z4', distance:'7m', type:'jump', outcome:'goal', xg:0.62 } } }] }

    await importAndebolStatsResult(database, result)
    const match = await database.matches.get('m1')
    const event = await database.events.get('e1')

    expect(match).toMatchObject({ goalsFor:31, goalsAgainst:28, status:'COMPLETED' })
    expect(event).toMatchObject({ matchId:'m1', period:1, timestampSeconds:120, type:'shot', playerId:'p1', zone:'Z4', distance:'7m', shotType:'jump', result:'goal', xg:0.62 })

    await database.delete()
  })
})
