'use client'

import { useEffect, useRef, useState } from 'react'
import { Film, Upload, Play, Pause, Plus, Clock3, Trash2, Download, Scissors } from 'lucide-react'
import { db } from '../../src/lib/storage/db'
import { createId } from '../../src/lib/storage/id'
import type { MatchEvent, Clip } from '../../src/lib/storage/types'
import { codingActions } from './coding'
import { createClipFromEvent, listMatchClips } from '../../src/lib/storage/clip-service'
import '../dashboard.css'

function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds))
  const m = Math.floor(total / 60).toString().padStart(2, '0')
  const s = (total % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function VideoAnalysisPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('Nenhum vídeo selecionado')
  const [matchId, setMatchId] = useState('')
  const [matches, setMatches] = useState<{ id: string; opponentName: string; date: string }[]>([])
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [clips, setClips] = useState<Clip[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    async function load() {
      if (!db) return
      const rows = await db.matches.orderBy('date').reverse().toArray()
      setMatches(rows)
      if (rows[0]) setMatchId(rows[0].id)
    }
    load()
  }, [])

  async function loadEventsAndClips(id = matchId) {
    if (!db || !id) return
    setEvents(await db.events.where('matchId').equals(id).sortBy('timestampSeconds'))
    setClips(await listMatchClips(id))
  }

  useEffect(() => { loadEventsAndClips() }, [matchId])
  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl) }, [videoUrl])

  function selectVideo(file?: File) {
    if (!file) return
    setVideoUrl(old => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(file) })
    setFileName(file.name); setPlaying(false); setCurrentTime(0)
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play().catch(() => undefined)
    else video.pause()
  }

  async function addEvent(type: string) {
    if (!db || !matchId) return
    const timestampSeconds = videoRef.current?.currentTime ?? currentTime
    const event: MatchEvent = { id: createId(), matchId, timestampSeconds, type, createdAt: new Date().toISOString() }
    await db.events.add(event)
    setEvents(prev => [...prev, event].sort((a, b) => a.timestampSeconds - b.timestampSeconds))
  }

  async function makeClip(eventId: string) {
    const clip = await createClipFromEvent(eventId, 5, 5)
    setClips(prev => [...prev, clip].sort((a, b) => a.startSeconds - b.startSeconds))
  }

  async function removeEvent(id: string) {
    if (!db) return
    await db.events.delete(id)
    await db.clips.where('eventId').equals(id).delete()
    setEvents(prev => prev.filter(event => event.id !== id))
    setClips(prev => prev.filter(clip => clip.eventId !== id))
  }

  function jumpTo(seconds: number) {
    if (!videoRef.current) return
    videoRef.current.currentTime = seconds
    setCurrentTime(seconds)
  }

  function exportEvents() {
    const payload = JSON.stringify(events, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `${fileName.replace(/\.[^.]+$/, '') || 'jogo'}-eventos.json`; a.click(); URL.revokeObjectURL(url)
  }

  return <main className="content standalonePage">
    <header className="topbar"><div><p className="eyebrow">ANÁLISE</p><h1>Video Analysis</h1></div></header>
    <section className="section"><div className="localForm">
      <button onClick={() => inputRef.current?.click()}><Upload size={17}/> Abrir vídeo local</button>
      <input ref={inputRef} type="file" accept="video/*" hidden onChange={e => selectVideo(e.target.files?.[0])}/>
      <select value={matchId} onChange={e => setMatchId(e.target.value)}><option value="">Selecionar jogo</option>{matches.map(match => <option key={match.id} value={match.id}>{new Date(match.date).toLocaleDateString('pt-PT')} · vs {match.opponentName}</option>)}</select>
      <span style={{alignSelf:'center',fontSize:12,color:'#657086'}}>{fileName}</span>
      <button onClick={exportEvents} disabled={!events.length}><Download size={16}/> Exportar eventos</button>
    </div></section>
    <section className="section videoWorkspace">
      <div className="videoPanel">
        {videoUrl ? <><video ref={videoRef} src={videoUrl} controls onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} style={{width:'100%',maxHeight:520,background:'#090d14'}}/><div className="videoControls"><button onClick={togglePlay}>{playing ? <Pause size={16}/> : <Play size={16}/>} {playing ? 'Pausa' : 'Reproduzir'}</button><span><Clock3 size={15}/> {formatTime(currentTime)} · Eventos: {events.length} · Clips: {clips.length}</span></div></> : <div className="videoEmpty"><Film size={42}/><strong>Vídeo local</strong><span>O vídeo é lido diretamente do teu computador.</span><button onClick={() => inputRef.current?.click()}><Upload size={16}/> Selecionar vídeo</button></div>}
      </div>
      <aside className="codingPanel"><div className="sectionHeader"><div><p className="eyebrow">CODING</p><h3>Eventos</h3></div><span className="status">IndexedDB · Local</span></div><div className="codingButtons">{codingActions.map(action => <button key={action.id} onClick={() => addEvent(action.id)} disabled={!matchId}><Plus size={14}/>{action.label}</button>)}</div><div className="localList">{events.length === 0 ? <div className="emptyState"><span>Seleciona um jogo e regista o primeiro evento.</span></div> : events.map(e => <article className="localRow" key={e.id}><button style={{all:'unset',cursor:'pointer',flex:1}} onClick={() => jumpTo(e.timestampSeconds)}><div><strong>{codingActions.find(a => a.id === e.type)?.label ?? e.type}</strong><span>{formatTime(e.timestampSeconds)}</span></div></button><button className="iconButton" onClick={() => makeClip(e.id)} title="Criar clip local"><Scissors size={16}/></button><button className="iconButton" onClick={() => removeEvent(e.id)} aria-label="Apagar evento"><Trash2 size={16}/></button></article>)}</div></aside>
    </section>
    <section className="section"><div className="sectionHeader"><div><p className="eyebrow">CLIPS</p><h3>Clips marcados</h3></div><span className="status">Pré-roll 5s · Pós-roll 5s</span></div><div className="localList">{clips.length === 0 ? <div className="emptyState"><Scissors size={28}/><strong>Ainda não existem clips</strong><span>Usa a tesoura num evento para criar a marcação.</span></div> : clips.map(clip => <article className="localRow" key={clip.id}><button style={{all:'unset',cursor:'pointer',flex:1}} onClick={() => jumpTo(clip.startSeconds)}><div><strong>{clip.title}</strong><span>{formatTime(clip.startSeconds)} → {formatTime(clip.endSeconds)}</span></div></button></article>)}</div></section>
  </main>
}
