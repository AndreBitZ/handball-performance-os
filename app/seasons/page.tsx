'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, CalendarRange, Trophy, BarChart3 } from 'lucide-react'
import { db } from '../../src/lib/storage/db'
import { createId } from '../../src/lib/storage/id'
import type { Competition, Season, Team } from '../../src/lib/storage/types'
import PlayerStatsView from './player-stats-view'
import '../dashboard.css'

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [teams, setTeams] = useState<Team[]>([])
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

  async function load() {
    if (!db) return
    const [nextSeasons, nextCompetitions, nextTeams] = await Promise.all([
      db.seasons.orderBy('name').reverse().toArray(),
      db.competitions.orderBy('name').toArray(),
      db.teams.orderBy('name').toArray(),
    ])
    setSeasons(nextSeasons); setCompetitions(nextCompetitions); setTeams(nextTeams)
    if (!competitionSeasonId && nextSeasons[0]) setCompetitionSeasonId(nextSeasons[0].id)
    if (!statsSeasonId && nextSeasons[0]) setStatsSeasonId(nextSeasons[0].id)
    if (!statsTeamId && nextTeams[0]) setStatsTeamId(nextTeams[0].id)
  }
  useEffect(() => { void load() }, [])
  const competitionsBySeason = useMemo(() => {
    const result = new Map<string, Competition[]>()
    for (const competition of competitions) { const list = result.get(competition.seasonId) ?? []; list.push(competition); result.set(competition.seasonId, list) }
    return result
  }, [competitions])
  async function addSeason(e: React.FormEvent) { e.preventDefault(); if (!db || !name.trim()) return; await db.seasons.add({ id: createId(), name: name.trim(), active: true }); setName(''); await load() }
  async function addCompetition(e: React.FormEvent) { e.preventDefault(); if (!db || !competitionName.trim() || !competitionSeasonId) return; await db.competitions.add({ id: createId(), name: competitionName.trim(), seasonId: competitionSeasonId }); setCompetitionName(''); await load() }
  function beginSeasonEdit(season: Season) { setEditingSeasonId(season.id); setEditSeasonName(season.name) }
  async function saveSeasonEdit() { if (!db || !editingSeasonId || !editSeasonName.trim()) return; const current = await db.seasons.get(editingSeasonId); if (!current) return; await db.seasons.put({ ...current, name: editSeasonName.trim() }); setEditingSeasonId(null); await load() }
  function beginCompetitionEdit(competition: Competition) { setEditingCompetitionId(competition.id); setEditCompetitionName(competition.name); setEditCompetitionSeasonId(competition.seasonId) }
  async function saveCompetitionEdit() { if (!db || !editingCompetitionId || !editCompetitionName.trim() || !editCompetitionSeasonId) return; const current = await db.competitions.get(editingCompetitionId); if (!current) return; await db.competitions.put({ ...current, name: editCompetitionName.trim(), seasonId: editCompetitionSeasonId }); setEditingCompetitionId(null); await load() }
  async function removeSeason(id: string) { if (!db || !window.confirm('Apagar esta época?')) return; await db.seasons.delete(id); const related = await db.competitions.where('seasonId').equals(id).toArray(); if (related.length) await db.competitions.bulkDelete(related.map(c => c.id)); await load() }
  async function removeCompetition(id: string) { if (db && window.confirm('Apagar esta competição?')) { await db.competitions.delete(id); await load() } }

  return <main className="content standalonePage">
    <header className="topbar"><div><p className="eyebrow">PLANEAMENTO</p><h1>Épocas & Competições</h1><p>Temporadas e competições guardadas localmente.</p></div></header>
    <section className="section">
      <form onSubmit={addSeason} className="localForm"><input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: 2026/27" required /><button type="submit"><Plus size={17}/> Criar época</button></form>
      <form onSubmit={addCompetition} className="localForm" style={{ marginTop: 12 }}><select value={competitionSeasonId} onChange={e => setCompetitionSeasonId(e.target.value)} required aria-label="Época da competição"><option value="">Época</option>{seasons.map(season => <option key={season.id} value={season.id}>{season.name}</option>)}</select><input value={competitionName} onChange={e => setCompetitionName(e.target.value)} placeholder="Nome da competição" required /><button type="submit"><Trophy size={17}/> Criar competição</button></form>
      <div className="localList">
        {seasons.length === 0 && <div className="emptyState"><CalendarRange size={30}/><strong>Nenhuma época criada</strong><span>Cria primeiro uma época e depois associa-lhe competições.</span></div>}
        {seasons.map(season => <article className="localRow" key={season.id}>
          {editingSeasonId === season.id ? <><input value={editSeasonName} onChange={e => setEditSeasonName(e.target.value)} aria-label="Nome da época"/><button className="iconButton" onClick={() => void saveSeasonEdit()} aria-label="Guardar época"><Check size={17}/></button><button className="iconButton" onClick={() => setEditingSeasonId(null)} aria-label="Cancelar"><X size={17}/></button></> : <><div style={{ flex: 1 }}><strong>{season.name}</strong><span>{season.active ? 'Ativa' : 'Concluída'}</span>{(competitionsBySeason.get(season.id) ?? []).map(competition => editingCompetitionId === competition.id ? <small key={competition.id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}><input value={editCompetitionName} onChange={e => setEditCompetitionName(e.target.value)} aria-label="Nome da competição"/><select value={editCompetitionSeasonId} onChange={e => setEditCompetitionSeasonId(e.target.value)} aria-label="Época da competição">{seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button className="iconButton" onClick={() => void saveCompetitionEdit()} aria-label="Guardar competição"><Check size={14}/></button><button className="iconButton" onClick={() => setEditingCompetitionId(null)} aria-label="Cancelar"><X size={14}/></button></small> : <small key={competition.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>🏆 {competition.name}<button type="button" className="iconButton" onClick={() => beginCompetitionEdit(competition)} aria-label={`Editar ${competition.name}`}><Pencil size={14}/></button><button type="button" className="iconButton" onClick={() => removeCompetition(competition.id)} aria-label={`Apagar ${competition.name}`}><Trash2 size={14}/></button></small>)}</div><button className="iconButton" onClick={() => beginSeasonEdit(season)} aria-label={`Editar época ${season.name}`}><Pencil size={17}/></button><button className="iconButton" onClick={() => void removeSeason(season.id)} aria-label={`Apagar época ${season.name}`}><Trash2 size={17}/></button></>}
        </article>)}
      </div>
    </section>
    <section className="section"><div className="sectionHeader"><div><p className="eyebrow">PERFORMANCE</p><h2><BarChart3 size={20}/> Estatísticas da época</h2><p>Seleciona a época e a equipa para consultar o acumulado individual.</p></div></div><div className="localForm"><select value={statsSeasonId} onChange={e => setStatsSeasonId(e.target.value)} aria-label="Época das estatísticas"><option value="">Época</option>{seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select value={statsTeamId} onChange={e => setStatsTeamId(e.target.value)} aria-label="Equipa das estatísticas"><option value="">Equipa</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>{statsSeasonId && statsTeamId ? <PlayerStatsView seasonId={statsSeasonId} teamId={statsTeamId} /> : <div className="emptyState"><strong>Seleciona uma época e uma equipa</strong></div>}</section>
  </main>
}
