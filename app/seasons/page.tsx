'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, CalendarRange } from 'lucide-react'
import { db } from '../../src/lib/storage/db'
import { createId } from '../../src/lib/storage/id'
import type { Season } from '../../src/lib/storage/types'
import '../dashboard.css'

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [name, setName] = useState('2026/27')
  async function load() { if (db) setSeasons(await db.seasons.orderBy('name').reverse().toArray()) }
  useEffect(() => { load() }, [])
  async function add(e: React.FormEvent) { e.preventDefault(); if (!db || !name.trim()) return; await db.seasons.add({ id: createId(), name: name.trim(), active: true }); setName(''); await load() }
  async function remove(id: string) { if (db && window.confirm('Apagar esta época?')) { await db.seasons.delete(id); await load() } }
  return <main className="content standalonePage"><header className="topbar"><div><p className="eyebrow">PLANEAMENTO</p><h1>Épocas</h1></div></header><section className="section"><form onSubmit={add} className="localForm"><input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: 2026/27"/><button><Plus size={17}/> Criar época</button></form><div className="localList">{seasons.length === 0 && <div className="emptyState"><CalendarRange size={30}/><strong>Nenhuma época criada</strong></div>}{seasons.map(s => <article className="localRow" key={s.id}><div><strong>{s.name}</strong><span>{s.active ? 'Ativa' : 'Concluída'}</span></div><button className="iconButton" onClick={() => remove(s.id)}><Trash2 size={17}/></button></article>)}</div></section></main>
}
