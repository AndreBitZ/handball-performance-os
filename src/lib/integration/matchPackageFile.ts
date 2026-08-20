import { db } from '../storage/db';
import { exportMatchPackage } from './matchContract';

export async function downloadMatchPackage(matchId: string) {
  if (!db) throw new Error('A base de dados local só está disponível no browser.');
  const payload = await exportMatchPackage(db, matchId);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `match-${payload.match.id}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return payload;
}
