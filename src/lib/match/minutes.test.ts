import { calculatePlayerSeconds, HALF_SECONDS, validatePlayerIntervals } from './minutes'

const assert = (condition: boolean, message: string) => { if (!condition) throw new Error(message) }

const result = calculatePlayerSeconds([
  { playerId: 'A', period: 1, startSeconds: 0, endSeconds: 600 },
  { playerId: 'A', period: 1, startSeconds: 900, endSeconds: 1800 },
  { playerId: 'B', period: 1, startSeconds: 1200 },
  { playerId: 'B', period: 2, startSeconds: 0, endSeconds: 900 },
], 1, 1500)

assert(result.A === 1500, 'A should have 25:00')
assert(result.B === 300, 'B should have 5:00 at 25:00 in period 1')

const secondHalf = calculatePlayerSeconds([
  { playerId: 'A', period: 1, startSeconds: 0, endSeconds: HALF_SECONDS },
  { playerId: 'A', period: 2, startSeconds: 0 },
  { playerId: 'C', period: 2, startSeconds: 600, endSeconds: 1200 },
], 2, 1500)

assert(secondHalf.A === 3600 + 1500, 'A should have 60:00 across both halves')
assert(secondHalf.C === 600, 'C should have 10:00')

const invalid = validatePlayerIntervals([
  { playerId: 'A', period: 1, startSeconds: 100, endSeconds: 50 },
  { playerId: 'B', period: 1, startSeconds: -1 },
  { playerId: 'C', period: 1, startSeconds: 100 },
  { playerId: 'C', period: 1, startSeconds: 200 },
])

assert(invalid.length === 3, 'invalid intervals should be rejected')
console.log('player minutes tests: PASS')
