'use client'

import { useEffect, useState } from 'react'
import { db } from '../../src/lib/storage/db'
import type { Match, MatchEvent, MatchSquad, Player, PlayerTeamSeason } from '../../src/lib/storage/types'
import SeasonPlayerStats from './player-stats'

export default function PlayerStatsView({ seasonId, teamId }: { seasonId: string; teamId: string }) {
  const [data, setData] = useState<{ players: Player[]; relations: PlayerTeamSeason[]; matches: Match[]; squads: MatchSquad[]; events: MatchEvent[] } | null>(null)
  useEffect(() => { if (!db) return; const database = db; void Promise.all([database.players.toArray(), database.playerTeamSeasons.toArray(), database.matches.toArray(), database.matchSquads.toArray(), database.events.toArray()]).then(([players, relations, matches, squads, events]) => setData({ players, relations, matches, squads, events })) }, [])
  if (!data) return <section className="section"><p>A carregar estatísticas…</p></section>
  return <SeasonPlayerStats seasonId={seasonId} teamId={teamId} {...data} />
}
