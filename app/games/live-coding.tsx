'use client'

import { useEffect, useMemo, useState } from 'react'

export type LiveCodingAction = 'GOAL' | 'SHOT' | 'SHOT_MISS' | 'SAVE' | 'TURNOVER' | 'STEAL' | 'ASSIST' | 'SUSPENSION_2M' | 'SEVEN_METER' | 'FOUL' | 'YELLOW' | 'RED'
export type ShotContext = { zone?: string; distance?: string; shotType?: string; result?: string; attackPhase?: string }
export type LiveCodingEvent = { id: string; playerId: string; action: LiveCodingAction; timestampSeconds: number; period: 1 | 2; context?: ShotContext }
type Player = { id: string; displayName: string; shirtNumber?: number; position?: string }

const actions: { key: LiveCodingAction; label: string; contextual?: boolean }[] = [
  { key: 'GOAL', label: '⚽ Golo', contextual: true }, { key: 'SHOT', label: '🎯 Remate', contextual: true }, { key: 'SHOT_MISS', label: '❌ Falhado', contextual: true },
  { key: 'SAVE', label: '🧤 Defesa' }, { key: 'TURNOVER', label: '↩️ Perda' }, { key: 'STEAL', label: '🔄 Recuperação' },
  { key: 'ASSIST', label: '🅰️ Assistência' }, { key: 'SUSPENSION_2M', label: '2️⃣ 2 min' }, { key: 'SEVEN_METER', label: '7️⃣ 7 metros' },
  { key: 'FOUL', label: '🚫 Falta' }, { key: 'YELLOW', label: '🟨 Amarelo' }, { key: 'RED', label: '🟥 Vermelho' },
]
const zones = ['Z1','Z2','Z3','Z4','Z5','Z6','Z7','Z8']
const distances = ['<6m','7m','6–9m','>9m']
const shotTypes = ['Salto','Apoio','Rasteiro','Balão','Contra-ataque','7 metros']
const phases = ['Ataque organizado','Transição ofensiva','Contra-ataque','Livre']

export default function LiveCoding({ players, period, timestampSeconds, onEvent }: { players: Player[]; period: 1 | 2; timestampSeconds: number; onEvent: (event: LiveCodingEvent) => void }) {
  const [selected, setSelected] = useState<string | null>(players[0]?.id ?? null)
  const [pending, setPending] = useState<LiveCodingAction | null>(null)
  const [context, setContext] = useState<ShotContext>({})
  useEffect(() => {
    if (!players.length) { setSelected(null); return }
    setSelected(current => current && players.some(player => player.id === current) ? current : players[0].id)
  }, [players])
  const selectedPlayer = useMemo(() => players.find(p => p.id === selected), [players, selected])
  function emit(action: LiveCodingAction, shotContext?: ShotContext) {
    if (!selected) return
    onEvent({ id: crypto.randomUUID(), playerId: selected, action, timestampSeconds: Math.max(0, Math.round(timestampSeconds)), period, context: shotContext })
  }
  function code(action: LiveCodingAction, contextual?: boolean) {
    if (!selected) return
    if (contextual) { setPending(action); setContext({}); return }
    emit(action)
  }
  function confirmContext() { if (!pending) return; emit(pending, context); setPending(null); setContext({}) }
  return <section className="section">
    <div className="sectionHeader"><div><p className="eyebrow">CODING RÁPIDO</p><h2>{selectedPlayer ? `${selectedPlayer.displayName}${selectedPlayer.shirtNumber != null ? ` · #${selectedPlayer.shirtNumber}` : ''}` : 'Seleciona um jogador'}</h2><p>As ações normais são registadas com um toque. Remates e golos podem receber contexto sem sair do Live Match.</p></div></div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>{players.map(p => <button key={p.id} onClick={() => setSelected(p.id)} aria-pressed={selected === p.id}>#{p.shirtNumber ?? '—'} {p.displayName}</button>)}</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8 }}>{actions.map(a => <button key={a.key} onClick={() => code(a.key, a.contextual)} disabled={!selected} style={{ minHeight: 52 }}>{a.label}</button>)}</div>
    {pending && <div style={{ marginTop: 16, padding: 16, border: '1px solid var(--border, #ddd)', borderRadius: 12 }}>
      <div className="sectionHeader"><div><p className="eyebrow">CONTEXTO DO REMATE</p><h3>{pending === 'GOAL' ? 'Golo' : pending === 'SHOT_MISS' ? 'Remate falhado' : 'Remate'}</h3><p>Preenche apenas o que conseguires identificar. Nada é obrigatório.</p></div></div>
      <ContextPicker label="Zona" value={context.zone} options={zones} onChange={v => setContext(c => ({ ...c, zone: v }))} />
      <ContextPicker label="Distância" value={context.distance} options={distances} onChange={v => setContext(c => ({ ...c, distance: v }))} />
      <ContextPicker label="Tipo" value={context.shotType} options={shotTypes} onChange={v => setContext(c => ({ ...c, shotType: v }))} />
      <ContextPicker label="Fase" value={context.attackPhase} options={phases} onChange={v => setContext(c => ({ ...c, attackPhase: v }))} />
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button onClick={confirmContext}>Guardar remate</button><button onClick={() => { setPending(null); setContext({}) }}>Cancelar</button></div>
    </div>}
  </section>
}

function ContextPicker({ label, value, options, onChange }: { label: string; value?: string; options: string[]; onChange: (value: string) => void }) {
  return <div style={{ marginTop: 12 }}><strong>{label}</strong><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>{options.map(option => <button key={option} onClick={() => onChange(option)} aria-pressed={value === option}>{option}</button>)}</div></div>
}
