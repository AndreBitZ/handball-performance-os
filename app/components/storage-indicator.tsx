'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { HardDrive } from 'lucide-react'
import { loadProjectFolderHandle, requestProjectFolderPermission } from '@/lib/storage/project-session'

export default function StorageIndicator() {
  const [label, setLabel] = useState('Local não ligado')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const handle = await loadProjectFolderHandle()
        if (!handle) return
        const granted = await requestProjectFolderPermission(handle)
        if (!active) return
        setReady(granted)
        setLabel(granted ? handle.name : 'Acesso pendente')
      } catch {
        if (active) {
          setReady(false)
          setLabel('Acesso pendente')
        }
      }
    })()

    return () => {
      active = false
    }
  }, [])

  return (
    <Link
      href="/storage"
      className={ready ? 'storageIndicator ready' : 'storageIndicator'}
      title="Gerir armazenamento local"
    >
      <span className="storageIndicatorDot" aria-hidden="true" />
      <HardDrive size={14} />
      <span>{label}</span>
    </Link>
  )
}
