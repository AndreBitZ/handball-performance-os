import { gameTimeToVideoTime } from './matchTimeline';

const timeline = [
  { id: 'tl-stop', kind: 'timeline' as const, schemaVersion: '1.0.0' as const, period: 1 as const, type: 'clock_stop' as const, gameTime: 1112, videoTime: 2487, reason: 'medical' },
  { id: 'tl-resume', kind: 'timeline' as const, schemaVersion: '1.0.0' as const, period: 1 as const, type: 'clock_resume' as const, gameTime: 1112, videoTime: 2571, reason: 'medical' },
];

const anchors = { firstHalfStart: { gameTime: 0, videoTime: 42 }, firstHalfEnd: null, secondHalfStart: null, secondHalfEnd: null };

const before = gameTimeToVideoTime(1100, 1, anchors, timeline);
const after = gameTimeToVideoTime(1120, 1, anchors, timeline);

if (before !== 1142) throw new Error(`Before stop expected 1142, got ${before}`);
if (after !== 1304) throw new Error(`After stop expected 1304, got ${after}`);
