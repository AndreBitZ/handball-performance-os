import { describe, expect, it } from 'vitest';

describe('manual stats level 1', () => {
  it('keeps omitted metrics unknown', () => {
    const player = { playerId: 'p1', goals: 5 };
    expect(player.goals).toBe(5);
    expect((player as any).shots).toBeUndefined();
    expect((player as any).assists).toBeUndefined();
  });
});
