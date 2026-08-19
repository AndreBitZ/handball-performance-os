import { db } from '../storage/db'
import type { Match, MatchEvent, MatchSquad, Player, PlayerTeamSeason } from '../storage/types'

export const CANONICAL_SCHEMA = '1.0.1'

type CanonicalPlayer = {
  id: string
  name: string
  shirtNumber?: number | string | null
  position?: string
  teamId: string
  active?: boolean
}

type CanonicalRoster = {
  id: string
  playerId: string
  teamId: string
  shirtNumber?: number | string | null
  position?: string
  starter?: boolean
  available?: boolean
  timeOnCourt?: number
}

type CanonicalEvent = {
  id: string
  matchId: string
  period?: number
  gameTime: number
  teamId: string
  playerId?: string | null
  type: string
  metadata?: { shot?: Record<string, unknown>; details?: string; source?: string }
}

export type CanonicalMatchPayload = {
  schemaVersion: string
  source: string
  match: {
    id: string
    seasonId?: string | null
    competitionId?: string | null
    date?: string | null
    venue?: string | null
    homeTeamId: string
    awayTeamId: string
    homeTeamName: string
    awayTeamName: string
    status: 'planned' | 'live' | 'finished' | string
    durationMinutes: number
    homeScore: number
    awayScore: number
  }
  players: CanonicalPlayer[]
  roster: CanonicalRoster[]
  events: CanonicalEvent[]
}

export type CanonicalImportContext = {
  seasonId: string
  teamId: string
  opponentTeamId?: string
  competitionId?: string
  homeAway?: Match['homeAway']
  playerIdMap?: Record<string, string>
}

export type CanonicalImportPlan = {
  match: Match
  players: Player[]
  playerTeamSeasons: PlayerTeamSeason[]
  squad: MatchSquad[]
  events: MatchEvent[]
}

function now() {
  return new Date().toISOString()
}

function toNumber(value: unknown, fallback?: number) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return { firstName: parts[0] ?? name, lastName: parts.slice(1).join(' ') }
}

function mapPosition(position?: string): Player['position'] | undefined {
  if (!position) return undefined
  const p = position.toUpperCase()
  if (p.includes('GR') || p.includes('GK')) return 'GR'
  if (p.includes('PIV')) return 'PIV'
  if (p.includes('LE')) return 'LE'
  if (p.includes('LD')) return 'LD'
  if (p.includes('PD')) return 'PD'
  if (p.includes('PE')) return 'PE'
  if (p.includes('CE') || p.includes('CENT')) return 'CE'
  return undefined
}

function mapStatus(status: string): Match['status'] {
  if (status === 'live') return 'IN_PROGRESS'
  if (status === 'finished') return 'COMPLETED'
  return 'PLANNED'
}

function mapEvent(event: CanonicalEvent, matchId: string, playerIdMap: Record<string, string>): MatchEvent {
  const shot = event.metadata?.shot ?? {}
  const playerId = event.playerId ? (playerIdMap[event.playerId] ?? event.playerId) : undefined

  return {
    id: event.id,
    matchId,
    timestampSeconds: Math.max(0, Number(event.gameTime || 0)),
    period: event.period === 2 ? 2 : 1,
    type: event.type,
    teamId: event.teamId,
    playerId,
    zone: shot.zone == null ? undefined : String(shot.zone),
    shotType: shot.type == null ? undefined : String(shot.type),
    result: shot.outcome == null ? undefined : String(shot.outcome),
    notes: event.metadata?.details,
    tags: event.metadata?.source ? [event.metadata.source] : undefined,
    createdAt: now(),
  }
}

export function buildCanonicalImportPlan(payload: CanonicalMatchPayload, context: CanonicalImportContext): CanonicalImportPlan {
  if (payload.schemaVersion !== CANONICAL_SCHEMA) {
    throw new Error(`Schema não suportado: ${payload.schemaVersion}. Esperado ${CANONICAL_SCHEMA}.`)
  }
  if (!payload.match?.id) throw new Error('O Match JSON não contém match.id.')
  if (!context.seasonId) throw new Error('É obrigatória a época de destino.')
  if (!context.teamId) throw new Error('É obrigatória a equipa de destino.')

  const createdAt = now()
  const playerIdMap: Record<string, string> = { ...(context.playerIdMap ?? {}) }

  const players: Player[] = payload.players.map((source) => {
    const mappedId = playerIdMap[source.id] ?? source.id
    playerIdMap[source.id] = mappedId
    const { firstName, lastName } = splitName(source.name)
    return {
      id: mappedId,
      firstName,
      lastName,
      displayName: source.name,
      shirtNumber: toNumber(source.shirtNumber),
      position: mapPosition(source.position),
      active: source.active !== false,
      createdAt,
      updatedAt: createdAt,
    }
  })

  const playerTeamSeasons: PlayerTeamSeason[] = payload.roster.map((row) => {
    const playerId = playerIdMap[row.playerId] ?? row.playerId
    return {
      id: `pts:${context.teamId}:${context.seasonId}:${playerId}`,
      playerId,
      teamId: context.teamId,
      seasonId: context.seasonId,
      shirtNumber: toNumber(row.shirtNumber),
      position: mapPosition(row.position),
    }
  })

  const squad: MatchSquad[] = payload.roster.map((row) => ({
    id: `squad:${payload.match.id}:${playerIdMap[row.playerId] ?? row.playerId}`,
    matchId: payload.match.id,
    playerId: playerIdMap[row.playerId] ?? row.playerId,
    teamId: context.teamId,
    starter: Boolean(row.starter),
    captain: false,
    shirtNumber: toNumber(row.shirtNumber),
    position: mapPosition(row.position),
  }))

  const events = payload.events.map((event) => mapEvent(event, payload.match.id, playerIdMap))

  const match: Match = {
    id: payload.match.id,
    seasonId: context.seasonId,
    competitionId: context.competitionId ?? payload.match.competitionId ?? undefined,
    teamId: context.teamId,
    opponentTeamId: context.opponentTeamId,
    opponentName: payload.match.awayTeamName,
    date: payload.match.date ?? createdAt,
    venue: payload.match.venue ?? undefined,
    homeAway: context.homeAway ?? 'HOME',
    goalsFor: payload.match.homeScore,
    goalsAgainst: payload.match.awayScore,
    status: mapStatus(payload.match.status),
    createdAt,
    updatedAt: createdAt,
  }

  return { match, players, playerTeamSeasons, squad, events }
}

export async function importCanonicalMatch(payload: CanonicalMatchPayload, context: CanonicalImportContext) {
  if (!db) throw new Error('A base de dados local só está disponível no browser.')

  const plan = buildCanonicalImportPlan(payload, context)
  const database = db

  await database.transaction('rw', [database.players, database.playerTeamSeasons, database.matches, database.matchSquads, database.events], async () => {
    await database.players.bulkPut(plan.players)
    await database.playerTeamSeasons.bulkPut(plan.playerTeamSeasons)
    await database.matches.put(plan.match)
    await database.matchSquads.bulkPut(plan.squad)
    await database.events.bulkPut(plan.events)
  })

  return {
    matchId: plan.match.id,
    players: plan.players.length,
    squad: plan.squad.length,
    events: plan.events.length,
  }
}
