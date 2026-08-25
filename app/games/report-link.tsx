'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { downloadHpoMatch } from '../../src/lib/integration/hpoMatchFile'

export default function MatchReportLink({ matchId }: { matchId: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function exportMatch() {
    setBusy(true)
    setError('')
    try { await downloadHpoMatch(matchId) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível exportar o jogo.') }
    finally { setBusy(false) }
  }
  return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
    <a href={`/games/report?matchId=${encodeURIComponent(matchId)}`} className="button">📊 Relatório do jogo</a>
    <button type="button" onClick={() => void exportMatch()} disabled={busy}>
      <Download size={17} /> {busy ? 'A exportar…' : 'Exportar para Andebol-Stats'}
    </button>
    {error && <span className="status" role="alert">{error}</span>}
  </div>
}
