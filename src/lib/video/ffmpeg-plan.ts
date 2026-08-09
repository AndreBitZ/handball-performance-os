export type ClipRenderJob = {
  inputFileName: string
  outputFileName: string
  startSeconds: number
  durationSeconds: number
}

export function createClipRenderJob(inputFileName: string, outputFileName: string, startSeconds: number, endSeconds: number): ClipRenderJob {
  return {
    inputFileName,
    outputFileName,
    startSeconds: Math.max(0, startSeconds),
    durationSeconds: Math.max(0, endSeconds - startSeconds),
  }
}

/**
 * FFmpeg arguments for a future local WebAssembly worker.
 * The command intentionally uses only local file paths supplied by the browser worker.
 */
export function ffmpegClipArgs(job: ClipRenderJob) {
  return [
    '-ss', String(job.startSeconds),
    '-i', job.inputFileName,
    '-t', String(job.durationSeconds),
    '-c', 'copy',
    job.outputFileName,
  ]
}
