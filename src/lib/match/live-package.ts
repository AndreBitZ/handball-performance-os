import { db } from '../storage/db'
import type { Match, MatchSquad, Player, Team } from '../storage/types'

export const LIVE_PACKAGE_SCHEMA = '1.0.1'

export type LivePackage = {
  schemaVersion: typeof LIVE_PACKAGE_SCHEMA
  source: 'handball-performance-os'
  match: { id:string; seasonId:string; competitionId?:string; date:string; venue?:string; homeTeamId:string; awayTeamId:string; homeTeamName:string; awayTeamName:string; status:'planned'|'live'|'finished'; durationMinutes:number; homeScore:number; awayScore:number }
  players: Array<{ id:string; name:string; shirtNumber?:number; position?:string; teamId:string; active:boolean }>
  roster: Array<{ id:string; playerId:string; teamId:string; shirtNumber?:number; position?:string; starter:boolean; available:boolean }>
  events: []
}

function matchStatus(status: Match['status']): 'planned'|'live'|'finished' {
  if(status==='IN_PROGRESS') return 'live'
  if(status==='COMPLETED') return 'finished'
  return 'planned'
}
function displayTeamName(team: Team|undefined,fallback:string){return team?.name?.trim()||fallback}

export async function buildLivePackage(matchId:string):Promise<LivePackage>{
  const database=db
  if(!database) throw new Error('A base de dados local só está disponível no browser.')
  const match=await database.matches.get(matchId)
  if(!match) throw new Error('Jogo não encontrado.')
  const [homeTeam,awayTeam,squads]=await Promise.all([
    database.teams.get(match.homeAway==='AWAY'?match.opponentTeamId??'':match.teamId),
    database.teams.get(match.homeAway==='AWAY'?match.teamId:match.opponentTeamId??''),
    database.matchSquads.where('matchId').equals(matchId).toArray(),
  ])
  const playerIds=[...new Set(squads.map(row=>row.playerId))]
  const players=(await Promise.all(playerIds.map(id=>database.players.get(id)))).filter(Boolean) as Player[]
  const homeTeamId=match.homeAway==='AWAY'?match.opponentTeamId!:match.teamId
  const awayTeamId=match.homeAway==='AWAY'?match.teamId:match.opponentTeamId!
  const homeScore=match.homeAway==='AWAY'?match.goalsAgainst??0:match.goalsFor??0
  const awayScore=match.homeAway==='AWAY'?match.goalsFor??0:match.goalsAgainst??0
  return {
    schemaVersion:LIVE_PACKAGE_SCHEMA, source:'handball-performance-os',
    match:{id:match.id,seasonId:match.seasonId,competitionId:match.competitionId,date:match.date,venue:match.venue,homeTeamId,awayTeamId,homeTeamName:displayTeamName(homeTeam,match.homeAway==='AWAY'?match.opponentName:'Casa'),awayTeamName:displayTeamName(awayTeam,match.homeAway==='AWAY'?'Fora':match.opponentName),status:matchStatus(match.status),durationMinutes:30,homeScore,awayScore},
    players:players.map(player=>{const squad=squads.find(row=>row.playerId===player.id);return{id:player.id,name:player.displayName,shirtNumber:squad?.shirtNumber??player.shirtNumber,position:squad?.position??player.position,teamId:squad?.teamId??match.teamId,active:player.active}}),
    roster:squads.map((row:MatchSquad)=>({id:row.id,playerId:row.playerId,teamId:row.teamId??match.teamId,shirtNumber:row.shirtNumber,position:row.position,starter:row.starter,available:true})),
    events:[],
  }
}

export async function downloadLivePackage(matchId:string){
  const payload=await buildLivePackage(matchId)
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=`live-package-${payload.match.id}.json`;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return payload
}
