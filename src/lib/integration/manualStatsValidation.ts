import { describe, expect, it } from 'vitest';

export type ManualStatRow = { goals?: number; shots?: number; assists?: number; turnovers?: number; saves?: number; yellow?: number; twoMin?: number; red?: number };
export function validateManualStatRow(row: ManualStatRow): string[] {
  const errors: string[] = [];
  const fields = ['goals','shots','assists','turnovers','saves','yellow','twoMin','red'] as const;
  for (const key of fields) if (row[key] !== undefined && (!Number.isInteger(row[key]) || (row[key] as number) < 0)) errors.push(`${key}: valor inválido`);
  if (row.goals !== undefined && row.shots !== undefined && row.goals > row.shots) errors.push('golos não podem exceder remates');
  return errors;
}
export function shotEfficiency(goals?: number, shots?: number): number | undefined { if (goals === undefined || shots === undefined || shots === 0) return undefined; return goals / shots; }

describe('manual stats level 1', () => {
  it('keeps omitted metrics unknown', () => { const player = { playerId: 'p1', goals: 5 }; expect(player.goals).toBe(5); expect((player as any).shots).toBeUndefined(); expect((player as any).assists).toBeUndefined(); });
  it('rejects impossible shot totals', () => { expect(validateManualStatRow({ goals: 8, shots: 5 })).toContain('golos não podem exceder remates'); });
  it('calculates efficiency only when both values exist', () => { expect(shotEfficiency(6, 10)).toBe(0.6); expect(shotEfficiency(6, undefined)).toBeUndefined(); });
});
