'use client'

import { useEffect, useState } from 'react'
import { Activity, CalendarDays, CirclePlay, Dumbbell, Search, Users } from 'lucide-react'
import { db } from '../src/lib/storage/db'

export default function Home() {
  const [counts, setCounts] = useState({ games: 0, players: 0, videos: 0, sessions: 0 })

  useEffect(() => {
    if (!db) return
    Promise.all([db.matches.count(), db.players.count()]).then(([games, players]) => setCounts({ games, players, videos: 0, sessions: 0 }))
  }, [])

  const stats = [
    { label: 'Jogos', value: counts.games, icon: CalendarDays },
    { label: 'Atletas', value: counts.players, icon: Users },
    { label: 'Vídeos', value: counts.videos, icon: CirclePlay },
    { label: 'Sessões', value: counts.sessions, icon: Dumbbell },
  ]

  return <main className="content">
    <header className="topbar"><div><p className="eyebrow">SPORT PERFORMANCE</p><h1>Dashboard</h1></div><div className="topActions"><button className="search"><Search size={17}/> Pesquisar</button><div className="avatar">AT</div></div></header>
    <div className="hero"><div><p className="eyebrow">ÉPOCA 2026/27</p><h2>O teu centro de performance.</h2><p>Gestão, análise de vídeo, scouting, estatística e performance — com os dados guardados localmente.</p></div><div className="heroBadge"><Activity size={22}/> Local-first</div></div>
    <div className="statsGrid">{stats.map(({ label, value, icon: Icon }) => <article className="statCard" key={label}><div className="statIcon"><Icon size={19}/></div><div><span>{label}</span><strong>{value}</strong></div></article>)}</div>
    <section className="section"><div className="sectionHeader"><div><p className="eyebrow">GESTÃO</p><h3>Começar</h3></div><span className="status">Dados locais</span></div><div className="moduleGrid"><a className="moduleCard" href="/teams"><div className="moduleEmoji">🤾</div><h4>Equipas</h4><p>Criar e organizar as equipas do clube.</p><span>Abrir →</span></a><a className="moduleCard" href="/players"><div className="moduleEmoji">👤</div><h4>Jogadores</h4><p>Construir o plantel e informação individual.</p><span>Abrir →</span></a><a className="moduleCard" href="/seasons"><div className="moduleEmoji">📅</div><h4>Épocas</h4><p>Organizar temporadas e competições.</p><span>Abrir →</span></a><a className="moduleCard" href="/games"><div className="moduleEmoji">🏆</div><h4>Jogos</h4><p>Calendário e base para a análise de vídeo.</p><span>Abrir →</span></a></div></section>
    <section className="section roadmap"><div className="sectionHeader"><div><p className="eyebrow">ROADMAP</p><h3>Construção por fases</h3></div></div><div className="steps">{['Fundação','Gestão','Video Engine','Coding & Clips','Telestration','Performance & xG','Scouting','AI'].map((step, i) => <div className={i < 2 ? 'step current' : 'step'} key={step}><b>{i + 1}</b><span>{step}</span></div>)}</div></section>
  </main>
}
