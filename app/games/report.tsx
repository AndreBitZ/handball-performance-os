'use client'

import { useMemo } from 'react'
import type { MatchEvent, Player } from '../../src/lib/storage/types'
import { deriveMatchStats } from '../../src/lib/analytics/matchStats'
import { deriveMatchXG } from '../../src/lib/analytics/xg'

export default function MatchReport({ events, players, teamName, opponentName }: { events: MatchEvent[]; players: Player[]; teamName: string; opponentName: string }) {
  const stats = useMemo(() => deriveMatchStats(events, players), [events, players])
  const xg = useMemo(() => deriveMatchXG(events, players), [events, players])
  const topScorers = [...stats.players].sort((a, b) => b.goals - a.goals || b.efficiency - a.efficiency)
  return <section className="section">
    <div className="sectionHeader"><div><p className="eyebrow">RELATÓRIO DO JOGO</p><h2>{teamName} {stats.teamGoals} — {stats.opponentGoals} {opponentName}</h2><p>Relatório calculado automaticamente a partir dos eventos registados.</p></div></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>{[['Golos', stats.goals], ['Remates', stats.shots], ['Eficácia', `${stats.efficiency}%`], ['Assistências', stats.assists], ['Perdas', stats.turnovers], ['Recuperações', stats.steals], ['Exclusões', stats.exclusions2m]].map(([label, value]) => <article className="localRow" key={String(label)}><strong>{label}</strong><span>{value}</span></article>)}</div>
    <section className="panel" style={{ marginBottom: 18 }}>
      <div className="panelHeader"><div><p className="eyebrow">EXPECTED GOALS</p><h3>xG {xg.xG.toFixed(2)}</h3><p>{xg.shots} remates com contexto · modelo {xg.modelVersion} · {xg.calibrated ? 'calibrado' : 'baseline não calibrado'}</p></div><span className="status">G-xG {xg.goalsMinusXG >= 0 ? '+' : ''}{xg.goalsMinusXG.toFixed(2)}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        <article className="localRow"><strong>Golos</strong><span>{xg.goals}</span></article>
        <article className="localRow"><strong>xG/remate</strong><span>{xg.xGPerShot.toFixed(3)}</span></article>
        <article className="localRow"><strong>Golos − xG</strong><span>{xg.goalsMinusXG >= 0 ? '+' : ''}{xg.goalsMinusXG.toFixed(2)}</span></article>
      </div>
      <div className="localList" style={{ marginTop: 12 }}>{xg.players.map(player => <article className="localRow" key={player.playerId}><strong>{player.name}</strong><span>{player.goals}G · {player.shots}R · xG {player.xG.toFixed(2)} · G−xG {player.goalsMinusXG >= 0 ? '+' : ''}{player.goalsMinusXG.toFixed(2)}</span></article>)}{xg.players.length === 0 && <div className="emptyState"><strong>Sem remates com contexto suficiente</strong><span>Os remates precisam de distância para entrarem no cálculo xG.</span></div>}</div>
    </section>
    <h3>Jogadores</h3><div className="localList">{topScorers.map(p => <article className="localRow" key={p.playerId}><strong>{p.name}</strong><span>{p.goals}G · {p.shots}R · {p.efficiency}% eficácia · {p.assists}A · {p.turnovers} perdas · {p.steals} rec. · {p.exclusions2m}×2'</span></article>)}{topScorers.length === 0 && <div className="emptyState"><strong>Sem estatísticas registadas</strong><span>As estatísticas aparecem quando forem registados eventos no Live Match.</span></div>}</div>
  </section>
}
