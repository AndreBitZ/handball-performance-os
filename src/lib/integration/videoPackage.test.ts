import { describe, expect, it } from 'vitest';
import { buildVideoPackage } from './videoPackage';

describe('video package mapping', () => {
  it('maps four anchors and clips without changing timestamps', () => {
    const result = buildVideoPackage([
      { id: 'a1', matchId: 'm1', key: 'firstHalfStart', period: 1, gameTime: 0, videoTime: 43, capturedAt: '2026-08-23T16:00:00Z' },
      { id: 'a2', matchId: 'm1', key: 'firstHalfEnd', period: 1, gameTime: 1800, videoTime: 2597, capturedAt: '2026-08-23T16:35:00Z' },
      { id: 'a3', matchId: 'm1', key: 'secondHalfStart', period: 2, gameTime: 0, videoTime: 2710, capturedAt: '2026-08-23T16:36:00Z' },
      { id: 'a4', matchId: 'm1', key: 'secondHalfEnd', period: 2, gameTime: 1800, videoTime: 4520, capturedAt: '2026-08-23T17:06:00Z' },
    ], [{ id: 'c1', matchId: 'm1', eventId: 'e1', startSeconds: 100, endSeconds: 112, title: 'Golo', favorite: false, createdAt: '2026-08-23T17:00:00Z' }]);
    expect(result.anchors.firstHalfStart?.videoTime).toBe(43);
    expect(result.anchors.firstHalfEnd?.gameTime).toBe(1800);
    expect(result.anchors.secondHalfStart?.videoTime).toBe(2710);
    expect(result.anchors.secondHalfEnd?.videoTime).toBe(4520);
    expect(result.clips[0]).toMatchObject({ eventId: 'e1', startSeconds: 100, endSeconds: 112 });
  });
});
