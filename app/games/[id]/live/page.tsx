'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react'
import LiveCoding, { type LiveCodingEvent } from '../../live-coding'
import { db } from '../../../../src/lib/storage/db'
import type { Match, MatchSquad, Player } from '../../../../src/lib/storage/types'

const HALF_SECONDS = 30 * 60

type PlayerWithSquad = Player & Pick<MatchSquad, 'shirtNumber' | 'position' | 'starter'>

export default function LiveMatchPage({ params }: { params: { id: string } }) {
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<PlayerWithSquad[]>([])
  const [period, setPeriod] = useState<1 | 2>(1)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      if (!db) return
      const current = await db.matches.get(params.id)
      if (!current) return
      const squad = await db.matchSquads.where('matchId').equals(params.id).toArray()
      const ids = squad.map(item => item.playerId)
      const loadedPlayers = ids.length ? await db.players.where('id').anyOf(ids).toArray() : []
      const byId = new Map(loadedPlayers.map(player => [player.id, player]))
      if (!active) return
      const mappedPlayers: PlayerWithSquad[] = squad.flatMap(item => {
        const player = byId.get(item.playerId)
        return player ? [{ ...player, shirtNumber: item.shirtNumber ?? player.shirtNumber, position: item.position ?? player.position, starter: item.starter }] : []
      }).sort((a, b) => (a.shirtNumber ?? 999) - (b.shirtNumber ?? 999))
      setMatch(current)
      setPlayers(mappedPlayers)
      setSavedCount(await db.events.where('matchId').equals(params.id).count())
    }
    void load()
    return () => { active = false }
  }, [params.id])

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setSeconds(value => {
        if (value >= HALF_SECONDS) {
          setRunning(false)
          return HALF_SECONDS
        }
        return value + 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  const displayTime = useMemo(() => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`, [seconds])

  async function handleEvent(event: LiveCodingEvent) {
    if (!db) return
    setError(null)
    try {
      await db.events.add({ id: event.id, matchId: params.id, timestampSeconds: event.timestampSeconds, type: event.action, playerId: event.playerId, createdAt: new Date().toISOString() })
      setSavedCount(value => value + 1)
    } catch {
      setError('Não foi possível guardar o evento.')
    }
  }

  if (!match) return <main className="content standalonePage"><p>A carregar jogo…</p></main>

  return <main className="content standalonePage">
    <header className="topbar">
      <div>
        <Link href={`/games/${match.id}`} className="navItem" style={{ display: 'inline-flex', padding: 0, marginBottom: 12 }}><ArrowLeft size={16}/> Jogo</Link>
        <p className="eyebrow">LIVE MATCH</p>
        <h1>{match.opponentName}</h1>
        <p>{period}.ª parte · {savedCount} eventos guardados</p>
      </div>
      <div className="heroBadge" aria-live="polite">{displayTime}</div>
    </header>

    <section className="hero">
      <div><p className="eyebrow">CRONÓMETRO</p><h2>{period}.ª parte</h2><p>O evento fica gravado localmente com o segundo exato.</p></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button onClick={() => setRunning(value => !value)}>{running ? <Pause size={16}/> : <Play size={16}/>} {running ? 'Pausar' : 'Iniciar'}</button>
        <button onClick={() => { setRunning(false); setSeconds(0) }}><RotateCcw size={16}/> Reiniciar</button>
        <button onClick={() => { setRunning(false); setPeriod(value => value === 1 ? 2 : 1); setSeconds(0) }} disabled={seconds < HALF_SECONDS}>Iniciar {period === 1 ? '2.ª' : '1.ª'} parte</button>
      </div>
    </section>

    {error && <p role="alert" style={{ color: 'crimson', marginTop: 12 }}>{error}</p>}
    <LiveCoding players={players} period={period} timestampSeconds={period === 1 ? seconds : HALF_SECONDS + seconds} onEvent={handleEvent} />
    {!players.length && <section className="section"><p>Este jogo ainda não tem convocados. Adiciona jogadores ao jogo antes de fazer live coding.</p></section>}
  </main>
}
