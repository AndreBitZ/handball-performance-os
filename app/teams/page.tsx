'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Users } from 'lucide-react'
import { db } from '../../src/lib/storage/db'
import { createId } from '../../src/lib/storage/id'
import type { Club, Team } from '../../src/lib/storage/types'
import '../dashboard.css'

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Seniores')
  const [gender, setGender] = useState<Team['gender']>('F')
  const [clubId, setClubId] = useState('')
  const [clubName, setClubName] = useState('')
  const [error, setError] = useState('')

  async function load() {
    if (!db) return
    const [nextTeams, nextClubs] = await Promise.all([
      db.teams.orderBy('name').toArray(),
      db.clubs.orderBy('name').toArray(),
    ])
    setTeams(nextTeams)
    setClubs(nextClubs)
    setClubId(current => current || nextClubs[0]?.id || '')
  }

  useEffect(() => { void load() }, [])

  async function addClub(e: React.FormEvent) {
    e.preventDefault()
    if (!db || !clubName.trim()) return
    const now = new Date().toISOString()
    const id = createId()
    await db.clubs.add({ id, name: clubName.trim(), createdAt: now, updatedAt: now })
    setClubName('')
    setClubId(id)
    await load()
  }

  async function addTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!db || !name.trim()) return
    if (!clubId) {
      setError('Cria ou seleciona um clube antes de criar a equipa.')
      return
    }
    setError('')
    const now = new Date().toISOString()
    await db.teams.add({ id: createId(), clubId, name: name.trim(), category, gender, active: true, createdAt: now, updatedAt: now })
    setName('')
    await load()
  }

  async function remove(id: string) {
    if (!db || !window.confirm('Apagar esta equipa?')) return
    await db.teams.delete(id)
    await load()
  }

  const clubNames = new Map(clubs.map(club => [club.id, club.name]))

  return <main className="content standalonePage">
    <header className="topbar"><div><p className="eyebrow">GESTÃO</p><h1>Equipas</h1></div></header>
    <section className="section">
      <div className="sectionHeader"><div><p className="eyebrow">ESTRUTURA</p><h3>Clube e equipas</h3></div><span className="status">{teams.length} equipas</span></div>
      <form onSubmit={addClub} className="localForm">
        <input value={clubName} onChange={e => setClubName(e.target.value)} placeholder="Nome do clube" aria-label="Nome do clube" />
        <button type="submit"><Plus size={17}/> Criar clube</button>
      </form>
      <form onSubmit={addTeam} className="localForm">
        <select value={clubId} onChange={e => setClubId(e.target.value)} aria-label="Clube">
          <option value="">Selecionar clube</option>
          {clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
        </select>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da equipa" required />
        <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Categoria" />
        <select value={gender} onChange={e => setGender(e.target.value as Team['gender'])}><option value="F">Feminino</option><option value="M">Masculino</option><option value="MIXED">Misto</option></select>
        <button type="submit"><Plus size={17}/> Criar equipa</button>
      </form>
      {error && <p className="status" role="alert">{error}</p>}
      <div className="localList">
        {teams.length === 0 && <div className="emptyState"><Users size={30}/><strong>Ainda não existem equipas</strong><span>Cria o clube e a primeira equipa acima.</span></div>}
        {teams.map(team => <div className="localRow" key={team.id}><Link href={`/teams/${team.id}`} style={{ flex: 1 }}><strong>{team.name}</strong><span>{clubNames.get(team.clubId) ?? 'Clube desconhecido'} · {team.category} · {team.gender === 'F' ? 'Feminino' : team.gender === 'M' ? 'Masculino' : 'Misto'}</span></Link><button className="iconButton" onClick={() => void remove(team.id)} aria-label={`Apagar ${team.name}`}><Trash2 size={17}/></button></div>)}
      </div>
    </section>
  </main>
}
