'use client'

import { useEffect, useState } from 'react'
import { db } from '../../../src/lib/storage/db'
import type { MatchEvent, Player, Match } from '../../../src/lib/storage/types'
import MatchReport from '../report'

export default function MatchReportPage() {
  const [match, setMatch] = useState<Match | null>(null)
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      if (!db) return
      const id = new URLSearchParams(window.location.search).get('matchId')
      if (!id) { setError('Indica o jogo através de ?matchId=...'); return }
      const database = db
      const found = await database.matches.get(id)
      if (!found) { setError('Jogo não encontrado.'); return }
      const [ev, p] = await Promise.all([
        database.events.where('matchId').equals(id).sortBy('timestampSeconds'),
        database.players.toArray(),
      ])
      setMatch(found)
      setEvents(ev)
      setPlayers(p)
    }
    void load()
  }, [])

  if (error) return <main className="content standalonePage"><section className="section"><h1>Relatório do jogo</h1><p>{error}</p></section></main>
  if (!match) return <main className="content standalonePage"><section className="section"><p>A carregar relatório…</p></section></main>

  return <main className="content standalonePage"><MatchReport events={events} players={players} teamName="Equipa" opponentName={match.opponentName} /></main>
}
