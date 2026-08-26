function waitForImage(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      image.onload = null
      image.onerror = null
    }
    image.onload = () => { cleanup(); resolve() }
    image.onerror = () => { cleanup(); reject(new Error('Não foi possível carregar a imagem neste navegador.')) }
  })
}

export async function fileToOptimizedDataUrl(file: File, maxSize = 720, quality = 0.84): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Seleciona uma imagem válida.')
  if (file.size > 8 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 8 MB.')

  const source = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = source

    // Safari/WebKit can reject Image.decode() for some local/blob images even
    // though the image itself is perfectly usable. Use decode when available,
    // but always fall back to the normal load event.
    try {
      if (typeof image.decode === 'function') await image.decode()
      else await waitForImage(image)
    } catch {
      await waitForImage(image)
    }

    const width = image.naturalWidth || image.width
    const height = image.naturalHeight || image.height
    if (!width || !height) throw new Error('Não foi possível obter as dimensões da imagem.')

    const scale = Math.min(1, maxSize / Math.max(width, height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível processar a imagem.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    // WebP is supported by modern Safari. Keep JPEG as a fallback for older
    // WebKit versions and embedded Safari environments.
    const webp = canvas.toDataURL('image/webp', quality)
    if (webp.startsWith('data:image/webp')) return webp
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(source)
  }
}
