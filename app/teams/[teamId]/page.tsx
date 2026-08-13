'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { db } from '../../../src/lib/storage/db'
import type { Player, PlayerTeamSeason, Season, Team } from '../../../src/lib/storage/types'
import '../../dashboard.css'

export default function TeamDetailPage() {
  const params = useParams<{ teamId: string }>()
  const teamId = params.teamId
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [links, setLinks] = useState<PlayerTeamSeason[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])

  useEffect(() => {
    if (!db || !teamId) return
    void Promise.all([
      db.teams.get(teamId),
      db.playerTeamSeasons.where('teamId').equals(teamId).toArray(),
      db.players.toArray(),
      db.seasons.toArray(),
    ]).then(([found, teamLinks, allPlayers, allSeasons]) => {
      setTeam(found ?? null)
      setLinks(teamLinks)
      setPlayers(allPlayers)
      setSeasons(allSeasons)
    })
  }, [teamId])

  if (!team) return <main className="content standalonePage"><header className="topbar"><div><p className="eyebrow">EQUIPA</p><h1>Equipa</h1></div></header><section className="section"><p>Equipa não encontrada.</p><Link href="/teams">← Voltar às equipas</Link></section></main>

  const playerIds = new Set(links.map(link => link.playerId))
  const squad = players.filter(player => playerIds.has(player.id)).sort((a, b) => a.displayName.localeCompare(b.displayName))

  return <main className="content standalonePage"><header className="topbar"><div><p className="eyebrow">EQUIPA</p><h1>{team.name}</h1><p>{team.category} · {team.gender === 'F' ? 'Feminino' : team.gender === 'M' ? 'Masculino' : 'Misto'}</p></div></header><section className="section"><div className="localList">{squad.length === 0 && <div className="emptyState"><strong>Plantel vazio</strong><span>Associe jogadores a esta equipa através de uma época.</span></div>}{squad.map(player => { const playerLink = links.find(link => link.playerId === player.id); const season = playerLink ? seasons.find(s => s.id === playerLink.seasonId) : undefined; return <Link className="localRow" key={player.id} href={`/players/${player.id}`}><div><strong>{player.shirtNumber ? `#${player.shirtNumber} ` : ''}{player.displayName}</strong><span>{playerLink?.position ?? player.position ?? 'Sem posição'}{season ? ` · ${season.name}` : ''}</span></div></Link> })}</div></section><Link href="/teams">← Voltar às equipas</Link></main>
}
