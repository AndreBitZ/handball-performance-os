'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Upload, ShieldCheck } from 'lucide-react'
import { db } from '../../src/lib/storage/db'
import { downloadBackup, exportDatabase, importDatabase } from '../../src/lib/storage/backup'

export default function BackupPage() {
  const input = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)
  async function exportNow() { if (!db) return; try { downloadBackup(await exportDatabase(db)); setStatus('Backup criado com sucesso.') } catch { setStatus('Não foi possível criar o backup.') } }
  async function importNow(file: File) { if (!db) return; if (!window.confirm('Restaurar este backup substitui os dados locais atuais. Tens a certeza?')) return; try { await importDatabase(db, file); setStatus('Backup restaurado. A aplicação será atualizada.'); window.setTimeout(() => window.location.reload(), 700) } catch { setStatus('Backup inválido ou incompatível. Os dados atuais não foram alterados.') } }
  return <main className="content standalonePage"><header className="topbar"><div><Link href="/" className="navItem" style={{display:'inline-flex',padding:0,marginBottom:12}}><ArrowLeft size={16}/> Dashboard</Link><p className="eyebrow">SEGURANÇA</p><h1>Backup e recuperação</h1><p>Protege o trabalho de análises longas sem depender apenas do armazenamento local.</p></div><div className="heroBadge"><ShieldCheck size={20}/> Local-first</div></header><section className="hero"><div><p className="eyebrow">BACKUP MANUAL</p><h2>Uma cópia antes de uma pausa.</h2><p>Exporta todos os dados estruturados da aplicação para um ficheiro .hpo. O ficheiro pode ser restaurado mais tarde.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button onClick={()=>void exportNow()}><Download size={16}/> Exportar backup</button><button onClick={()=>input.current?.click()}><Upload size={16}/> Restaurar backup</button><input ref={input} hidden type="file" accept=".hpo,application/json" onChange={e=>{const file=e.target.files?.[0];if(file)void importNow(file);e.currentTarget.value='' }}/></div></section>{status&&<section className="section"><p aria-live="polite">{status}</p></section>}<section className="section"><h3>O que é guardado</h3><p>Equipas, atletas, épocas, competições, jogos, convocatórias, intervalos de presença, estado do relógio, eventos, clips e playlists.</p><p><strong>Importante:</strong> o backup é local e deve ser guardado num local seguro. O sistema não depende de um servidor para funcionar.</p></section></main>
}
