export function getClipWindow(timestampSeconds: number, preRoll = 5, postRoll = 5) {
  return {
    startSeconds: Math.max(0, timestampSeconds - preRoll),
    endSeconds: timestampSeconds + postRoll,
  }
}

export function formatClipName(type: string, timestampSeconds: number) {
  const total = Math.floor(timestampSeconds)
  const minutes = Math.floor(total / 60).toString().padStart(2, '0')
  const seconds = (total % 60).toString().padStart(2, '0')
  return `${type}-${minutes}m${seconds}s`
}
