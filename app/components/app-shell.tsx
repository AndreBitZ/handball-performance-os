'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Activity, CalendarDays, Dumbbell, Gamepad2, Home, Plus, Search, Shield, Users, Video } from 'lucide-react'

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
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <div className="appShell">
    <aside className="sidebar">
      <div className="brand"><div className="brandMark">HP</div><div><strong>Handball</strong><span>Performance OS</span></div></div>
      <nav className="nav" aria-label="Navegação principal">
        {nav.map(({ label, href, icon: Icon, disabled }) => {
          const active = !disabled && (href === '/' ? pathname === '/' : pathname.startsWith(href))
          if (disabled) return <span className="navItem navDisabled" aria-disabled="true" key={label}><Icon size={16}/><span>{label}</span></span>
          return <Link className={active ? 'navItem active' : 'navItem'} href={href} key={label}><Icon size={16}/><span>{label}</span></Link>
        })}
      </nav>
      <div className="sidebarFooter">V1.0 · Local-first</div>
    </aside>
    <div className="appMain">{children}</div>
  </div>
}
