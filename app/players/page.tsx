'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, UserRound } from 'lucide-react'
import { db } from '../../src/lib/storage/db'
import { createId } from '../../src/lib/storage/id'
import type { Player, Position } from '../../src/lib/storage/types'
import '../dashboard.css'

const positions: Position[] = ['GR', 'PE', 'LE', 'CE', 'LD', 'PD', 'PIV']

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [position, setPosition] = useState<Position>('LE')
  const [shirtNumber, setShirtNumber] = useState('')

  async function load() { if (db) setPlayers(await db.players.orderBy('lastName').toArray()) }
  useEffect(() => { load() }, [])

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault(); if (!db || !firstName.trim() || !lastName.trim()) return
    const now = new Date().toISOString()
    await db.players.add({ id: createId(), firstName: firstName.trim(), lastName: lastName.trim(), displayName: `${firstName.trim()} ${lastName.trim()}`, position, shirtNumber: shirtNumber ? Number(shirtNumber) : undefined, active: true, createdAt: now, updatedAt: now })
    setFirstName(''); setLastName(''); setShirtNumber(''); await load()
  }

  async function remove(id: string) { if (db && window.confirm('Apagar esta atleta?')) { await db.players.delete(id); await load() } }

  return <main className="content standalonePage"><header className="topbar"><div><p className="eyebrow">PLANTEL</p><h1>Jogadores</h1></div></header><section className="section">
    <form onSubmit={addPlayer} className="localForm"><input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome"/><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Apelido / último nome"/><input value={shirtNumber} onChange={e => setShirtNumber(e.target.value)} placeholder="#" type="number"/><select value={position} onChange={e => setPosition(e.target.value as Position)}>{positions.map(p => <option key={p}>{p}</option>)}</select><button><Plus size={17}/> Adicionar</button></form>
    <div className="localList">{players.length === 0 && <div className="emptyState"><UserRound size={30}/><strong>Plantel vazio</strong><span>Adiciona a primeira atleta acima.</span></div>}{players.map(p => <article className="localRow" key={p.id}><div><strong>{p.shirtNumber ? `#${p.shirtNumber} ` : ''}{p.displayName}</strong><span>{p.position ?? 'Sem posição'}</span></div><button className="iconButton" onClick={() => remove(p.id)}><Trash2 size={17}/></button></article>)}</div>
  </section></main>
}
