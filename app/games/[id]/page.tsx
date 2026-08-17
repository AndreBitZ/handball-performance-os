'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Users, BarChart3, Video, Play } from 'lucide-react'
import { db } from '../../../src/lib/storage/db'
import type { Match, Team, Season, Competition } from '../../../src/lib/storage/types'
import '../../dashboard.css'

export default function GameDetailPage({ params }: { params: { id: string } }) {
  const [match, setMatch] = useState<Match | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [season, setSeason] = useState<Season | null>(null)
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!db) return
      const item = await db.matches.get(params.id)
      setMatch(item ?? null)
      if (item) {
        const [t, s, c] = await Promise.all([
          db.teams.get(item.teamId),
          db.seasons.get(item.seasonId),
          item.competitionId ? db.competitions.get(item.competitionId) : Promise.resolve(undefined),
        ])
        setTeam(t ?? null); setSeason(s ?? null); setCompetition(c ?? null)
      }
      setLoading(false)
    }
    void load()
  }, [params.id])

  if (loading) return <main className="content standalonePage"><p>A carregar jogo…</p></main>
  if (!match) return <main className="content standalonePage"><Link href="/games">← Jogos</Link><h1 style={{ marginTop: 20 }}>Jogo não encontrado</h1></main>

  const date = new Date(match.date).toLocaleString('pt-PT')
  const location = match.homeAway === 'HOME' ? 'Casa' : match.homeAway === 'AWAY' ? 'Fora' : 'Neutro'

  return <main className="content standalonePage">
    <header className="topbar">
      <div><Link href="/games" className="navItem" style={{ display: 'inline-flex', padding: 0, marginBottom: 12 }}><ArrowLeft size={16}/> Jogos</Link><p className="eyebrow">FICHA DO JOGO</p><h1>{team?.name ?? 'Equipa'} vs {match.opponentName}</h1><p>{date} · {location} · {match.venue || 'Local por definir'}</p></div>
    </header>
    <section className="hero">
      <div><p className="eyebrow">{competition?.name ?? 'Sem competição'}</p><h2>{team?.name ?? 'Equipa'} <span style={{ opacity: .65 }}>vs</span> {match.opponentName}</h2><p>{season?.name ?? 'Época'} · {match.status === 'PLANNED' ? 'Jogo planeado' : match.status === 'IN_PROGRESS' ? 'Em curso' : 'Concluído'}</p></div>
      <div className="heroBadge">{match.goalsFor ?? '-'} : {match.goalsAgainst ?? '-'}</div>
    </section>
    <section className="moduleGrid">
      <Link href={`/games/${match.id}/squad`} className="moduleCard"><div className="moduleEmoji"><Users/></div><h4>Convocados</h4><p>Selecionar os jogadores disponíveis para este jogo.</p><span>ABRIR →</span></Link>
      <Link href={`/games/${match.id}/live`} className="moduleCard"><div className="moduleEmoji"><Play/></div><h4>Live Match</h4><p>Iniciar cronómetro e registar eventos em direto.</p><span>ABRIR →</span></Link>
      <div className="moduleCard"><div className="moduleEmoji"><BarChart3/></div><h4>Estatísticas</h4><p>Análise do jogo, jogadores e indicadores de performance.</p><span>PRÓXIMO MÓDULO</span></div>
      <div className="moduleCard"><div className="moduleEmoji"><Video/></div><h4>Vídeo</h4><p>Vídeo, eventos e clips associados ao jogo.</p><span>PRÓXIMO MÓDULO</span></div>
    </section>
  </main>
}
