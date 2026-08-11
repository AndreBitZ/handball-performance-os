'use client'

import { useEffect, useMemo, useState } from 'react'
import { db } from '../../src/lib/storage/db'
import type { Match, MatchEvent, MatchSquad, Player, PlayerTeamSeason } from '../../src/lib/storage/types'
import SeasonPlayerStats from './player-stats'
import PlayerUsage from './player-usage'

export default function PlayerStatsView({ seasonId, teamId }: { seasonId: string; teamId: string }) {
  const [data, setData] = useState<{ players: Player[]; relations: PlayerTeamSeason[]; matches: Match[]; squads: MatchSquad[]; events: MatchEvent[] } | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  useEffect(() => { if (!db) return; const database = db; void Promise.all([database.players.toArray(), database.playerTeamSeasons.toArray(), database.matches.toArray(), database.matchSquads.toArray(), database.events.toArray()]).then(([players, relations, matches, squads, events]) => setData({ players, relations, matches, squads, events })) }, [])
  const eligiblePlayers = useMemo(() => data ? data.players.filter(p => p.active && data.relations.some(r => r.playerId === p.id && r.teamId === teamId && r.seasonId === seasonId)).sort((a, b) => a.displayName.localeCompare(b.displayName)) : [], [data, teamId, seasonId])
  useEffect(() => { if (eligiblePlayers.length && !eligiblePlayers.some(p => p.id === selectedPlayerId)) setSelectedPlayerId(eligiblePlayers[0].id) }, [eligiblePlayers, selectedPlayerId])
  if (!data) return <section className="section"><p>A carregar estatísticas…</p></section>
  const selectedPlayer = eligiblePlayers.find(p => p.id === selectedPlayerId)
  const teamMatches = data.matches.filter(m => m.teamId === teamId && m.seasonId === seasonId)
  return <><SeasonPlayerStats seasonId={seasonId} teamId={teamId} {...data} />{selectedPlayer && <section className="section"><div className="sectionHeader"><div><p className="eyebrow">UTILIZAÇÃO</p><h2>Utilização por jogo</h2><p>Minutos e produção individual em cada jogo da época.</p></div><select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)} aria-label="Jogador da análise de utilização">{eligiblePlayers.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}</select></div><PlayerUsage player={selectedPlayer} matches={teamMatches} squads={data.squads} events={data.events} /></section>}</>
}
