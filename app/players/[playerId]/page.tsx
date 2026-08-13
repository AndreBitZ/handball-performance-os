'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { db } from '../../../src/lib/storage/db'
import type { Player, PlayerTeamSeason, Season, Team } from '../../../src/lib/storage/types'
import '../../dashboard.css'

export default function PlayerDetailPage() {
  const params = useParams<{ playerId: string }>()
  const playerId = params.playerId
  const [player, setPlayer] = useState<Player | null>(null)
  const [links, setLinks] = useState<PlayerTeamSeason[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])

  useEffect(() => {
    if (!db || !playerId) return
    void Promise.all([
      db.players.get(playerId),
      db.playerTeamSeasons.where('playerId').equals(playerId).toArray(),
      db.teams.toArray(),
      db.seasons.toArray(),
    ]).then(([found, playerLinks, allTeams, allSeasons]) => {
      setPlayer(found ?? null)
      setLinks(playerLinks)
      setTeams(allTeams)
      setSeasons(allSeasons)
    })
  }, [playerId])

  if (!player) return <main className="content standalonePage"><header className="topbar"><div><p className="eyebrow">JOGADOR</p><h1>Jogador</h1></div></header><section className="section"><p>Jogador não encontrado.</p><Link href="/players">← Voltar aos jogadores</Link></section></main>

  return <main className="content standalonePage"><header className="topbar"><div><p className="eyebrow">JOGADOR</p><h1>{player.displayName}</h1><p>{player.position ?? 'Sem posição'}{player.shirtNumber ? ` · #${player.shirtNumber}` : ''}</p></div></header><section className="section"><div className="localList">{links.length === 0 && <div className="emptyState"><strong>Sem histórico de equipa</strong><span>Este jogador ainda não está associado a uma época.</span></div>}{links.map(link => { const team = teams.find(t => t.id === link.teamId); const season = seasons.find(s => s.id === link.seasonId); return <article className="localRow" key={link.id}><div><strong>{team?.name ?? 'Equipa'}</strong><span>{season?.name ?? 'Época'} · {link.position ?? player.position ?? 'Sem posição'}</span></div></article> })}</div></section><Link href="/players">← Voltar aos jogadores</Link></main>
}
