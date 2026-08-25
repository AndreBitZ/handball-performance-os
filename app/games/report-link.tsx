'use client'

import { useState } from 'react'
import { downloadHpoMatch } from '../../src/lib/integration/hpoMatchFile'

export default function MatchReportLink({ matchId }: { matchId: string }) {
  const [busy, setBusy] = useState(false)
  async function exportMatch() {
    setBusy(true)
    try { await downloadHpoMatch(matchId) } catch (error) { window.alert(error instanceof Error ? error.message : 'Não foi possível exportar o jogo.') }
    finally { setBusy(false) }
  }
  return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    <a href={`/games/report?matchId=${encodeURIComponent(matchId)}`} className="button">📊 Relatório do jogo</a>
    <button type="button" onClick={() => void exportMatch()} disabled={busy}>{busy ? 'A exportar…' : '↗ Exportar para Andebol-Stats'}</button>
  </div>
}
