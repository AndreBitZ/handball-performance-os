'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Plus, Trash2, UserRound } from 'lucide-react'
import { db } from '../../src/lib/storage/db'
import { createId } from '../../src/lib/storage/id'
import type { Player, Position, Season, Team } from '../../src/lib/storage/types'
import '../dashboard.css'

const positions: Position[] = ['GR', 'PE', 'LE', 'CE', 'LD', 'PD', 'PIV']

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [position, setPosition] = useState<Position>('LE')
  const [shirtNumber, setShirtNumber] = useState('')
  const [teamId, setTeamId] = useState('')
  const [seasonId, setSeasonId] = useState('')

  async function load() {
    if (!db) return
    const [nextPlayers, nextTeams, nextSeasons] = await Promise.all([
      db.players.orderBy('lastName').toArray(),
      db.teams.orderBy('name').toArray(),
      db.seasons.orderBy('name').reverse().toArray(),
    ])
    setPlayers(nextPlayers)
    setTeams(nextTeams)
    setSeasons(nextSeasons)
    setTeamId(current => current || nextTeams[0]?.id || '')
    setSeasonId(current => current || nextSeasons[0]?.id || '')
  }

  useEffect(() => { void load() }, [])

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault()
    if (!db || !firstName.trim() || !lastName.trim()) return
    const now = new Date().toISOString()
    const playerId = createId()
    const number = shirtNumber ? Number(shirtNumber) : undefined

    await db.transaction('rw', [db.players, db.playerTeamSeasons], async () => {
      await db.players.add({
        id: playerId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        position,
        shirtNumber: number,
        active: true,
        createdAt: now,
        updatedAt: now,
      })

      if (teamId && seasonId) {
        await db.playerTeamSeasons.add({
          id: createId(),
          playerId,
          teamId,
          seasonId,
          shirtNumber: number,
          position,
        })
      }
    })

    setFirstName('')
    setLastName('')
    setShirtNumber('')
    await load()
  }

  async function remove(id: string) {
    if (!db || !window.confirm('Apagar esta atleta?')) return
    await db.transaction('rw', [db.players, db.playerTeamSeasons], async () => {
      await db.players.delete(id)
      const relations = await db.playerTeamSeasons.where('playerId').equals(id).toArray()
      if (relations.length) await db.playerTeamSeasons.bulkDelete(relations.map(relation => relation.id))
    })
    await load()
  }

  return <main className="content standalonePage">
    <header className="topbar"><div><p className="eyebrow">PLANTEL</p><h1>Jogadores</h1><p>Plantel e ligação à equipa/época guardados localmente.</p></div></header>
    <section className="section">
      <form onSubmit={addPlayer} className="localForm">
        <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" required />
        <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Apelido / último nome" required />
        <input value={shirtNumber} onChange={e => setShirtNumber(e.target.value)} placeholder="#" type="number" min="1" max="99" />
        <select value={position} onChange={e => setPosition(e.target.value as Position)} aria-label="Posição">{positions.map(p => <option key={p}>{p}</option>)}</select>
        <select value={teamId} onChange={e => setTeamId(e.target.value)} aria-label="Equipa"><option value="">Sem equipa</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
        <select value={seasonId} onChange={e => setSeasonId(e.target.value)} aria-label="Época"><option value="">Sem época</option>{seasons.map(season => <option key={season.id} value={season.id}>{season.name}</option>)}</select>
        <button type="submit"><Plus size={17} /> Adicionar</button>
      </form>
      <div className="localList">
        {players.length === 0 && <div className="emptyState"><UserRound size={30} /><strong>Plantel vazio</strong><span>Adiciona a primeira atleta acima.</span></div>}
        {players.map(player => <div className="localRow" key={player.id}>
          <Link href={`/players/${player.id}`} style={{ flex: 1 }}><strong>{player.shirtNumber ? `#${player.shirtNumber} ` : ''}{player.displayName}</strong><span>{player.position ?? 'Sem posição'}</span></Link>
          <button className="iconButton" onClick={() => void remove(player.id)} aria-label={`Apagar ${player.displayName}`}><Trash2 size={17} /></button>
        </div>)}
      </div>
    </section>
  </main>
}
