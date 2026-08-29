'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../src/lib/storage/db'
import { createId } from '../../../src/lib/storage/id'
import type { Competition, CompetitionPhase, CompetitionRound, Season, Team, Match } from '../../../src/lib/storage/types'
import '../../dashboard.css'

export default function NewGamePage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [competitionTeams, setCompetitionTeams] = useState<{ competitionId: string; teamId: string }[]>([])
  const [phases, setPhases] = useState<CompetitionPhase[]>([])
  const [rounds, setRounds] = useState<CompetitionRound[]>([])
  const [teamId, setTeamId] = useState('')
  const [opponentTeamId, setOpponentTeamId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [competitionId, setCompetitionId] = useState('')
  const [phaseId, setPhaseId] = useState('')
  const [roundId, setRoundId] = useState('')
  const [newPhaseName, setNewPhaseName] = useState('')
  const [newRoundNumber, setNewRoundNumber] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [homeAway, setHomeAway] = useState<Match['homeAway']>('HOME')
  const [error, setError] = useState('')

  async function load() {
    if (!db) return
    const [t, s, c, ct, p, r] = await Promise.all([
      db.teams.orderBy('name').toArray(), db.seasons.orderBy('name').reverse().toArray(),
      db.competitions.orderBy('name').toArray(), db.competitionTeams.toArray(),
      db.competitionPhases.orderBy('order').toArray(), db.competitionRounds.orderBy('roundNumber').toArray(),
    ])
    setTeams(t.filter(team => team.active)); setSeasons(s); setCompetitions(c); setCompetitionTeams(ct)
    setPhases(p); setRounds(r); if (!seasonId && s[0]) setSeasonId(s[0].id)
  }

  useEffect(() => { void load() }, [])

  const seasonCompetitions = useMemo(() => competitions.filter(c => c.seasonId === seasonId), [competitions, seasonId])
  const selectedCompetitionTeamIds = competitionId ? competitionTeams.filter(x => x.competitionId === competitionId).map(x => x.teamId) : []
  const availableTeams = competitionId ? teams.filter(team => selectedCompetitionTeamIds.includes(team.id)) : teams
  const competitionPhases = competitionId ? phases.filter(p => p.competitionId === competitionId) : []
  const phaseRounds = phaseId ? rounds.filter(r => r.phaseId === phaseId) : []

  useEffect(() => {
    if (!competitionId) { setPhaseId(''); setRoundId(''); return }
    if (!selectedCompetitionTeamIds.includes(teamId)) setTeamId('')
    if (!selectedCompetitionTeamIds.includes(opponentTeamId)) setOpponentTeamId('')
    setPhaseId(''); setRoundId('')
  }, [competitionId])

  useEffect(() => { if (phaseId && !competitionPhases.some(p => p.id === phaseId)) setPhaseId(''); setRoundId('') }, [phaseId])

  async function ensurePhase(): Promise<string | undefined> {
    if (!db || !competitionId) return undefined
    if (phaseId) return phaseId
    const name = newPhaseName.trim()
    if (!name) return undefined
    const existing = await db.competitionPhases.where('competitionId').equals(competitionId).toArray()
    const found = existing.find(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase())
    if (found) return found.id
    const id = createId()
    await db.competitionPhases.add({ id, competitionId, name, order: existing.length + 1 })
    return id
  }

  async function ensureRound(selectedPhaseId?: string): Promise<string | undefined> {
    if (!db || !selectedPhaseId || !newRoundNumber) return roundId || undefined
    if (roundId) return roundId
    const roundNumber = Number(newRoundNumber)
    if (!Number.isInteger(roundNumber) || roundNumber < 1) return undefined
    const existing = await db.competitionRounds.where('phaseId').equals(selectedPhaseId).toArray()
    const found = existing.find(r => r.roundNumber === roundNumber)
    if (found) return found.id
    const id = createId()
    await db.competitionRounds.add({ id, phaseId: selectedPhaseId, name: `Jornada ${roundNumber}`, roundNumber, order: existing.length + 1 })
    return id
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (!db || !teamId || !opponentTeamId || !seasonId || !date) return setError('Preenche época, equipa A, equipa B e data.')
    if (teamId === opponentTeamId) return setError('As duas equipas têm de ser diferentes.')
    if (competitionId && selectedCompetitionTeamIds.length < 2) return setError('A competição tem de ter pelo menos duas equipas associadas.')
    if (competitionId && (!selectedCompetitionTeamIds.includes(teamId) || !selectedCompetitionTeamIds.includes(opponentTeamId))) return setError('As duas equipas têm de estar associadas à competição.')
    if (newRoundNumber && !phaseId && !newPhaseName.trim()) return setError('Para indicar a jornada, seleciona uma fase ou cria uma fase.')

    const finalPhaseId = await ensurePhase()
    const finalRoundId = await ensureRound(finalPhaseId)
    if (newRoundNumber && !finalRoundId) return setError('A jornada deve ser um número inteiro positivo.')

    const [ownSeasonPlayers, opponentSeasonPlayers] = await Promise.all([
      db.playerTeamSeasons.where('[teamId+seasonId]').equals([teamId, seasonId]).toArray(),
      db.playerTeamSeasons.where('[teamId+seasonId]').equals([opponentTeamId, seasonId]).toArray(),
    ])
    const playerIds = [...new Set([...ownSeasonPlayers.map(row => row.playerId), ...opponentSeasonPlayers.map(row => row.playerId)])]
    const players = await db.players.bulkGet(playerIds)
    const now = new Date().toISOString(); const matchId = createId()
    await db.matches.add({ id: matchId, seasonId, competitionId: competitionId || undefined, phaseId: finalPhaseId, roundId: finalRoundId, teamId, opponentTeamId, opponentName: teams.find(t => t.id === opponentTeamId)?.name ?? '', date, venue: venue.trim() || undefined, homeAway, status: 'PLANNED', createdAt: now, updatedAt: now })
    const squads = [...ownSeasonPlayers.map(row => ({ row, teamId })), ...opponentSeasonPlayers.map(row => ({ row, teamId: opponentTeamId }))]
      .filter(item => players.some(player => player?.id === item.row.playerId))
      .map(item => ({ id: createId(), matchId, playerId: item.row.playerId, teamId: item.teamId, starter: false, captain: false, shirtNumber: item.row.shirtNumber, position: item.row.position }))
    if (squads.length) await db.matchSquads.bulkAdd(squads)
    router.push('/games')
  }

  return <main className="content standalonePage"><header className="topbar"><div><p className="eyebrow">NOVO JOGO</p><h1>Criar jogo</h1><p>O jogo usa apenas equipas existentes e, quando há competição, apenas participantes desse campeonato.</p></div></header><section className="section"><form onSubmit={submit} className="localForm">
    <label>Época<select value={seasonId} onChange={e => { setSeasonId(e.target.value); setCompetitionId(''); setTeamId(''); setOpponentTeamId(''); setPhaseId(''); setRoundId('') }} required><option value="">Selecionar</option>{seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <label>Competição<select value={competitionId} onChange={e => { setCompetitionId(e.target.value); setTeamId(''); setOpponentTeamId('') }}><option value="">Sem competição</option>{seasonCompetitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    {competitionId && <>
      <label>Fase<select value={phaseId} onChange={e => { setPhaseId(e.target.value); setRoundId('') }}><option value="">Selecionar fase</option>{competitionPhases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Nova fase (opcional)<input value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} placeholder="Ex.: Fase Regular / Grupo A / Play-off" /></label>
      <label>Jornada<select value={roundId} onChange={e => setRoundId(e.target.value)} disabled={!phaseId}><option value="">Selecionar jornada</option>{phaseRounds.map(r => <option key={r.id} value={r.id}>Jornada {r.roundNumber}</option>)}</select></label>
      <label>Nova jornada (opcional)<input type="number" min="1" step="1" value={newRoundNumber} onChange={e => { setNewRoundNumber(e.target.value); setRoundId('') }} placeholder="Ex.: 1" /></label>
    </>}
    <label>Equipa A<select value={teamId} onChange={e => { setTeamId(e.target.value); setOpponentTeamId('') }} required><option value="">Selecionar equipa criada</option>{availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
    <label>Equipa B<select value={opponentTeamId} onChange={e => setOpponentTeamId(e.target.value)} required><option value="">Selecionar equipa criada</option>{availableTeams.filter(t => t.id !== teamId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
    <label>Data<input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required /></label>
    <label>Local<input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Pavilhão" /></label>
    <label>Contexto<select value={homeAway} onChange={e => setHomeAway(e.target.value as Match['homeAway'])}><option value="HOME">Casa</option><option value="AWAY">Fora</option><option value="NEUTRAL">Neutro</option></select></label>
    {competitionId && selectedCompetitionTeamIds.length < 2 && <p role="alert">Esta competição ainda não tem duas equipas associadas.</p>}{error && <p role="alert">{error}</p>}
    <div style={{display:'flex',gap:10}}><button type="button" onClick={() => router.push('/games')}>Cancelar</button><button type="submit" disabled={Boolean(competitionId && selectedCompetitionTeamIds.length < 2)}>Criar jogo</button></div>
  </form></section></main>
}
