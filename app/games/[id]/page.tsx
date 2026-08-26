'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Users, BarChart3, Video, Play, Download, Upload } from 'lucide-react'
import { db } from '../../../src/lib/storage/db'
import { downloadHpoMatch } from '../../../src/lib/integration/hpoMatchFile'
import type { Match, Team, Season, Competition } from '../../../src/lib/storage/types'
import '../../dashboard.css'

export default function GameDetailPage({ params }: { params: { id: string } }) {
  const [match, setMatch] = useState<Match | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [season, setSeason] = useState<Season | null>(null)
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!db) return
      const item = await db.matches.get(params.id)
      setMatch(item ?? null)
      if (item) {
        const [t, s, c] = await Promise.all([
          db.teams.get(item.teamId), db.seasons.get(item.seasonId),
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
  const currentMatch = match
  const date = new Date(currentMatch.date).toLocaleString('pt-PT')
  const location = currentMatch.homeAway === 'HOME' ? 'Casa' : currentMatch.homeAway === 'AWAY' ? 'Fora' : 'Neutro'

  async function exportForStats() {
    setExporting(true); setMessage(null)
    try { await downloadHpoMatch(currentMatch.id); setMessage('Ficheiro HPO-MATCH criado. Importa este ficheiro no Andebol-Stats.') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível criar o ficheiro HPO-MATCH.') }
    finally { setExporting(false) }
  }

  return <main className="content standalonePage">
    <header className="topbar"><div><Link href="/games" className="navItem" style={{ display:'inline-flex', padding:0, marginBottom:12 }}><ArrowLeft size={16}/> Jogos</Link><p className="eyebrow">FICHA DO JOGO</p><h1>{team?.name ?? 'Equipa'} vs {currentMatch.opponentName}</h1><p>{date} · {location} · {currentMatch.venue || 'Local por definir'}</p></div></header>
    <section className="hero"><div><p className="eyebrow">{competition?.name ?? 'Sem competição'}</p><h2>{team?.name ?? 'Equipa'} <span style={{ opacity:.65 }}>vs</span> {currentMatch.opponentName}</h2><p>{season?.name ?? 'Época'} · {currentMatch.status === 'PLANNED' ? 'Jogo planeado' : currentMatch.status === 'IN_PROGRESS' ? 'Em curso' : 'Concluído'}</p></div><div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:10}}><div className="heroBadge">{currentMatch.goalsFor ?? '-'} : {currentMatch.goalsAgainst ?? '-'}</div><button onClick={()=>void exportForStats()} disabled={exporting}><Download size={16}/>{exporting?'A preparar…':'Exportar HPO-MATCH'}</button></div></section>
    {message && <section className="section"><p role="status">{message}</p></section>}
    <section className="moduleGrid"><Link href={`/games/${currentMatch.id}/squad`} className="moduleCard"><div className="moduleEmoji"><Users/></div><h4>Convocados</h4><p>Selecionar os jogadores disponíveis para este jogo.</p><span>ABRIR →</span></Link><Link href={`/games/${currentMatch.id}/live`} className="moduleCard"><div className="moduleEmoji"><Play/></div><h4>Live Match</h4><p>Iniciar cronómetro e registar eventos em direto.</p><span>ABRIR →</span></Link><Link href="/games/import" className="moduleCard"><div className="moduleEmoji"><Upload/></div><h4>Importar resultado</h4><p>Receber o HPO-MATCH final vindo do Andebol-Stats.</p><span>ABRIR →</span></Link><div className="moduleCard"><div className="moduleEmoji"><BarChart3/></div><h4>Estatísticas</h4><p>Análise do jogo, jogadores e indicadores de performance.</p><span>PRÓXIMO MÓDULO</span></div><div className="moduleCard"><div className="moduleEmoji"><Video/></div><h4>Vídeo</h4><p>Vídeo, eventos e clips associados ao jogo.</p><span>PRÓXIMO MÓDULO</span></div></section>
  </main>
}
