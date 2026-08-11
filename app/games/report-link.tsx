'use client'

export default function MatchReportLink({ matchId }: { matchId: string }) {
  return <a href={`/games/report?matchId=${encodeURIComponent(matchId)}`} className="button">📊 Relatório do jogo</a>
}
