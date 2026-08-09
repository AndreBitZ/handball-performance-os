import { db } from './db'

export async function getMatchEventStats(matchId: string) {
  if (!db) return { total: 0, goals: 0, shots: 0, turnovers: 0, recoveries: 0, saves: 0, sevenMeters: 0, suspensions: 0 }
  const events = await db.events.where('matchId').equals(matchId).toArray()
  return {
    total: events.length,
    goals: events.filter(e => e.type === 'goal').length,
    shots: events.filter(e => e.type === 'shot').length,
    turnovers: events.filter(e => e.type === 'turnover').length,
    recoveries: events.filter(e => e.type === 'recovery').length,
    saves: events.filter(e => e.type === 'save').length,
    sevenMeters: events.filter(e => e.type === 'seven-meter').length,
    suspensions: events.filter(e => e.type === 'two-minutes').length,
  }
}
