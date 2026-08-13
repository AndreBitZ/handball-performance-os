'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Plus, Trash2, Users } from 'lucide-react'
import { db } from '../../src/lib/storage/db'
import { createId } from '../../src/lib/storage/id'
import type { Team } from '../../src/lib/storage/types'
import '../dashboard.css'

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Seniores')
  const [gender, setGender] = useState<Team['gender']>('F')
  async function load() { if (db) setTeams(await db.teams.orderBy('name').toArray()) }
  useEffect(() => { void load() }, [])
  async function addTeam(e: React.FormEvent) { e.preventDefault(); if (!db || !name.trim()) return; const now = new Date().toISOString(); await db.teams.add({ id: createId(), clubId: 'local-club', name: name.trim(), category, gender, active: true, createdAt: now, updatedAt: now }); setName(''); await load() }
  async function remove(id: string) { if (!db || !window.confirm('Apagar esta equipa?')) return; await db.teams.delete(id); await load() }
  return <main className="content standalonePage"><header className="topbar"><div><p className="eyebrow">GESTÃO</p><h1>Equipas</h1></div></header><section className="section"><form onSubmit={addTeam} className="localForm"><input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da equipa"/><input value={category} onChange={e => setCategory(e.target.value)} placeholder="Categoria"/><select value={gender} onChange={e => setGender(e.target.value as Team['gender'])}><option value="F">Feminino</option><option value="M">Masculino</option><option value="MIXED">Misto</option></select><button type="submit"><Plus size={17}/> Criar equipa</button></form><div className="localList">{teams.length === 0 && <div className="emptyState"><Users size={30}/><strong>Ainda não existem equipas</strong><span>Cria a primeira equipa acima.</span></div>}{teams.map(team => <div className="localRow" key={team.id}><Link href={`/teams/${team.id}`} style={{ flex: 1 }}><strong>{team.name}</strong><span>{team.category} · {team.gender === 'F' ? 'Feminino' : team.gender === 'M' ? 'Masculino' : 'Misto'}</span></Link><button className="iconButton" onClick={() => void remove(team.id)} aria-label={`Apagar ${team.name}`}><Trash2 size={17}/></button></div>)}</div></section></main>
}
