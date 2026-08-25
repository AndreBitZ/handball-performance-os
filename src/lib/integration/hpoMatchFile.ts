import { exportMatchPackage } from './matchContract';
import type { HpoMatchFile } from './hpoMatchContract';
import { db } from '../storage/db';

export async function exportHpoMatch(matchId: string): Promise<HpoMatchFile> {
  if (!db) throw new Error('A base de dados local só está disponível no browser.');
  const canonical = await exportMatchPackage(db, matchId);
  return {
    format: 'HPO-MATCH',
    version: '1.0',
    direction: 'PERFORMANCE_OS_TO_ANDEBOL_STATS',
    exportedAt: new Date().toISOString(),
    match: { ...canonical.match },
    players: canonical.players,
    roster: canonical.roster,
    events: canonical.events,
    statistics: { preMatch: canonical.preMatchStats ?? null, match: canonical.statistics },
    timeline: [],
    video: { anchors: canonical.video?.anchors ?? {}, clips: canonical.video?.clips ?? [] },
    metadata: { source: 'handball-performance-os', sourceVersion: 'HPO-MATCH-1.0', dataSources: canonical.match.dataSources ?? ['performance_os'] },
  };
}

export async function downloadHpoMatch(matchId: string) {
  const payload = await exportHpoMatch(matchId);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `match-${payload.match.id}.hpo-match.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return payload;
}
