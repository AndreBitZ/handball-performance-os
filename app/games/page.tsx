'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { db } from '../../src/lib/storage/db'
import { createId } from '../../src/lib/storage/id'
import type { Competition, Match, MatchSquad, Player, PlayerTeamSeason, Season, Team } from '../../src/lib/storage/types'
import MatchReportLink from './report-link'
import '../dashboard.css'

export default function GamesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [relations, setRelations] = useState<PlayerTeamSeason[]>([])
  const [squad, setSquad] = useState<MatchSquad[]>([])
  const [saved, setSaved] = useState(false)

  async function load() {
    if (!db) return
    const [m, t, s, c] = await Promise.all([
      db.matches.orderBy('date').reverse().toArray(),
      db.teams.orderBy('name').toArray(),
      db.seasons.orderBy('name').reverse().toArray(),
      db.competitions.orderBy('name').toArray(),
    ])
    setMatches(m); setTeams(t); setSeasons(s); setCompetitions(c)
  }

  useEffect(() => { void load() }, [])

  async function openMatch(id: string) {
    if (!db) return
    const match = await db.matches.get(id)
    if (!match) return
    const [allPlayers, allRelations, matchSquads] = await Promise.all([
      db.players.orderBy('displayName').toArray(),
      db.playerTeamSeasons.where('seasonId').equals(match.seasonId).toArray(),
      db.matchSquads.where('matchId').equals(id).toArray(),
    ])
    setSelectedMatchId(id)
    setPlayers(allPlayers)
    setRelations(allRelations)
    setSquad(matchSquads)
    setSaved(true)
  }

  const selectedMatch = matches.find(m => m.id === selectedMatchId) ?? null
  const homeTeamId = selectedMatch?.teamId
  const awayTeamId = selectedMatch?.opponentTeamId
  const teamName = (id?: string) => id ? teams.find(t => t.id === id)?.name ?? 'Equipa' : 'Equipa'
  const seasonName = (id: string) => seasons.find(s => s.id === id)?.name ?? 'Época'
  const competitionName = (id?: string) => id ? competitions.find(c => c.id === id)?.name : undefined
  const playerName = (id: string) => players.find(p => p.id === id)?.displayName ?? 'Jogador'
  const relationFor = (playerId: string, teamId: string) => relations.find(r => r.playerId === playerId && r.teamId === teamId)
  const playersForTeam = useMemo(() => (teamId?: string) => {
    if (!teamId || !selectedMatch) return []
    const ids = new Set(relations.filter(r => r.teamId === teamId).map(r => r.playerId))
    return players.filter(p => p.active && ids.has(p.id))
  }, [players, relations, selectedMatch])
  const current = (playerId: string) => squad.find(s => s.playerId === playerId)

  function toggle(player: Player, teamId: string) {
    const existing = current(player.id)
    if (existing) setSquad(squad.filter(s => s.playerId !== player.id))
    else {
      const r = relationFor(player.id, teamId)
      setSquad([...squad, { id: createId(), matchId: selectedMatchId!, playerId: player.id, teamId, starter: false, captain: false, shirtNumber: r?.shirtNumber ?? player.shirtNumber, position: r?.position ?? player.position }])
    }
    setSaved(false)
  }

  function setField(playerId: string, field: 'starter' | 'captain', teamId: string) {
    setSquad(prev => prev.map(s => {
      if (s.playerId === playerId) return { ...s, [field]: !s[field] }
      if (field === 'captain' && s.teamId === teamId && s.captain) return { ...s, captain: false }
      return s
    }))
    setSaved(false)
  }

  async function saveSquad() {
    if (!db || !selectedMatchId) return
    await db.transaction('rw', db.matchSquads, async () => {
      await db.matchSquads.where('matchId').equals(selectedMatchId).delete()
      if (squad.length) await db.matchSquads.bulkAdd(squad)
    })
    setSaved(true)
  }

  async function remove(id: string) {
    if (!db || !window.confirm('Apagar este jogo?')) return
    await db.matches.delete(id)
    await db.matchSquads.where('matchId').equals(id).delete()
    await db.events.where('matchId').equals(id).delete()
    setSelectedMatchId(null)
    await load()
  }

  function SquadEditor({ teamId, title }: { teamId?: string; title: string }) {
    if (!teamId) return <div className="emptyState"><strong>Equipa não definida</strong><span>Este jogo não tem a segunda equipa associada. Abre-o novamente depois de atualizar os dados.</span></div>
    const teamPlayers = playersForTeam(teamId)
    return <section className="section"><div className="sectionHeader"><div><p className="eyebrow">PLANTEL · {title}</p><h2>{teamName(teamId)}</h2><p>Seleciona os jogadores desta equipa, titulares e capitão.</p></div></div>{teamPlayers.length === 0 ? <div className="emptyState"><strong>Nenhum jogador elegível</strong><span>Adiciona jogadores a esta equipa e época em Gestão.</span></div> : <div className="localList">{teamPlayers.map(player => { const s = current(player.id); return <article className="localRow" key={player.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}><label style={{ display: 'flex', gap: 10, alignItems: 'center' }}><input type="checkbox" checked={!!s} onChange={() => toggle(player, teamId)}/><span><strong>{player.displayName}</strong><small style={{ display: 'block', opacity: .7 }}>{player.position ?? '—'} · #{s?.shirtNumber ?? player.shirtNumber ?? '—'}</small></span></label><label>Inicial <input type="checkbox" disabled={!s} checked={!!s?.starter} onChange={() => setField(player.id, 'starter', teamId)}/></label><label>Capitão <input type="checkbox" disabled={!s} checked={!!s?.captain} onChange={() => setField(player.id, 'captain', teamId)}/></label></article> })}</div>}</section>
  }

  if (selectedMatch) return <main className="content standalonePage"><header className="topbar"><div><button onClick={() => setSelectedMatchId(null)}><ArrowLeft size={16}/> Voltar aos jogos</button><p className="eyebrow">JOGO CRIADO</p><h1>{teamName(homeTeamId)} vs {teamName(awayTeamId) || selectedMatch.opponentName}</h1><p>{seasonName(selectedMatch.seasonId)}{competitionName(selectedMatch.competitionId) ? ` · ${competitionName(selectedMatch.competitionId)}` : ''}{selectedMatch.phaseId ? ' · Fase associada' : ''}{selectedMatch.roundId ? ' · Jornada associada' : ''} · {new Date(selectedMatch.date).toLocaleString('pt-PT')}</p></div><div style={{ display: 'flex', gap: 8 }}><MatchReportLink matchId={selectedMatch.id}/><button onClick={() => void saveSquad()}><Save size={17}/> {saved ? 'Convocatórias guardadas' : 'Guardar convocatórias'}</button><button onClick={() => void remove(selectedMatch.id)}><Trash2 size={17}/> Apagar</button></div></header><SquadEditor teamId={homeTeamId} title="Equipa A"/><SquadEditor teamId={awayTeamId} title="Equipa B"/></main>

  return <main className="content standalonePage"><header className="topbar"><div><p className="eyebrow">JOGOS</p><h1>Jogos criados</h1><p>Aqui aparecem apenas os jogos que já foram criados. Para criar um novo jogo utiliza <strong>Novo Jogo</strong>.</p></div></header><section className="section">{matches.length === 0 ? <div className="emptyState"><strong>Ainda não existem jogos</strong><span>Vai a Novo Jogo para criar o primeiro.</span></div> : <div className="localList">{matches.map(match => <article className="localRow" key={match.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}><button style={{ textAlign: 'left', background: 'transparent', border: 0, padding: 0 }} onClick={() => void openMatch(match.id)}><strong>{teamName(match.teamId)} {match.opponentTeamId ? `vs ${teamName(match.opponentTeamId)}` : `vs ${match.opponentName}`}</strong><span style={{ display: 'block', opacity: .7 }}>{seasonName(match.seasonId)}{competitionName(match.competitionId) ? ` · ${competitionName(match.competitionId)}` : ''} · {new Date(match.date).toLocaleString('pt-PT')}</span></button><span>{match.status}</span><button onClick={() => void remove(match.id)} title="Apagar"><Trash2 size={16}/></button></article>)}</div>}</section></main>
}
