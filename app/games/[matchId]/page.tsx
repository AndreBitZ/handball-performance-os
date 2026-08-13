'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '../../../src/lib/storage/db'
import type { Match, MatchSquad, Player, PlayerTeamSeason, Season, Team } from '../../../src/lib/storage/types'
import '../../dashboard.css'

export default function GameDetailPage() {
  const params = useParams<{ matchId: string }>()
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [season, setSeason] = useState<Season | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [relations, setRelations] = useState<PlayerTeamSeason[]>([])
  const [squad, setSquad] = useState<MatchSquad[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!db || !params.matchId) return
    void (async () => {
      const m = await db.matches.get(params.matchId)
      if (!m) { setError('Jogo não encontrado.'); return }
      const [t, s, p, r, sq] = await Promise.all([
        db.teams.toArray(),
        db.seasons.get(m.seasonId),
        db.players.orderBy('displayName').toArray(),
        db.playerTeamSeasons.where('seasonId').equals(m.seasonId).toArray(),
        db.matchSquads.where('matchId').equals(m.id).toArray(),
      ])
      setMatch(m); setTeams(t); setSeason(s ?? null); setPlayers(p); setRelations(r); setSquad(sq)
    })()
  }, [params.matchId])

  if (error) return <main className="content standalonePage"><section className="section"><h1>{error}</h1><button onClick={() => router.push('/games')}>Voltar aos jogos</button></section></main>
  if (!match) return <main className="content standalonePage"><section className="section"><p>A carregar jogo…</p></section></main>

  const teamA = teams.find(t => t.id === match.teamId)
  const teamB = match.opponentTeamId ? teams.find(t => t.id === match.opponentTeamId) : undefined
  const playersFor = (teamId: string) => {
    const ids = new Set(relations.filter(r => r.teamId === teamId).map(r => r.playerId))
    return players.filter(p => ids.has(p.id) && p.active)
  }
  const squadFor = (teamId: string) => squad.filter(s => s.teamId === teamId)

  return <main className="content standalonePage">
    <header className="topbar">
      <div>
        <button onClick={() => router.push('/games')}>Voltar aos jogos</button>
        <p className="eyebrow">FICHA DO JOGO</p>
        <h1>{teamA?.name ?? match.opponentName} <span>vs</span> {teamB?.name ?? match.opponentName}</h1>
        <p>{season?.name ?? 'Época'} · {new Date(match.date).toLocaleString('pt-PT')} · {match.venue ?? 'Local por definir'}</p>
      </div>
    </header>

    <section className="section">
      <div className="sectionHeader"><div><p className="eyebrow">PLANTÉIS</p><h2>Ambas as equipas</h2><p>O mesmo jogo pode ser analisado dos dois lados.</p></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16 }}>
        {[match.teamId, match.opponentTeamId].filter(Boolean).map((teamId) => {
          const team = teams.find(t => t.id === teamId)
          const eligible = playersFor(teamId as string)
          const selected = squadFor(teamId as string)
          return <article className="panel" key={teamId}>
            <h3>{team?.name ?? 'Equipa'}</h3>
            <p>{selected.length} convocados · {selected.filter(s => s.starter).length} titulares</p>
            <div className="localList">
              {eligible.map(player => {
                const s = selected.find(x => x.playerId === player.id)
                return <div className="localRow" key={player.id}><strong>{player.displayName}</strong><span>{s ? `Convocado · ${s.starter ? 'Titular' : 'Banco'}` : 'Disponível'}</span></div>
              })}
              {eligible.length === 0 && <p>Nenhum jogador associado a esta equipa nesta época.</p>}
            </div>
          </article>
        })}
      </div>
    </section>

    <section className="section">
      <div className="sectionHeader"><div><p className="eyebrow">ANÁLISE</p><h2>Centro do jogo</h2><p>O próximo passo será ligar eventos, vídeo e estatística às duas equipas e aos seus jogadores.</p></div><button onClick={() => router.push(`/games/${match.id}/analysis`)}>Abrir análise</button></div>
    </section>
  </main>
}
