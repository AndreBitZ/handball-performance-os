import { db } from './db';
import { createId } from './id';

export async function seedDemoData() {
  if (!db) return;
  const existing = await db.clubs.count();
  if (existing > 0) return;

  const now = new Date().toISOString();
  const clubId = createId();
  const teamId = createId();
  const seasonId = createId();

  await db.clubs.add({
    id: clubId,
    name: 'Clube Exemplo',
    shortName: 'EX',
    country: 'Portugal',
    createdAt: now,
    updatedAt: now,
  });

  await db.teams.add({
    id: teamId,
    clubId,
    name: 'Seniores Femininos',
    category: 'Seniores',
    gender: 'F',
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  await db.seasons.add({
    id: seasonId,
    name: '2026/27',
    startDate: '2026-08-01',
    endDate: '2027-06-30',
    active: true,
  });
}
