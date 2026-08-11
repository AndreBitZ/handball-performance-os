'use client'

import { useMemo } from 'react'
import type { Match, MatchEvent, MatchSquad, Player } from '../../src/lib/storage/types'
import { derivePlayerGameMinutes } from '../../src/lib/analytics/playerGameMinutes'

export default function PlayerEvolution({ player, matches, squads, events }: { player: Player; matches: Match[]; squads: MatchSquad[]; events: MatchEvent[] }) {
  const rows = useMemo(() => derivePlayerGameMinutes(matches, squads, events, player.id).sort((a, b) => a.date.localeCompare(b.date)), [matches, squads, events, player.id])
  return <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Jogo</th><th>Min</th><th>Util.</th><th>G</th><th>R</th><th>G/min</th><th>R/min</th></tr></thead><tbody>{rows.map(r => <tr key={r.matchId}><td>{r.date} · {r.opponentName}</td><td>{r.minutesLabel}</td><td>{r.utilisation}%</td><td>{r.goals}</td><td>{r.shots}</td><td>{r.goalsPerMinute}</td><td>{r.shotsPerMinute}</td></tr>)}</tbody></table></div>
}
