'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Activity, CalendarDays, ChevronLeft, ChevronRight, Dumbbell, Gamepad2, Home, Plus, Search, Settings, Shield, Users, Video } from 'lucide-react'
import StorageIndicator from './storage-indicator'

const nav = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Equipas', href: '/teams', icon: Shield },
  { label: 'Jogadores', href: '/players', icon: Users },
  { label: 'Épocas', href: '/seasons', icon: CalendarDays },
  { label: 'Jogos', href: '/games', icon: Gamepad2 },
  { label: 'Novo jogo', href: '/games/new', icon: Plus },
  { label: 'Vídeo', href: '#', icon: Video, disabled: true },
  { label: 'Performance', href: '#', icon: Activity, disabled: true },
  { label: 'Scouting', href: '#', icon: Search, disabled: true },
  { label: 'Treinos', href: '#', icon: Dumbbell, disabled: true },
  { label: 'Armazenamento', href: '/storage', icon: Settings },
]

const SIDEBAR_STORAGE_KEY = 'hpo-sidebar-collapsed'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true')
  }, [])

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

  return <div className={collapsed ? 'appShell sidebarCollapsed' : 'appShell'}>
    <style>{`
      .appShell .sidebarToggle { position:absolute; top:18px; right:-12px; width:24px; height:24px; border:1px solid #30394d; border-radius:50%; background:#101522; color:#dfe5f0; display:grid; place-items:center; cursor:pointer; z-index:5; box-shadow:0 2px 8px rgba(0,0,0,.2); }
      .appShell .sidebarToggle:hover { background:#20283a; color:#fff; }
      .appShell .navItem { position:relative; white-space:nowrap; }
      .appShell .navItem span { transition:opacity .15s ease, width .15s ease; overflow:hidden; }
      .appShell .sidebar { transition:width .18s ease; box-sizing:border-box; }
      .appShell .appMain { transition:margin-left .18s ease, width .18s ease; }
      .appShell.sidebarCollapsed .sidebar { width:72px; padding-left:8px; padding-right:8px; }
      .appShell.sidebarCollapsed .appMain { margin-left:72px; width:calc(100% - 72px); }
      .appShell.sidebarCollapsed .brand { justify-content:center; padding-left:0; padding-right:0; }
      .appShell.sidebarCollapsed .brandText, .appShell.sidebarCollapsed .navItem span, .appShell.sidebarCollapsed .sidebarVersion { width:0; opacity:0; pointer-events:none; }
      .appShell.sidebarCollapsed .navItem { justify-content:center; padding-left:0; padding-right:0; gap:0; }
      .appShell.sidebarCollapsed .navItem.active { box-shadow:none; }
      .appShell.sidebarCollapsed .navItem.active::before { content:''; position:absolute; left:0; width:3px; height:22px; border-radius:0 3px 3px 0; background:var(--accent); }
      .appShell.sidebarCollapsed .sidebarFooter { padding-left:0; padding-right:0; }
      .appShell.sidebarCollapsed .storageIndicator { justify-content:center; padding-left:6px; padding-right:6px; }
      @media(max-width:700px) {
        .appShell .sidebar { width:64px; padding:14px 8px; }
        .appShell .appMain { margin-left:64px; width:calc(100% - 64px); }
        .appShell .sidebarToggle { display:none; }
        .appShell .brandText, .appShell .navItem span, .appShell .sidebarVersion { display:none; }
        .appShell .brand { justify-content:center; padding-left:0; padding-right:0; }
        .appShell .navItem { justify-content:center; padding-left:0; padding-right:0; gap:0; }
      }
    `}</style>
    <aside className="sidebar">
      <div className="brand">
        <div className="brandMark">HP</div>
        <div className="brandText"><strong>Handball</strong><span>Performance OS</span></div>
      </div>
      <button type="button" className="sidebarToggle" onClick={toggleSidebar} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} title={collapsed ? 'Expandir menu' : 'Recolher menu'}>
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      <nav className="nav" aria-label="Navegação principal">
        {nav.map(({ label, href, icon: Icon, disabled }) => {
          const active = !disabled && (href === '/' ? pathname === '/' : pathname.startsWith(href))
          if (disabled) return <span className="navItem navDisabled" aria-disabled="true" title={label} key={label}><Icon size={17}/><span>{label}</span></span>
          return <Link className={active ? 'navItem active' : 'navItem'} href={href} title={label} key={label}><Icon size={17}/><span>{label}</span></Link>
        })}
      </nav>
      <div className="sidebarFooter"><StorageIndicator /><span className="sidebarVersion">V1.0 · Local-first</span></div>
    </aside>
    <div className="appMain">{children}</div>
  </div>
}
