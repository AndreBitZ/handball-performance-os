import { db } from '../storage/db'
import type { MatchEvent, MatchSquad, Player } from '../storage/types'

export const LIVE_PACKAGE_SCHEMA = '1.0.1'

export interface LivePackage {
  schemaVersion: typeof LIVE_PACKAGE_SCHEMA
  source: 'handball-performance-os'
  match: {
    id: string; seasonId: string | null; competitionId: string | null; date: string | null; venue: string | null
    homeAway: 'HOME' | 'AWAY' | 'NEUTRAL'; durationMinutes: 30; currentPeriod: 1 | 2; gameTime: number
    homeTeamId: string; awayTeamId: string; homeTeamName: string; awayTeamName: string; homeScore: number; awayScore: number
  }
  teams: { home: { id: string; name: string }; away: { id: string; name: string } }
  players: Array<{ id:string; name:string; displayName:string; shirtNumber?:number; position?:string; teamId:string }>
  roster: Array<{ id:string; playerId:string; teamId:string; shirtNumber?:number; position?:string; starter:boolean; captain:boolean; available:boolean }>
  events: Array<{ id:string; matchId:string; period?:1|2; gameTime:number; teamId?:string; playerId?:string; type:string; metadata?:Record<string,unknown> }>
  metadata: { exportedAt:string; sourceVersion:string }
}

function eventType(event: MatchEvent) {
  const type = event.type.toLowerCase()
  return ['shot','goal','miss','saved','blocked'].includes(type) ? 'shot' : type
}

function shotMetadata(event: MatchEvent) {
  if (!['shot','goal','miss','saved','blocked'].includes(event.type.toLowerCase())) return undefined
  return { shot: { shooterId:event.playerId ?? null, zone:event.zone ?? null, distance:event.distance ?? null, type:event.shotType ?? null, outcome:event.result ?? null, attackPhase:event.attackPhase ?? null } }
}

export async function buildLivePackage(matchId: string): Promise<LivePackage> {
  if (!db) throw new Error('Base de dados local indisponível.')
  const match = await db.matches.get(matchId)
  if (!match) throw new Error('Jogo não encontrado.')
  const [homeTeam, awayTeam, players, roster, events] = await Promise.all([
    db.teams.get(match.teamId), match.opponentTeamId ? db.teams.get(match.opponentTeamId) : undefined,
    db.players.toArray(), db.matchSquads.where('matchId').equals(matchId).toArray(), db.events.where('matchId').equals(matchId).sortBy('timestampSeconds')
  ])
  if (!homeTeam) throw new Error('Equipa do jogo não encontrada.')
  const awayTeamId = match.opponentTeamId ?? `opponent:${match.id}`
  const awayTeamName = awayTeam?.name ?? match.opponentName
  const rosterPlayers = new Set(roster.map(r=>r.playerId))
  const selectedPlayers = players.filter(p=>rosterPlayers.has(p.id))
  return {
    schemaVersion:LIVE_PACKAGE_SCHEMA, source:'handball-performance-os',
    match:{ id:match.id, seasonId:match.seasonId, competitionId:match.competitionId??null, date:match.date??null, venue:match.venue??null, homeAway:match.homeAway, durationMinutes:30, currentPeriod:events.some(e=>e.period===2)?2:1, gameTime:Math.max(...events.map(e=>e.timestampSeconds),0), homeTeamId:homeTeam.id, awayTeamId, homeTeamName:homeTeam.name, awayTeamName, homeScore:match.goalsFor??0, awayScore:match.goalsAgainst??0 },
    teams:{home:{id:homeTeam.id,name:homeTeam.name},away:{id:awayTeamId,name:awayTeamName}},
    players:selectedPlayers.map((p:Player)=>({id:p.id,name:p.displayName,displayName:p.displayName,shirtNumber:p.shirtNumber,position:p.position,teamId:homeTeam.id})),
    roster:roster.map((r:MatchSquad)=>({id:r.id,playerId:r.playerId,teamId:r.teamId??homeTeam.id,shirtNumber:r.shirtNumber,position:r.position,starter:r.starter,captain:r.captain,available:true})),
    events:events.map((e:MatchEvent)=>({id:e.id,matchId:e.matchId,period:e.period,gameTime:e.timestampSeconds,teamId:e.teamId,playerId:e.playerId,type:eventType(e),metadata:{...shotMetadata(e),notes:e.notes??null,tags:e.tags??[]}})),
    metadata:{exportedAt:new Date().toISOString(),sourceVersion:'performance-os-1.0.1'}
  }
}

export async function exportLivePackage(matchId:string){
  const payload=await buildLivePackage(matchId)
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download=`live-package-${matchId}.json`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000)
}
