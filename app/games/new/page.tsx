'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../src/lib/storage/db'
import { createId } from '../../../src/lib/storage/id'
import type { Competition, Season, Team, Match } from '../../../src/lib/storage/types'
import '../../dashboard.css'

export default function NewGamePage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [teamId, setTeamId] = useState('')
  const [opponentTeamId, setOpponentTeamId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [competitionId, setCompetitionId] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [homeAway, setHomeAway] = useState<Match['homeAway']>('HOME')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!db) return
    void Promise.all([
      db.teams.orderBy('name').toArray(),
      db.seasons.orderBy('name').reverse().toArray(),
      db.competitions.orderBy('name').toArray(),
    ]).then(([t, s, c]) => {
      setTeams(t); setSeasons(s); setCompetitions(c)
      if (s[0]) setSeasonId(s[0].id)
    })
  }, [])

  const seasonCompetitions = competitions.filter(c => c.seasonId === seasonId)

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (!db || !teamId || !opponentTeamId || !seasonId || !date) return setError('Preenche equipa A, equipa B, época e data.')
    if (teamId === opponentTeamId) return setError('As duas equipas têm de ser diferentes.')
    const now = new Date().toISOString()
    await db.matches.add({
      id: createId(), seasonId, competitionId: competitionId || undefined, teamId,
      opponentTeamId, opponentName: teams.find(t => t.id === opponentTeamId)?.name ?? 'Equipa',
      date, venue: venue.trim() || undefined, homeAway, status: 'PLANNED', createdAt: now, updatedAt: now,
    })
    router.push('/games')
  }

  return <main className="content standalonePage"><header className="topbar"><div><p className="eyebrow">NOVO JOGO</p><h1>Equipa A vs Equipa B</h1><p>Regista qualquer encontro. A tua equipa não é obrigatória.</p></div></header><section className="section"><form onSubmit={submit} className="localForm"><label>Equipa A<select value={teamId} onChange={e => setTeamId(e.target.value)} required><option value="">Selecionar</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Equipa B<select value={opponentTeamId} onChange={e => setOpponentTeamId(e.target.value)} required><option value="">Selecionar</option>{teams.filter(t => t.id !== teamId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Época<select value={seasonId} onChange={e => { setSeasonId(e.target.value); setCompetitionId('') }} required><option value="">Selecionar</option>{seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Competição<select value={competitionId} onChange={e => setCompetitionId(e.target.value)}><option value="">Sem competição</option>{seasonCompetitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Data<input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required /></label><label>Local<input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Pavilhão" /></label><label>Contexto<select value={homeAway} onChange={e => setHomeAway(e.target.value as Match['homeAway'])}><option value="HOME">Casa</option><option value="AWAY">Fora</option><option value="NEUTRAL">Neutro</option></select></label>{error && <p role="alert">{error}</p>}<div style={{display:'flex',gap:10}}><button type="button" onClick={() => router.push('/games')}>Cancelar</button><button type="submit">Criar jogo</button></div></form></section></main>
}
