export function validatePlayerRelation(teamId: string, seasonId: string): boolean {
  return Boolean(teamId.trim() && seasonId.trim())
}
