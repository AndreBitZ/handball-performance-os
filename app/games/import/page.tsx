'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Upload, CheckCircle2 } from 'lucide-react'
import { db } from '../../../src/lib/storage/db'
import { importAndebolStatsResult } from '../../../src/lib/integration/importMatchPackage'
import '../../dashboard.css'

export default function ImportGameResultPage() {
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)

  async function handleFile(file?: File) {
    if (!file) return
    if (!db) {
      setMessage('A base de dados local só está disponível no browser.')
      return
    }

    setImporting(true)
    setMessage(null)
    setMatchId(null)
    try {
      const payload = JSON.parse(await file.text())
      await importAndebolStatsResult(db, payload)
      setMatchId(payload.match.id)
      setMessage('Resultado importado com sucesso para o Performance OS.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível importar o Match JSON.')
    } finally {
      setImporting(false)
    }
  }

  return <main className="content standalonePage">
    <header className="topbar">
      <div>
        <Link href="/games" className="navItem" style={{ display:'inline-flex', padding:0, marginBottom:12 }}><ArrowLeft size={16}/> Jogos</Link>
        <p className="eyebrow">INTEGRAÇÃO</p>
        <h1>Importar resultado do Andebol-Stats</h1>
        <p>Seleciona o Match JSON exportado pelo Andebol-Stats depois do jogo.</p>
      </div>
    </header>

    <section className="hero">
      <div>
        <p className="eyebrow">PERFORMANCE OS ← ANDEBOL-STATS</p>
        <h2>Fechar o ciclo do jogo</h2>
        <p>O mesmo ID do jogo é usado para atualizar o resultado, convocados e eventos sem criar um segundo jogo.</p>
      </div>
      <label style={{ display:'inline-flex', alignItems:'center', gap:8, cursor: importing ? 'default' : 'pointer' }}>
        <Upload size={18}/>
        <span>{importing ? 'A importar…' : 'Selecionar Match JSON'}</span>
        <input type="file" accept="application/json,.json" disabled={importing} onChange={event => { void handleFile(event.target.files?.[0]); event.currentTarget.value = '' }} style={{ display:'none' }}/>
      </label>
    </section>

    {message && <section className="section"><p role="status">{message}</p>{matchId && <p><CheckCircle2 size={16} style={{ verticalAlign:'middle', marginRight:6 }}/>Jogo: <Link href={`/games/${matchId}`}>{matchId}</Link></p>}</section>}
  </main>
}
