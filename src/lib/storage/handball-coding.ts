export const shotZones = ['Z1','Z2','Z3','Z4','Z5','Z6','Z7','Z8'] as const
export const shotTypes = ['Apoio','Suspensão','Habilidade','Anca','Baliza a Baliza'] as const
export const distances = ['<6m','7m','6-9m','>9m'] as const
export const results = ['Golo','Defesa GR','Fora','Bloco','Poste','Perda'] as const
export const attackPhases = ['Ataque Posicional','Transição Ofensiva','Contra-Ataque','7m','Livre 9m'] as const

export type ShotZone = typeof shotZones[number]
export type ShotType = typeof shotTypes[number]
export type Distance = typeof distances[number]
export type ShotResult = typeof results[number]
export type AttackPhase = typeof attackPhases[number]

export interface ShotCoding {
  zone?: ShotZone
  shotType?: ShotType
  distance?: Distance
  result?: ShotResult
  attackPhase?: AttackPhase
  hand?: 'Esquerda' | 'Direita'
}
