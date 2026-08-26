import type { Clip, MatchVideoAnchor } from '../storage/types';
import type { CanonicalVideoClip, VideoAnchors } from './matchContract';

const keys: Record<MatchVideoAnchor['key'], keyof VideoAnchors> = {
  firstHalfStart: 'firstHalfStart', firstHalfEnd: 'firstHalfEnd',
  secondHalfStart: 'secondHalfStart', secondHalfEnd: 'secondHalfEnd',
};

export function buildVideoPackage(anchors: MatchVideoAnchor[], clips: Clip[]) {
  const videoAnchors: VideoAnchors = {};
  for (const anchor of anchors) videoAnchors[keys[anchor.key]] = {
    period: anchor.period,
    gameTime: anchor.gameTime,
    videoTime: anchor.videoTime,
    capturedAt: anchor.capturedAt,
  };
  const videoClips: CanonicalVideoClip[] = clips.map(clip => ({
    eventId: clip.eventId,
    startSeconds: clip.startSeconds,
    endSeconds: clip.endSeconds,
    title: clip.title,
    notes: clip.notes,
  }));
  return { anchors: videoAnchors, clips: videoClips };
}
