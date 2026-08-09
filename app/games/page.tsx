'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Swords } from 'lucide-react'
import { db } from '../../src/lib/storage/db'
import { createId } from '../../src/lib/storage/id'
import type { Match } from '../../src/lib/storage/types'
import '../dashboard.css'

export default function GamesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [opponent, setOpponent] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  async function load() { if (db) setMatches(await db.matches.orderBy('date').reverse().toArray()) }
  useEffect(() => { load() }, [])
  async function add(e: React.FormEvent) { e.preventDefault(); if (!db || !opponent.trim() || !date) return; await db.matches.add({ id: createId(), seasonId: 'local-season', teamId: 'local-team', opponentName: opponent.trim(), date, venue: venue.trim(), homeAway: 'HOME', status: 'PLANNED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); setOpponent(''); setDate(''); setVenue(''); await load() }
  async function remove(id: string) { if (db && window.confirm('Apagar este jogo?')) { await db.matches.delete(id); await load() } }
  return <main className="content standalonePage"><header className="topbar"><div><p className="eyebrow">CALENDÁRIO</p><h1>Jogos</h1></div></header><section className="section"><form onSubmit={add} className="localForm"><input value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="Adversário"/><input value={date} onChange={e => setDate(e.target.value)} type="datetime-local"/><input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Pavilhão / local"/><button><Plus size={17}/> Criar jogo</button></form><div className="localList">{matches.length === 0 && <div className="emptyState"><Swords size={30}/><strong>Nenhum jogo</strong><span>Cria o primeiro jogo para começar a organizar a época.</span></div>}{matches.map(m => <article className="localRow" key={m.id}><div><strong>SPS vs {m.opponentName}</strong><span>{new Date(m.date).toLocaleString('pt-PT')} · {m.venue || 'Local por definir'}</span></div><button className="iconButton" onClick={() => remove(m.id)}><Trash2 size={17}/></button></article>)}</div></section></main>
}
