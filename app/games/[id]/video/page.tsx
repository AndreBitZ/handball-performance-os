'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Film, Pause, Play, Upload } from 'lucide-react'
import { db } from '../../../../src/lib/storage/db'
import { mapMatchTimeToVideoSeconds } from '../../../../src/lib/video/matchVideoTime'
import type { Match, MatchEvent, MatchVideo, MatchVideoSync } from '../../../../src/lib/storage/types'
import '../../../dashboard.css'

const EMPTY_SYNC: MatchVideoSync = { id: '', matchId: '', updatedAt: '' }

function formatSeconds(value: number | undefined | null) {
  if (value == null || !Number.isFinite(value)) return '--:--'
  const total = Math.max(0, Math.floor(value))
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}

export default function MatchVideoPage({ params }: { params: { id: string } }) {
  const [match, setMatch] = useState<Match | null>(null)
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [sync, setSync] = useState<MatchVideoSync>({ ...EMPTY_SYNC, id: crypto.randomUUID(), matchId: params.id })
  const [video, setVideo] = useState<MatchVideo | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      if (!db) return
      const [m, e, s, v] = await Promise.all([
        db.matches.get(params.id),
        db.events.where('matchId').equals(params.id).sortBy('timestampSeconds'),
        db.videoSyncs.where('matchId').equals(params.id).first(),
        db.videos.where('matchId').equals(params.id).first(),
      ])
      if (!active) return
      setMatch(m ?? null)
      setEvents(e ?? [])
      setSync(s ?? { ...EMPTY_SYNC, id: crypto.randomUUID(), matchId: params.id })
      setVideo(v ?? null)
    }
    void load()
    return () => { active = false }
  }, [params.id])

  useEffect(() => {
    if (!video?.blob) return
    const url = URL.createObjectURL(video.blob)
    setVideoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [video])

  const halfDuration = 30
  const mappedEvents = useMemo(() => events.map(event => ({
    event,
    videoSeconds: mapMatchTimeToVideoSeconds(event.timestampSeconds, halfDuration, sync),
  })), [events, sync])

  async function uploadVideo(file: File) {
    if (!db) return
    const temp = document.createElement('video')
    temp.preload = 'metadata'
    const tempUrl = URL.createObjectURL(file)
    temp.src = tempUrl
    await new Promise<void>(resolve => {
      temp.onloadedmetadata = () => resolve()
      temp.onerror = () => resolve()
    })
    const duration = Number.isFinite(temp.duration) ? temp.duration : undefined
    URL.revokeObjectURL(tempUrl)
    const now = new Date().toISOString()
    const stored: MatchVideo = { id: video?.id ?? crypto.randomUUID(), matchId: params.id, fileName: file.name, mimeType: file.type || 'video/mp4', blob: file, durationSeconds: duration, createdAt: video?.createdAt ?? now, updatedAt: now }
    await db.videos.put(stored)
    await db.matches.update(params.id, { sourceVideoPath: file.name, videoDurationSeconds: duration, updatedAt: now })
    setVideo(stored)
    setMessage(`Vídeo guardado localmente: ${file.name}`)
  }

  async function saveSync(patch: Partial<MatchVideoSync>) {
    if (!db) return
    const next = { ...sync, ...patch, id: sync.id || crypto.randomUUID(), matchId: params.id, updatedAt: new Date().toISOString() }
    await db.videoSyncs.put(next)
    setSync(next)
    setMessage('Sincronização guardada.')
  }

  function mark(field: 'firstHalfStartVideoSeconds' | 'firstHalfEndVideoSeconds' | 'secondHalfStartVideoSeconds' | 'secondHalfEndVideoSeconds') {
    const current = videoRef.current?.currentTime
    if (current == null) return
    void saveSync({ [field]: current })
  }

  function seek(seconds: number | null) {
    if (seconds == null || !videoRef.current) return
    videoRef.current.currentTime = seconds
    void videoRef.current.play()
  }

  if (!match) return <main className="content standalonePage"><Link href={`/games/${params.id}`}>← Jogo</Link><h1 style={{ marginTop: 20 }}>Jogo não encontrado</h1></main>

  return <main className="content standalonePage">
    <header className="topbar">
      <div><Link href={`/games/${params.id}`} className="navItem" style={{ display:'inline-flex', padding:0, marginBottom:12 }}><ArrowLeft size={16}/> Ficha do jogo</Link><p className="eyebrow">VÍDEO · SINCRONIZAÇÃO</p><h1>{match.opponentName}</h1><p>{match.goalsFor ?? '-'} : {match.goalsAgainst ?? '-'}</p></div>
    </header>

    {message && <section className="section"><p role="status">{message}</p></section>}

    <section className="section">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <div><h2 style={{marginBottom:4}}>Vídeo do jogo</h2><p>O vídeo fica guardado localmente neste dispositivo.</p></div>
        <label className="button" style={{display:'inline-flex',alignItems:'center',gap:8,cursor:'pointer'}}><Upload size={16}/> {video ? 'Substituir vídeo' : 'Adicionar vídeo'}<input type="file" accept="video/*" hidden onChange={e => { const file=e.target.files?.[0]; if(file) void uploadVideo(file); e.currentTarget.value='' }}/></label>
      </div>
      {videoUrl ? <video ref={videoRef} src={videoUrl} controls style={{width:'100%',maxHeight:560,marginTop:16,borderRadius:12,background:'#000'}} /> : <div style={{padding:40,textAlign:'center',border:'1px dashed rgba(255,255,255,.2)',borderRadius:12,marginTop:16}}><Film size={36} style={{margin:'0 auto 10px'}}/><p>Adiciona o vídeo para começar a sincronização.</p></div>}
    </section>

    <section className="section">
      <h2>Sincronização do jogo</h2>
      <p>Marca os quatro pontos reais do vídeo. Depois, qualquer evento registado no Andebol-Stats poderá ser convertido automaticamente para o tempo do vídeo.</p>
      <div className="moduleGrid" style={{marginTop:16}}>
        {([
          ['firstHalfStartVideoSeconds','Início 1.ª parte','00:00'],
          ['firstHalfEndVideoSeconds','Fim 1.ª parte','30:00'],
          ['secondHalfStartVideoSeconds','Início 2.ª parte','30:00'],
          ['secondHalfEndVideoSeconds','Fim 2.ª parte','60:00'],
        ] as const).map(([field,label,gameClock]) => <button key={field} className="moduleCard" onClick={() => mark(field)} disabled={!videoUrl} style={{textAlign:'left',opacity:videoUrl?1:.55}}><strong>{label}</strong><span>Relógio jogo: {gameClock}</span><span>Vídeo: {formatSeconds(sync[field])}</span><small>{videoUrl ? 'MARCAR POSIÇÃO ATUAL →' : 'ADICIONAR VÍDEO'}</small></button>)}
      </div>
    </section>

    <section className="section">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><h2>Eventos → vídeo</h2><p>{events.length} eventos importados do Andebol-Stats.</p></div><div style={{display:'flex',gap:8}}><button onClick={()=>videoRef.current?.play()} disabled={!videoUrl}><Play size={15}/> Play</button><button onClick={()=>videoRef.current?.pause()} disabled={!videoUrl}><Pause size={15}/> Pausar</button></div></div>
      {mappedEvents.length === 0 ? <p style={{marginTop:16}}>Ainda não existem eventos. Primeiro termina um teste no Andebol-Stats e importa o resultado.</p> : <div style={{marginTop:16,display:'grid',gap:8}}>{mappedEvents.map(({event,videoSeconds}) => <button key={event.id} onClick={()=>seek(videoSeconds)} disabled={videoSeconds==null || !videoUrl} style={{display:'grid',gridTemplateColumns:'80px 1fr 90px',gap:12,textAlign:'left',padding:12,borderRadius:10,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)'}}><strong>{formatSeconds(event.timestampSeconds)}</strong><span>{event.type}{event.result ? ` · ${event.result}` : ''}{event.notes ? ` · ${event.notes}` : ''}</span><strong>{formatSeconds(videoSeconds)}</strong></button>)}</div>}
    </section>
  </main>
}
