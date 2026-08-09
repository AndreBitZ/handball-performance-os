'use client'

import { useRef, useState } from 'react'
import { Film, Upload, Play, Pause, Plus, Clock3 } from 'lucide-react'
import '../dashboard.css'

export default function VideoAnalysisPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('Nenhum vídeo selecionado')
  const [playing, setPlaying] = useState(false)
  const [events, setEvents] = useState<{ id: string; time: number; type: string }[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)

  function selectVideo(file?: File) {
    if (!file) return
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoUrl(URL.createObjectURL(file))
    setFileName(file.name)
    setPlaying(false)
  }

  function togglePlay() {
    if (!videoRef.current) return
    if (videoRef.current.paused) { videoRef.current.play(); setPlaying(true) }
    else { videoRef.current.pause(); setPlaying(false) }
  }

  function addEvent(type: string) {
    const time = videoRef.current?.currentTime ?? 0
    setEvents(prev => [...prev, { id: crypto.randomUUID(), time, type }])
  }

  return <main className="content standalonePage">
    <header className="topbar"><div><p className="eyebrow">ANÁLISE</p><h1>Video Analysis</h1></div></header>
    <section className="section">
      <div className="localForm">
        <button onClick={() => inputRef.current?.click()}><Upload size={17}/> Abrir vídeo local</button>
        <input ref={inputRef} type="file" accept="video/*" hidden onChange={e => selectVideo(e.target.files?.[0])}/>
        <span style={{alignSelf:'center',fontSize:12,color:'#657086'}}>{fileName}</span>
      </div>
    </section>
    <section className="section videoWorkspace">
      <div className="videoPanel">
        {videoUrl ? <video ref={videoRef} src={videoUrl} controls onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} style={{width:'100%',maxHeight:520,background:'#090d14'}}/> : <div className="videoEmpty"><Film size={42}/><strong>Vídeo local</strong><span>Seleciona um jogo no teu computador para começar.</span><button onClick={() => inputRef.current?.click()}><Upload size={16}/> Selecionar vídeo</button></div>}
        {videoUrl && <div className="videoControls"><button onClick={togglePlay}>{playing ? <Pause size={16}/> : <Play size={16}/>} {playing ? 'Pausa' : 'Reproduzir'}</button><span><Clock3 size={15}/> Eventos: {events.length}</span></div>}
      </div>
      <aside className="codingPanel"><div className="sectionHeader"><div><p className="eyebrow">CODING</p><h3>Eventos</h3></div><span className="status">Local</span></div><div className="codingButtons">{['Golo','Remate','Perda','Recuperação','7 metros','2 minutos','Defesa GR'].map(type => <button key={type} onClick={() => addEvent(type)}><Plus size={14}/>{type}</button>)}</div><div className="localList">{events.length === 0 ? <div className="emptyState"><span>Reproduz o vídeo e regista o primeiro evento.</span></div> : events.map(e => <article className="localRow" key={e.id}><div><strong>{e.type}</strong><span>{new Date(e.time * 1000).toISOString().slice(14,19)}</span></div></article>)}</div></aside>
    </section>
  </main>
}
