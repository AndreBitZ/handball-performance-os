'use client'

import { useMemo } from 'react'
import type { Match, MatchEvent, MatchSquad, Player, PlayerTeamSeason } from '../../src/lib/storage/types'
import { deriveSeasonPlayerStats } from '../../src/lib/analytics/seasonPlayerStats'
import { formatMinutes } from '../../src/lib/analytics/playerMinutes'

export default function SeasonPlayerStats({ seasonId, teamId, players, relations, matches, squads, events }: { seasonId: string; teamId: string; players: Player[]; relations: PlayerTeamSeason[]; matches: Match[]; squads: MatchSquad[]; events: MatchEvent[] }) {
  const rows = useMemo(() => deriveSeasonPlayerStats(seasonId, teamId, players, relations, matches, squads, events), [seasonId, teamId, players, relations, matches, squads, events])
  return <section className="section"><div className="sectionHeader"><div><p className="eyebrow">PERFORMANCE</p><h2>Estatísticas da época</h2><p>Dados derivados dos jogos e eventos registados.</p></div></div>{rows.length === 0 ? <div className="emptyState"><strong>Sem estatísticas</strong><span>Regista jogos, convocatórias e eventos para começar a acumular dados.</span></div> : <div style={{ overflowX: 'auto' }}><table><thead><tr><th>Jogador</th><th>J</th><th>Tit.</th><th>Min</th><th>G</th><th>R</th><th>Efic.</th><th>A</th><th>Perdas</th><th>Rec.</th><th>2'</th><th>G/J</th></tr></thead><tbody>{rows.map(r => <tr key={r.playerId}><td><strong>{r.name}</strong></td><td>{r.matches}</td><td>{r.starts}</td><td>{formatMinutes(r.minutes)}</td><td>{r.goals}</td><td>{r.shots}</td><td>{r.efficiency}%</td><td>{r.assists}</td><td>{r.turnovers}</td><td>{r.steals}</td><td>{r.exclusions2m}</td><td>{r.goalsPerMatch}</td></tr>)}</tbody></table></div>}</section>
}
