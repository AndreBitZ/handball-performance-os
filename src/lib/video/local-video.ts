export type LocalVideo = { file: File; url: string }

export function createLocalVideo(file: File): LocalVideo {
  return { file, url: URL.createObjectURL(file) }
}

export function revokeLocalVideo(video?: LocalVideo | null) {
  if (video) URL.revokeObjectURL(video.url)
}
