'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Swords, ArrowRight } from 'lucide-react'
import { db } from '../../src/lib/storage/db'
import { createId } from '../../src/lib/storage/id'
import type { Competition, Match, Season, Team } from '../../src/lib/storage/types'
import '../dashboard.css'

export default function GamesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [teamId, setTeamId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [competitionId, setCompetitionId] = useState('')
  const [opponent, setOpponent] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [homeAway, setHomeAway] = useState<Match['homeAway']>('HOME')

  async function load() {
    if (!db) return
    const [nextMatches, nextTeams, nextSeasons, nextCompetitions] = await Promise.all([
      db.matches.orderBy('date').reverse().toArray(),
      db.teams.orderBy('name').toArray(),
      db.seasons.orderBy('name').reverse().toArray(),
      db.competitions.orderBy('name').toArray(),
    ])
    setMatches(nextMatches); setTeams(nextTeams); setSeasons(nextSeasons); setCompetitions(nextCompetitions)
    if (!teamId && nextTeams[0]) setTeamId(nextTeams[0].id)
    if (!seasonId && nextSeasons[0]) setSeasonId(nextSeasons[0].id)
  }

  useEffect(() => { void load() }, [])
  const seasonCompetitions = useMemo(() => competitions.filter(c => !seasonId || c.seasonId === seasonId), [competitions, seasonId])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!db || !teamId || !seasonId || !opponent.trim() || !date) return
    const now = new Date().toISOString()
    await db.matches.add({ id: createId(), seasonId, competitionId: competitionId || undefined, teamId, opponentName: opponent.trim(), date, venue: venue.trim() || undefined, homeAway, status: 'PLANNED', createdAt: now, updatedAt: now })
    setOpponent(''); setDate(''); setVenue(''); await load()
  }

  async function remove(id: string) {
    if (db && window.confirm('Apagar este jogo?')) { await db.matches.delete(id); await load() }
  }

  const teamName = (id: string) => teams.find(t => t.id === id)?.name ?? 'Equipa'
  const seasonName = (id: string) => seasons.find(s => s.id === id)?.name ?? 'Época'
  const competitionName = (id?: string) => id ? competitions.find(c => c.id === id)?.name : undefined

  return <main className="content standalonePage">
    <header className="topbar"><div><p className="eyebrow">CALENDÁRIO</p><h1>Jogos</h1><p>Planeamento dos jogos com dados guardados localmente.</p></div></header>
    <section className="section">
      <form onSubmit={add} className="localForm">
        <select value={teamId} onChange={e => setTeamId(e.target.value)} required aria-label="Equipa"><option value="">Equipa</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
        <select value={seasonId} onChange={e => { setSeasonId(e.target.value); setCompetitionId('') }} required aria-label="Época"><option value="">Época</option>{seasons.map(season => <option key={season.id} value={season.id}>{season.name}</option>)}</select>
        <select value={competitionId} onChange={e => setCompetitionId(e.target.value)} aria-label="Competição"><option value="">Competição (opcional)</option>{seasonCompetitions.map(competition => <option key={competition.id} value={competition.id}>{competition.name}</option>)}</select>
        <input value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="Adversário" required />
        <input value={date} onChange={e => setDate(e.target.value)} type="datetime-local" required />
        <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Pavilhão / local" />
        <select value={homeAway} onChange={e => setHomeAway(e.target.value as Match['homeAway'])} aria-label="Casa ou fora"><option value="HOME">Casa</option><option value="AWAY">Fora</option><option value="NEUTRAL">Neutro</option></select>
        <button type="submit"><Plus size={17}/> Criar jogo</button>
      </form>
      <div className="localList">
        {matches.length === 0 && <div className="emptyState"><Swords size={30}/><strong>Nenhum jogo</strong><span>Cria o primeiro jogo para começar a organizar a época.</span></div>}
        {matches.map(m => <article className="localRow" key={m.id}>
          <Link href={`/games/${m.id}`} style={{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
            <strong>{teamName(m.teamId)} vs {m.opponentName}</strong>
            <span>{seasonName(m.seasonId)}{competitionName(m.competitionId) ? ` · ${competitionName(m.competitionId)}` : ''} · {new Date(m.date).toLocaleString('pt-PT')} · {m.homeAway === 'HOME' ? 'Casa' : m.homeAway === 'AWAY' ? 'Fora' : 'Neutro'} · {m.venue || 'Local por definir'}</span>
          </Link>
          <Link href={`/games/${m.id}`} className="iconButton" aria-label="Abrir jogo"><ArrowRight size={17}/></Link>
          <button className="iconButton" onClick={() => remove(m.id)} aria-label="Apagar jogo"><Trash2 size={17}/></button>
        </article>)}
      </div>
    </section>
  </main>
}
