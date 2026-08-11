'use client'

import { useMemo } from 'react'
import type { Match, MatchEvent, MatchSquad, Player } from '../../src/lib/storage/types'
import { derivePlayerGameMinutes } from '../../src/lib/analytics/playerGameMinutes'
import { rollingAverage, trendDirection } from '../../src/lib/analytics/playerTrends'

export default function PlayerTrendSummary({ player, matches, squads, events }: { player: Player; matches: Match[]; squads: MatchSquad[]; events: MatchEvent[] }) {
  const data = useMemo(() => derivePlayerGameMinutes(matches, squads, events, player.id).sort((a, b) => a.date.localeCompare(b.date)), [matches, squads, events, player.id])
  const goals = data.map(x => x.goals)
  const utilisation = data.map(x => x.utilisation)
  const goalsAvg = rollingAverage(goals).at(-1) ?? 0
  const utilisationAvg = rollingAverage(utilisation).at(-1) ?? 0
  const label = (value: 'up' | 'down' | 'stable') => value === 'up' ? '↑ Em subida' : value === 'down' ? '↓ Em descida' : '→ Estável'
  return <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}><article className="card"><span>Forma ofensiva</span><strong>{label(trendDirection(goals))}</strong><small>Média recente: {goalsAvg.toFixed(1)} G/jogo</small></article><article className="card"><span>Utilização</span><strong>{label(trendDirection(utilisation))}</strong><small>Média recente: {utilisationAvg.toFixed(0)}%</small></article></div>
}
