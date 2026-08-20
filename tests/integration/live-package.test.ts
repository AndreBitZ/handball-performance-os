import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { HandballPerformanceDB } from '../../src/lib/storage/db'
import { buildLivePackage, LIVE_PACKAGE_SCHEMA } from '../../src/lib/match/live-package'

const now = new Date().toISOString()

describe('Performance OS → Andebol-Stats live package', () => {
  it('exports the setup package expected by the Andebol-Stats importer', async () => {
    const database = new HandballPerformanceDB()
    await database.clubs.add({ id:'c1', name:'Clube', createdAt:now, updatedAt:now })
    await database.teams.bulkAdd([
      { id:'t1', clubId:'c1', name:'Casa', category:'Sénior', gender:'F', active:true, createdAt:now, updatedAt:now },
      { id:'t2', clubId:'c1', name:'Fora', category:'Sénior', gender:'F', active:true, createdAt:now, updatedAt:now },
    ])
    await database.seasons.add({ id:'s1', name:'2026/27', active:true })
    await database.matches.add({ id:'m1', seasonId:'s1', teamId:'t1', opponentTeamId:'t2', opponentName:'Fora', date:now, venue:'Pavilhão', homeAway:'HOME', goalsFor:12, goalsAgainst:10, status:'IN_PROGRESS', createdAt:now, updatedAt:now })
    await database.players.add({ id:'p1', firstName:'Ana', lastName:'Teste', displayName:'Ana Teste', shirtNumber:7, position:'CE', active:true, createdAt:now, updatedAt:now })
    await database.matchSquads.add({ id:'sq1', matchId:'m1', playerId:'p1', teamId:'t1', starter:true, captain:true, shirtNumber:7, position:'CE' })

    const pkg = await buildLivePackage('m1')
    expect(pkg.schemaVersion).toBe(LIVE_PACKAGE_SCHEMA)
    expect(pkg.schemaVersion).toBe('1.0.1')
    expect(pkg.match.id).toBe('m1')
    expect(pkg.teams.home.id).toBe('t1')
    expect(pkg.teams.away.id).toBe('t2')
    expect(pkg.players[0]).toMatchObject({ id:'p1', shirtNumber:7, position:'CE' })
    expect(pkg.roster[0]).toMatchObject({ playerId:'p1', starter:true })
    expect(pkg.events).toEqual([])
    await database.delete()
  })
})
