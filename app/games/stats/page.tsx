'use client'

import { useEffect, useMemo, useState } from 'react'
import { db } from '../../../src/lib/storage/db'
import type { Match, MatchEvent, Player } from '../../../src/lib/storage/types'
import { deriveMatchStats } from '../../../src/lib/analytics/matchStats'

export default function MatchStatsPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [matchId, setMatchId] = useState('')
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const match = matches.find(m => m.id === matchId)

  useEffect(() => {
    if (!db) return
    const database = db
    void database.matches.orderBy('date').reverse().toArray().then(setMatches)
    void database.players.orderBy('displayName').toArray().then(setPlayers)
  }, [])

  useEffect(() => {
    if (!db || !matchId) { setEvents([]); return }
    const database = db
    void database.events.where('matchId').equals(matchId).sortBy('timestampSeconds').then(setEvents)
  }, [matchId])

  const stats = useMemo(() => deriveMatchStats(events, players), [events, players])

  return <main className="content standalonePage"><header className="topbar"><div><p className="eyebrow">ANÁLISE</p><h1>Estatísticas do jogo</h1><p>Estatísticas calculadas diretamente dos eventos do Live Match.</p></div></header><section className="section"><select value={matchId} onChange={e => setMatchId(e.target.value)}><option value="">Selecionar jogo</option>{matches.map(m => <option key={m.id} value={m.id}>{m.opponentName} · {new Date(m.date).toLocaleDateString('pt-PT')}</option>)}</select>{match && <p>{match.opponentName}</p>} {!matchId ? <div className="emptyState"><strong>Seleciona um jogo</strong><span>As estatísticas serão calculadas automaticamente a partir dos eventos registados.</span></div> : <><div className="localList"><article className="localRow"><strong>Equipa</strong><span>{stats.teamGoals} — {stats.opponentGoals} · {stats.goals} golos · {stats.shots} remates · {stats.efficiency}% eficácia · {stats.assists} assistências · {stats.turnovers} perdas · {stats.steals} recuperações · {stats.exclusions2m} exclusões</span></article></div><h2>Jogadores</h2><div className="localList">{stats.players.map(p => <article className="localRow" key={p.playerId}><strong>{p.name}</strong><span>{p.goals}G · {p.shots}R · {p.efficiency}% · {p.assists}A · {p.turnovers}P · {p.steals}Rec · {p.exclusions2m}×2'</span></article>)}{stats.players.length === 0 && <div className="emptyState"><span>Ainda não existem ações individuais registadas.</span></div>}</div></>}</section></main>
}
