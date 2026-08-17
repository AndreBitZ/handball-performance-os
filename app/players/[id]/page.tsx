'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Save, Trash2, UserRound } from 'lucide-react'
import { db } from '../../../src/lib/storage/db'
import type { Player, PlayerTeamSeason, Position, Season, Team } from '../../../src/lib/storage/types'
import '../../dashboard.css'

const positions: Position[] = ['GR', 'PE', 'LE', 'CE', 'LD', 'PD', 'PIV']

export default function PlayerDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id
  const [player, setPlayer] = useState<Player | null>(null)
  const [relations, setRelations] = useState<PlayerTeamSeason[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const database = db
    if (!database) return
    setLoading(true)
    setError('')
    const [nextPlayer, nextRelations, nextTeams, nextSeasons] = await Promise.all([
      database.players.get(id),
      database.playerTeamSeasons.where('playerId').equals(id).toArray(),
      database.teams.orderBy('name').toArray(),
      database.seasons.orderBy('name').reverse().toArray(),
    ])
    setPlayer(nextPlayer ?? null)
    setRelations(nextRelations)
    setTeams(nextTeams)
    setSeasons(nextSeasons)
    setLoading(false)
  }

  useEffect(() => { void load() }, [id])

  function update<K extends keyof Player>(key: K, value: Player[K]) {
    setPlayer(current => current ? { ...current, [key]: value } : current)
  }

  async function save() {
    const database = db
    if (!database || !player) return
    if (!player.firstName.trim() || !player.lastName.trim()) {
      setError('Nome e apelido são obrigatórios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await database.players.update(player.id, {
        firstName: player.firstName.trim(),
        lastName: player.lastName.trim(),
        displayName: `${player.firstName.trim()} ${player.lastName.trim()}`,
        birthDate: player.birthDate || undefined,
        shirtNumber: player.shirtNumber,
        position: player.position,
        hand: player.hand,
        active: player.active,
        updatedAt: new Date().toISOString(),
      })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível guardar a atleta.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    const database = db
    if (!database || !player || !window.confirm(`Apagar ${player.displayName}? Esta ação remove também as ligações a equipas e épocas.`)) return
    await database.transaction('rw', [database.players, database.playerTeamSeasons], async () => {
      await database.players.delete(player.id)
      const linked = await database.playerTeamSeasons.where('playerId').equals(player.id).toArray()
      if (linked.length) await database.playerTeamSeasons.bulkDelete(linked.map(item => item.id))
    })
    router.push('/players')
  }

  if (loading) return <main className="content standalonePage"><p>A carregar atleta…</p></main>
  if (!player) return <main className="content standalonePage"><p>Atleta não encontrada.</p><Link href="/players">Voltar aos jogadores</Link></main>

  return <main className="content standalonePage">
    <header className="topbar">
      <div>
        <Link href="/players" className="backLink"><ArrowLeft size={16} /> Jogadores</Link>
        <p className="eyebrow">FICHA DE ATLETA</p>
        <h1>{player.displayName}</h1>
        <p>Dados pessoais, perfil desportivo e histórico de ligação ao plantel.</p>
      </div>
      <div className="topbarActions">
        <button onClick={() => void save()} disabled={saving}><Save size={17} /> {saving ? 'A guardar…' : 'Guardar'}</button>
        <button className="dangerButton" onClick={() => void remove()}><Trash2 size={17} /> Apagar</button>
      </div>
    </header>

    {error && <div className="errorState">{error}</div>}

    <section className="section">
      <div className="sectionHeader"><div><h2>Perfil</h2><p>Informação base da atleta.</p></div><UserRound size={24} /></div>
      <div className="localForm">
        <label>Nome<input value={player.firstName} onChange={e => update('firstName', e.target.value)} /></label>
        <label>Apelido<input value={player.lastName} onChange={e => update('lastName', e.target.value)} /></label>
        <label>Data de nascimento<input type="date" value={player.birthDate ?? ''} onChange={e => update('birthDate', e.target.value || undefined)} /></label>
        <label>Número<input type="number" min="1" max="99" value={player.shirtNumber ?? ''} onChange={e => update('shirtNumber', e.target.value ? Number(e.target.value) : undefined)} /></label>
        <label>Posição<select value={player.position ?? ''} onChange={e => update('position', e.target.value ? e.target.value as Position : undefined)}><option value="">Sem posição</option>{positions.map(position => <option key={position}>{position}</option>)}</select></label>
        <label>Mão dominante<select value={player.hand ?? ''} onChange={e => update('hand', e.target.value ? e.target.value as Player['hand'] : undefined)}><option value="">Não definida</option><option value="RIGHT">Direita</option><option value="LEFT">Esquerda</option><option value="BOTH">Ambas</option></select></label>
        <label className="checkboxLabel"><input type="checkbox" checked={player.active} onChange={e => update('active', e.target.checked)} /> Atleta ativa</label>
      </div>
    </section>

    <section className="section">
      <div className="sectionHeader"><div><h2>Equipas e épocas</h2><p>Ligações atualmente registadas.</p></div></div>
      <div className="localList">
        {relations.length === 0 && <div className="emptyState"><strong>Sem ligações</strong><span>Esta atleta ainda não está associada a uma equipa/época.</span></div>}
        {relations.map(relation => {
          const team = teams.find(item => item.id === relation.teamId)
          const season = seasons.find(item => item.id === relation.seasonId)
          return <div className="localRow" key={relation.id}><strong>{team?.name ?? 'Equipa desconhecida'}</strong><span>{season?.name ?? 'Época desconhecida'} · {relation.position ?? 'Sem posição'}{relation.shirtNumber ? ` · #${relation.shirtNumber}` : ''}</span></div>
        })}
      </div>
    </section>
  </main>
}
