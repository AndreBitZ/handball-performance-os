export const codingActions = [
  { id: 'goal', label: 'Golo', group: 'Ataque' },
  { id: 'shot', label: 'Remate', group: 'Ataque' },
  { id: 'turnover', label: 'Perda', group: 'Ataque' },
  { id: 'recovery', label: 'Recuperação', group: 'Defesa' },
  { id: 'save', label: 'Defesa GR', group: 'Defesa' },
  { id: 'seven-meter', label: '7 metros', group: 'Especial' },
  { id: 'two-minutes', label: '2 minutos', group: 'Disciplina' },
] as const

export type CodingActionId = typeof codingActions[number]['id']

export type LocalCodeEvent = {
  id: string
  actionId: CodingActionId
  timestampSeconds: number
  playerId?: string
  zone?: string
  result?: string
  notes?: string
  createdAt: string
}
