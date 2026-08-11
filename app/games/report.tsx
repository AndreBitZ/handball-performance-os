'use client'

import { useMemo } from 'react'
import type { MatchEvent, Player } from '../../src/lib/storage/types'
import { deriveMatchStats } from '../../src/lib/analytics/matchStats'

export default function MatchReport({ events, players, teamName, opponentName }: { events: MatchEvent[]; players: Player[]; teamName: string; opponentName: string }) {
  const stats = useMemo(() => deriveMatchStats(events, players), [events, players])
  const topScorers = [...stats.players].sort((a, b) => b.goals - a.goals || b.efficiency - a.efficiency)
  return <section className="section"><div className="sectionHeader"><div><p className="eyebrow">RELATÓRIO DO JOGO</p><h2>{teamName} {stats.teamGoals} — {stats.opponentGoals} {opponentName}</h2><p>Relatório calculado automaticamente a partir dos eventos registados.</p></div></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>{[['Golos', stats.goals], ['Remates', stats.shots], ['Eficácia', `${stats.efficiency}%`], ['Assistências', stats.assists], ['Perdas', stats.turnovers], ['Recuperações', stats.steals], ['Exclusões', stats.exclusions2m]].map(([label, value]) => <article className="localRow" key={String(label)}><strong>{label}</strong><span>{value}</span></article>)}</div><h3>Jogadores</h3><div className="localList">{topScorers.map(p => <article className="localRow" key={p.playerId}><strong>{p.name}</strong><span>{p.goals}G · {p.shots}R · {p.efficiency}% eficácia · {p.assists}A · {p.turnovers} perdas · {p.steals} rec. · {p.exclusions2m}×2'</span></article>)}{topScorers.length === 0 && <div className="emptyState"><strong>Sem estatísticas registadas</strong><span>As estatísticas aparecem quando forem registados eventos no Live Match.</span></div>}</div></section>}
