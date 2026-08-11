'use client'

import { useMemo } from 'react'
import type { Match, MatchEvent, MatchSquad, Player } from '../../src/lib/storage/types'
import { derivePlayerGameMinutes } from '../../src/lib/analytics/playerGameMinutes'

export default function PlayerUsage({ player, matches, squads, events }: { player: Player; matches: Match[]; squads: MatchSquad[]; events: MatchEvent[] }) {
  const rows = useMemo(() => matches.map(match => { const squad = squads.filter(s => s.matchId === match.id); const minutes = derivePlayerGameMinutes(events.filter(e => e.matchId === match.id), squad, player.id); const goals = events.filter(e => e.matchId === match.id && e.playerId === player.id && e.type === 'GOAL' && e.result === 'FOR').length; const shots = events.filter(e => e.matchId === match.id && e.playerId === player.id && e.type === 'SHOT').length; const available = 60; return { match, minutes, usage: Math.round((minutes / available) * 100), goals, shots, goalsPerMinute: minutes ? Number((goals / minutes).toFixed(3)) : 0, shotsPerMinute: minutes ? Number((shots / minutes).toFixed(3)) : 0 } }), [matches, squads, events, player.id])
  return <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Jogo</th><th>Min</th><th>Utilização</th><th>G</th><th>R</th><th>G/min</th><th>R/min</th></tr></thead><tbody>{rows.map(r => <tr key={r.match.id}><td>{r.match.opponentName}</td><td>{Math.floor(r.minutes / 60)}:{String(r.minutes % 60).padStart(2, '0')}</td><td>{r.usage}%</td><td>{r.goals}</td><td>{r.shots}</td><td>{r.goalsPerMinute}</td><td>{r.shotsPerMinute}</td></tr>)}</tbody></table></div>
}
