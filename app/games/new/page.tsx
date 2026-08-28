'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
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
  const [teamIdsByCompetition, setTeamIdsByCompetition] = useState<Record<string, string[]>>({})
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
      db.teams.where('active').equals(1).sortBy('name'),
      db.seasons.orderBy('name').reverse().toArray(),
      db.competitions.orderBy('name').toArray(),
      db.competitionTeams.toArray(),
    ]).then(([t, s, c, ct]) => {
      setTeams(t); setSeasons(s); setCompetitions(c)
      const grouped: Record<string, string[]> = {}
      for (const row of ct) (grouped[row.competitionId] ??= []).push(row.teamId)
      setTeamIdsByCompetition(grouped)
      if (s[0]) setSeasonId(s[0].id)
    }).catch(() => {
      // Dexie indexes booleans differently across versions; use the full active filter as a safe fallback.
      void Promise.all([db!.teams.orderBy('name').toArray(), db!.seasons.orderBy('name').reverse().toArray(), db!.competitions.orderBy('name').toArray(), db!.competitionTeams.toArray()]).then(([t, s, c, ct]) => {
        setTeams(t.filter(team => team.active)); setSeasons(s); setCompetitions(c)
        const grouped: Record<string, string[]> = {}; for (const row of ct) (grouped[row.competitionId] ??= []).push(row.teamId)
        setTeamIdsByCompetition(grouped); if (s[0]) setSeasonId(s[0].id)
      })
    })
  }, [])

  const seasonCompetitions = useMemo(() => competitions.filter(c => c.seasonId === seasonId), [competitions, seasonId])
  const selectedCompetitionTeamIds = competitionId ? (teamIdsByCompetition[competitionId] ?? []) : []
  const availableTeams = competitionId ? teams.filter(team => selectedCompetitionTeamIds.includes(team.id)) : teams

  useEffect(() => {
    if (!competitionId) return
    if (!selectedCompetitionTeamIds.includes(teamId)) setTeamId('')
    if (!selectedCompetitionTeamIds.includes(opponentTeamId)) setOpponentTeamId('')
  }, [competitionId, selectedCompetitionTeamIds, teamId, opponentTeamId])

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (!db || !teamId || !opponentTeamId || !seasonId || !date) return setError('Preenche equipa A, equipa B, época e data.')
    if (teamId === opponentTeamId) return setError('As duas equipas têm de ser diferentes.')
    if (competitionId && !selectedCompetitionTeamIds.includes(teamId)) return setError('A equipa da casa não está associada a esta competição.')
    if (competitionId && !selectedCompetitionTeamIds.includes(opponentTeamId)) return setError('A equipa adversária não está associada a esta competição.')
    if (competitionId && selectedCompetitionTeamIds.length < 2) return setError('A competição tem de ter pelo menos duas equipas associadas antes de criar jogos.')

    const [ownSeasonPlayers, opponentSeasonPlayers] = await Promise.all([
      db.playerTeamSeasons.where('[teamId+seasonId]').equals([teamId, seasonId]).toArray(),
      db.playerTeamSeasons.where('[teamId+seasonId]').equals([opponentTeamId, seasonId]).toArray(),
    ])
    const playerIds = [...new Set([...ownSeasonPlayers.map(row => row.playerId), ...opponentSeasonPlayers.map(row => row.playerId)])]
    const players = await db.players.bulkGet(playerIds)
    const now = new Date().toISOString()
    const matchId = createId()
    await db.matches.add({
      id: matchId, seasonId, competitionId: competitionId || undefined, teamId, opponentTeamId,
      opponentName: teams.find(t => t.id === opponentTeamId)?.name ?? '', date, venue: venue.trim() || undefined,
      homeAway, status: 'PLANNED', createdAt: now, updatedAt: now,
    })
    const squads = [...ownSeasonPlayers.map(row => ({ row, teamId })), ...opponentSeasonPlayers.map(row => ({ row, teamId: opponentTeamId }))]
      .filter(item => players.some(player => player?.id === item.row.playerId))
      .map(item => ({ id: createId(), matchId, playerId: item.row.playerId, teamId: item.teamId, starter: false, captain: false, shirtNumber: item.row.shirtNumber, position: item.row.position }))
    if (squads.length) await db.matchSquads.bulkAdd(squads)
    router.push('/games')
  }

  return <main className="content standalonePage"><header className="topbar"><div><p className="eyebrow">NOVO JOGO</p><h1>Equipas existentes</h1><p>Um jogo só pode usar equipas criadas no Performance OS. Quando há competição, ambas têm de estar associadas ao campeonato.</p></div></header><section className="section"><form onSubmit={submit} className="localForm"><label>Época<select value={seasonId} onChange={e => { setSeasonId(e.target.value); setCompetitionId(''); setTeamId(''); setOpponentTeamId('') }} required><option value="">Selecionar</option>{seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Competição<select value={competitionId} onChange={e => { setCompetitionId(e.target.value); setTeamId(''); setOpponentTeamId('') }}><option value="">Sem competição</option>{seasonCompetitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Equipa A<select value={teamId} onChange={e => { setTeamId(e.target.value); setOpponentTeamId('') }} required><option value="">Selecionar equipa criada</option>{availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Equipa B<select value={opponentTeamId} onChange={e => setOpponentTeamId(e.target.value)} required><option value="">Selecionar equipa criada</option>{availableTeams.filter(t => t.id !== teamId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Data<input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required /></label><label>Local<input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Pavilhão" /></label><label>Contexto<select value={homeAway} onChange={e => setHomeAway(e.target.value as Match['homeAway'])}><option value="HOME">Casa</option><option value="AWAY">Fora</option><option value="NEUTRAL">Neutro</option></select></label>{competitionId && selectedCompetitionTeamIds.length < 2 && <p role="alert">Esta competição ainda não tem duas equipas associadas. Vai a Épocas & Competições e associa as equipas.</p>}{error && <p role="alert">{error}</p>}<div style={{display:'flex',gap:10}}><button type="button" onClick={() => router.push('/games')}>Cancelar</button><button type="submit" disabled={Boolean(competitionId && selectedCompetitionTeamIds.length < 2)}>Criar jogo</button></div></form></section></main>
}
