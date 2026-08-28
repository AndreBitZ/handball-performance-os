'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, CalendarRange, Trophy, BarChart3, Users } from 'lucide-react'
import { db } from '../../src/lib/storage/db'
import { createId } from '../../src/lib/storage/id'
import type { Competition, CompetitionTeam, Season, Team } from '../../src/lib/storage/types'
import PlayerStatsView from './player-stats-view'
import '../dashboard.css'

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [competitionTeams, setCompetitionTeams] = useState<CompetitionTeam[]>([])
  const [name, setName] = useState('2026/27')
  const [competitionName, setCompetitionName] = useState('')
  const [competitionSeasonId, setCompetitionSeasonId] = useState('')
  const [statsSeasonId, setStatsSeasonId] = useState('')
  const [statsTeamId, setStatsTeamId] = useState('')
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null)
  const [editingCompetitionId, setEditingCompetitionId] = useState<string | null>(null)
  const [editSeasonName, setEditSeasonName] = useState('')
  const [editCompetitionName, setEditCompetitionName] = useState('')
  const [editCompetitionSeasonId, setEditCompetitionSeasonId] = useState('')
  const [associationCompetitionId, setAssociationCompetitionId] = useState('')
  const [associationTeamId, setAssociationTeamId] = useState('')

  async function load() {
    if (!db) return
    const [nextSeasons, nextCompetitions, nextTeams, nextCompetitionTeams] = await Promise.all([
      db.seasons.orderBy('name').reverse().toArray(), db.competitions.orderBy('name').toArray(),
      db.teams.orderBy('name').toArray(), db.competitionTeams.toArray(),
    ])
    setSeasons(nextSeasons); setCompetitions(nextCompetitions); setTeams(nextTeams); setCompetitionTeams(nextCompetitionTeams)
    if (!competitionSeasonId && nextSeasons[0]) setCompetitionSeasonId(nextSeasons[0].id)
    if (!statsSeasonId && nextSeasons[0]) setStatsSeasonId(nextSeasons[0].id)
    if (!statsTeamId && nextTeams[0]) setStatsTeamId(nextTeams[0].id)
    if (!associationCompetitionId && nextCompetitions[0]) setAssociationCompetitionId(nextCompetitions[0].id)
  }
  useEffect(() => { void load() }, [])
  const competitionsBySeason = useMemo(() => {
    const result = new Map<string, Competition[]>()
    for (const competition of competitions) { const list = result.get(competition.seasonId) ?? []; list.push(competition); result.set(competition.seasonId, list) }
    return result
  }, [competitions])
  const teamsByCompetition = (competitionId: string) => competitionTeams.filter(item => item.competitionId === competitionId).map(item => teams.find(team => team.id === item.teamId)).filter(Boolean) as Team[]
  async function addSeason(e: React.FormEvent) { e.preventDefault(); if (!db || !name.trim()) return; await db.seasons.add({ id: createId(), name: name.trim(), active: true }); setName(''); await load() }
  async function addCompetition(e: React.FormEvent) { e.preventDefault(); if (!db || !competitionName.trim() || !competitionSeasonId) return; await db.competitions.add({ id: createId(), name: competitionName.trim(), seasonId: competitionSeasonId }); setCompetitionName(''); await load() }
  async function addCompetitionTeam(e: React.FormEvent) {
    e.preventDefault(); if (!db || !associationCompetitionId || !associationTeamId) return
    const competition = await db.competitions.get(associationCompetitionId); const team = await db.teams.get(associationTeamId)
    if (!competition || !team || team.active === false) return
    const exists = await db.competitionTeams.where('[competitionId+teamId]').equals([associationCompetitionId, associationTeamId]).first()
    if (!exists) await db.competitionTeams.add({ id: createId(), competitionId: associationCompetitionId, teamId: associationTeamId, seasonId: competition.seasonId })
    setAssociationTeamId(''); await load()
  }
  async function removeCompetitionTeam(id: string) { if (db) { await db.competitionTeams.delete(id); await load() } }
  function beginSeasonEdit(season: Season) { setEditingSeasonId(season.id); setEditSeasonName(season.name) }
  async function saveSeasonEdit() { if (!db || !editingSeasonId || !editSeasonName.trim()) return; const current = await db.seasons.get(editingSeasonId); if (!current) return; await db.seasons.put({ ...current, name: editSeasonName.trim() }); setEditingSeasonId(null); await load() }
  function beginCompetitionEdit(competition: Competition) { setEditingCompetitionId(competition.id); setEditCompetitionName(competition.name); setEditCompetitionSeasonId(competition.seasonId) }
  async function saveCompetitionEdit() { if (!db || !editingCompetitionId || !editCompetitionName.trim() || !editCompetitionSeasonId) return; const current = await db.competitions.get(editingCompetitionId); if (!current) return; await db.competitions.put({ ...current, name: editCompetitionName.trim(), seasonId: editCompetitionSeasonId }); await db.competitionTeams.where('competitionId').equals(editingCompetitionId).modify({ seasonId: editCompetitionSeasonId }); setEditingCompetitionId(null); await load() }
  async function removeSeason(id: string) { if (!db || !window.confirm('Apagar esta época?')) return; const related = await db.competitions.where('seasonId').equals(id).toArray(); if (related.length) { const ids = related.map(c => c.id); await db.competitionTeams.where('seasonId').equals(id).delete(); await db.competitions.bulkDelete(ids) } await db.seasons.delete(id); await load() }
  async function removeCompetition(id: string) { if (db && window.confirm('Apagar esta competição?')) { await db.competitionTeams.where('competitionId').equals(id).delete(); await db.competitions.delete(id); await load() } }

  return <main className="content standalonePage">
    <header className="topbar"><div><p className="eyebrow">PLANEAMENTO</p><h1>Épocas & Competições</h1><p>Temporadas, competições e participantes guardados localmente.</p></div></header>
    <section className="section">
      <form onSubmit={addSeason} className="localForm"><input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: 2026/27" required /><button type="submit"><Plus size={17}/> Criar época</button></form>
      <form onSubmit={addCompetition} className="localForm" style={{ marginTop: 12 }}><select value={competitionSeasonId} onChange={e => setCompetitionSeasonId(e.target.value)} required aria-label="Época da competição"><option value="">Época</option>{seasons.map(season => <option key={season.id} value={season.id}>{season.name}</option>)}</select><input value={competitionName} onChange={e => setCompetitionName(e.target.value)} placeholder="Nome da competição" required /><button type="submit"><Trophy size={17}/> Criar competição</button></form>
      <div className="localList">
        {seasons.length === 0 && <div className="emptyState"><CalendarRange size={30}/><strong>Nenhuma época criada</strong><span>Cria primeiro uma época e depois associa-lhe competições.</span></div>}
        {seasons.map(season => <article className="localRow" key={season.id}>
          {editingSeasonId === season.id ? <><input value={editSeasonName} onChange={e => setEditSeasonName(e.target.value)} aria-label="Nome da época"/><button className="iconButton" onClick={() => void saveSeasonEdit()} aria-label="Guardar época"><Check size={17}/></button><button className="iconButton" onClick={() => setEditingSeasonId(null)} aria-label="Cancelar"><X size={17}/></button></> : <><div style={{ flex: 1 }}><strong>{season.name}</strong><span>{season.active ? 'Ativa' : 'Concluída'}</span>{(competitionsBySeason.get(season.id) ?? []).map(competition => <div key={competition.id} style={{ marginTop: 8 }}><small style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🏆 {competition.name}<button type="button" className="iconButton" onClick={() => beginCompetitionEdit(competition)} aria-label={`Editar ${competition.name}`}><Pencil size={14}/></button><button type="button" className="iconButton" onClick={() => removeCompetition(competition.id)} aria-label={`Apagar ${competition.name}`}><Trash2 size={14}/></button></small><div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:5}}>{teamsByCompetition(competition.id).map(team => { const relation = competitionTeams.find(item => item.competitionId === competition.id && item.teamId === team.id); return <span key={team.id} className="tag">{team.name}{relation && <button type="button" className="iconButton" onClick={() => void removeCompetitionTeam(relation.id)} aria-label={`Remover ${team.name} da competição`}>×</button>}</span> })}</div></div>)}</div><button className="iconButton" onClick={() => beginSeasonEdit(season)} aria-label={`Editar época ${season.name}`}><Pencil size={17}/></button><button className="iconButton" onClick={() => void removeSeason(season.id)} aria-label={`Apagar época ${season.name}`}><Trash2 size={17}/></button></>}
        </article>)}
      </div>
    </section>
    <section className="section"><div className="sectionHeader"><div><p className="eyebrow">CAMPEONATO</p><h2><Users size={20}/> Equipas participantes</h2><p>Associa equipas já criadas a uma competição. Estas associações serão usadas para validar jogos e analisar tendências do campeonato.</p></div></div><form onSubmit={addCompetitionTeam} className="localForm"><select value={associationCompetitionId} onChange={e => { setAssociationCompetitionId(e.target.value); setAssociationTeamId('') }} aria-label="Competição"><option value="">Competição</option>{competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={associationTeamId} onChange={e => setAssociationTeamId(e.target.value)} aria-label="Equipa"><option value="">Equipa criada</option>{teams.filter(team => !competitionTeams.some(item => item.competitionId === associationCompetitionId && item.teamId === team.id)).map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select><button type="submit" disabled={!associationCompetitionId || !associationTeamId}><Plus size={17}/> Associar equipa</button></form></section>
    <section className="section"><div className="sectionHeader"><div><p className="eyebrow">PERFORMANCE</p><h2><BarChart3 size={20}/> Estatísticas da época</h2><p>Seleciona a época e a equipa para consultar o acumulado individual.</p></div></div><div className="localForm"><select value={statsSeasonId} onChange={e => setStatsSeasonId(e.target.value)} aria-label="Época das estatísticas"><option value="">Época</option>{seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select value={statsTeamId} onChange={e => setStatsTeamId(e.target.value)} aria-label="Equipa das estatísticas"><option value="">Equipa</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>{statsSeasonId && statsTeamId ? <PlayerStatsView seasonId={statsSeasonId} teamId={statsTeamId} /> : <div className="emptyState"><strong>Seleciona uma época e uma equipa</strong></div>}</section>
  </main>
}
