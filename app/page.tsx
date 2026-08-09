import { Activity, CalendarDays, CirclePlay, Dumbbell, Search, Users } from 'lucide-react'
import './dashboard.css'

const stats = [
  { label: 'Jogos', value: '0', icon: CalendarDays },
  { label: 'Atletas', value: '0', icon: Users },
  { label: 'Vídeos', value: '0', icon: CirclePlay },
  { label: 'Sessões', value: '0', icon: Dumbbell },
]

const modules = [
  ['🎥', 'Video Analysis', 'Coding, clips, playlists e telestration'],
  ['📊', 'Performance', 'Estatística, indicadores e xG'],
  ['🔍', 'Scouting', 'Adversários, jogadores e tendências'],
  ['🤾', 'Equipa', 'Plantel, épocas, jogos e histórico'],
]

export default function Home() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">HP</div>
          <div><strong>Handball</strong><span>Performance OS</span></div>
        </div>
        <nav className="nav">
          {['Dashboard', 'Equipa', 'Jogadores', 'Épocas', 'Jogos', 'Video Analysis', 'Performance', 'Scouting', 'Treinos', 'Reports'].map((item, index) => (
            <a className={index === 0 ? 'navItem active' : 'navItem'} href="#" key={item}>
              <span>{['⌂', '◆', '●', '◷', '▣', '▶', '◈', '⌕', '▤', '▥'][index]}</span>{item}
            </a>
          ))}
        </nav>
        <div className="sidebarFooter">V1.0 · Fundação do projeto</div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><p className="eyebrow">SPORT PERFORMANCE</p><h1>Dashboard</h1></div>
          <div className="topActions"><button className="search"><Search size={17} /> Pesquisar</button><div className="avatar">AT</div></div>
        </header>
        <div className="hero">
          <div><p className="eyebrow">ÉPOCA 2026/27</p><h2>Vamos construir o teu centro de performance.</h2><p>Uma plataforma única para análise de vídeo, scouting, estatística e gestão da performance.</p></div>
          <div className="heroBadge"><Activity size={22} /> Sistema em construção</div>
        </div>
        <div className="statsGrid">
          {stats.map(({ label, value, icon: Icon }) => <article className="statCard" key={label}><div className="statIcon"><Icon size={19} /></div><div><span>{label}</span><strong>{value}</strong></div></article>)}
        </div>
        <section className="section">
          <div className="sectionHeader"><div><p className="eyebrow">ARQUITETURA</p><h3>Módulos principais</h3></div><span className="status">Fundação</span></div>
          <div className="moduleGrid">
            {modules.map(([emoji, title, description]) => <article className="moduleCard" key={title}><div className="moduleEmoji">{emoji}</div><h4>{title}</h4><p>{description}</p><span>Em breve →</span></article>)}
          </div>
        </section>
        <section className="section roadmap">
          <div className="sectionHeader"><div><p className="eyebrow">ROADMAP</p><h3>Construção por fases</h3></div></div>
          <div className="steps">
            {['Fundação', 'Gestão', 'Video Engine', 'Coding & Clips', 'Telestration', 'Performance & xG', 'Scouting', 'AI'].map((step, i) => <div className={i === 0 ? 'step current' : 'step'} key={step}><b>{i + 1}</b><span>{step}</span></div>)}
          </div>
        </section>
      </section>
    </main>
  )
}
