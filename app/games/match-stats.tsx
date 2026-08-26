'use client'

import { useEffect, useMemo, useState } from 'react'
import type { MatchEvent, Player } from '../../src/lib/storage/types'
import { db } from '../../src/lib/storage/db'

export type PlayerMatchStats = {
  playerId: string
  goals: number
  shots: number
  missedShots: number
  assists: number
  turnovers: number
  steals: number
  exclusions: number
  shootingEfficiency: number
}

function calculate(events: MatchEvent[], players: Player[]): PlayerMatchStats[] {
  return players.map(player => {
    const mine = events.filter(event => event.playerId === player.id)
    const goals = mine.filter(event => event.type === 'GOAL').length
    const shots = mine.filter(event => event.type === 'SHOT' || event.type === 'GOAL' || event.type === 'SHOT_MISSED').length
    const missedShots = mine.filter(event => event.type === 'SHOT_MISSED').length
    const assists = mine.filter(event => event.type === 'ASSIST').length
    const turnovers = mine.filter(event => event.type === 'TURNOVER').length
    const steals = mine.filter(event => event.type === 'STEAL').length
    const exclusions = mine.filter(event => event.type === '2MIN').length
    return { playerId: player.id, goals, shots, missedShots, assists, turnovers, steals, exclusions, shootingEfficiency: shots ? Math.round((goals / shots) * 100) : 0 }
  })
}

export default function MatchStats({ matchId, players }: { matchId: string; players: Player[] }) {
  const [events, setEvents] = useState<MatchEvent[]>([])
  useEffect(() => { let active = true; async function load() { if (!db) return; const database = db; const rows = await database.events.where('matchId').equals(matchId).sortBy('timestampSeconds'); if (active) setEvents(rows) }; void load(); return () => { active = false } }, [matchId])
  const stats = useMemo(() => calculate(events, players), [events, players])
  const totals = useMemo(() => stats.reduce((acc, row) => ({ goals: acc.goals + row.goals, shots: acc.shots + row.shots, assists: acc.assists + row.assists, turnovers: acc.turnovers + row.turnovers, steals: acc.steals + row.steals, exclusions: acc.exclusions + row.exclusions }), { goals: 0, shots: 0, assists: 0, turnovers: 0, steals: 0, exclusions: 0 }), [stats])
  return <section className="section"><div className="sectionHeader"><div><p className="eyebrow">ANÁLISE</p><h2>Estatísticas do jogo + HPI</h2><p>O HPI é exclusivamente a pontuação oficial das ações calculada pelo Andebol-Stats. O Performance OS apenas a apresenta e contextualiza.</p></div></div><div className="localList"><article className="localRow"><strong>Equipa</strong><span>{totals.goals} golos · {totals.shots} remates · {totals.shots ? Math.round((totals.goals / totals.shots) * 100) : 0}% eficácia · {totals.assists} assistências · {totals.turnovers} perdas · {totals.steals} recuperações · {totals.exclusions} exclusões</span></article>{stats.filter(row => row.shots || row.goals || row.assists || row.turnovers || row.steals || row.exclusions || players.find(p => p.id === row.playerId)?.hpiHistory?.some(h => h.matchId === matchId) || players.find(p => p.id === row.playerId)?.hpi).map(row => { const player = players.find(p => p.id === row.playerId); if (!player) return null; const hpi = player.hpiHistory?.find(item => item.matchId === matchId) ?? player.hpi; return <article className="localRow" key={row.playerId}><div><strong>{player.displayName}</strong><span>{row.goals}G · {row.shots}R · {row.shootingEfficiency}% · {row.assists}A · {row.turnovers}P · {row.steals}Rec · {row.exclusions}×2'</span></div><div style={{display:'flex',gap:14,alignItems:'center'}}><span><strong>HPI {hpi?.score ?? '—'}</strong></span>{hpi && <span>+{hpi.positivePoints ?? 0} / {hpi.negativePoints ?? 0}</span>}</div></article> })}</div></section>
}
