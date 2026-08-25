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
