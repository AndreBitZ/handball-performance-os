'use client'

import { useEffect, useMemo, useState } from 'react'

export type LiveCodingAction = 'GOAL' | 'SHOT' | 'SHOT_MISS' | 'SAVE' | 'TURNOVER' | 'STEAL' | 'ASSIST' | 'SUSPENSION_2M' | 'SEVEN_METER' | 'FOUL' | 'YELLOW' | 'RED'
export type LiveCodingEvent = { id: string; playerId: string; action: LiveCodingAction; timestampSeconds: number; period: 1 | 2 }
type Player = { id: string; displayName: string; shirtNumber?: number; position?: string }

const actions: { key: LiveCodingAction; label: string }[] = [
  { key: 'GOAL', label: '⚽ Golo' }, { key: 'SHOT', label: '🎯 Remate' }, { key: 'SHOT_MISS', label: '❌ Falhado' },
  { key: 'SAVE', label: '🧤 Defesa' }, { key: 'TURNOVER', label: '↩️ Perda' }, { key: 'STEAL', label: '🔄 Recuperação' },
  { key: 'ASSIST', label: '🅰️ Assistência' }, { key: 'SUSPENSION_2M', label: '2️⃣ 2 min' }, { key: 'SEVEN_METER', label: '7️⃣ 7 metros' },
  { key: 'FOUL', label: '🚫 Falta' }, { key: 'YELLOW', label: '🟨 Amarelo' }, { key: 'RED', label: '🟥 Vermelho' },
]

export default function LiveCoding({ players, period, timestampSeconds, onEvent }: { players: Player[]; period: 1 | 2; timestampSeconds: number; onEvent: (event: LiveCodingEvent) => void }) {
  const [selected, setSelected] = useState<string | null>(players[0]?.id ?? null)
  useEffect(() => {
    if (!players.length) { setSelected(null); return }
    setSelected(current => current && players.some(player => player.id === current) ? current : players[0].id)
  }, [players])
  const selectedPlayer = useMemo(() => players.find(p => p.id === selected), [players, selected])
  function code(action: LiveCodingAction) {
    if (!selected) return
    onEvent({ id: crypto.randomUUID(), playerId: selected, action, timestampSeconds: Math.max(0, Math.round(timestampSeconds)), period })
  }
  return <section className="section">
    <div className="sectionHeader"><div><p className="eyebrow">CODING RÁPIDO</p><h2>{selectedPlayer ? `${selectedPlayer.displayName}${selectedPlayer.shirtNumber != null ? ` · #${selectedPlayer.shirtNumber}` : ''}` : 'Seleciona um jogador'}</h2><p>Seleciona o jogador e regista a ação com um toque.</p></div></div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>{players.map(p => <button key={p.id} onClick={() => setSelected(p.id)} aria-pressed={selected === p.id}>#{p.shirtNumber ?? '—'} {p.displayName}</button>)}</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8 }}>{actions.map(a => <button key={a.key} onClick={() => code(a.key)} disabled={!selected} style={{ minHeight: 52 }}>{a.label}</button>)}</div>
  </section>
}
