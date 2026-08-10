'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Competition, Season, Team } from '@/lib/storage/types';
import { db } from '@/lib/storage/db';

export default function SeasonsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [seasonName, setSeasonName] = useState('2026/27');
  const [competitionName, setCompetitionName] = useState('');
  const [competitionSeasonId, setCompetitionSeasonId] = useState<string>('');
  const [message, setMessage] = useState('');

  async function refresh() {
    if (!db) return;
    const database = db;
    const [t, s, c] = await Promise.all([
      database.teams.toArray(),
      database.seasons.toArray(),
      database.competitions.toArray(),
    ]);
    setTeams(t);
    setSeasons(s);
    setCompetitions(c);
    if (!competitionSeasonId && s[0]?.id) setCompetitionSeasonId(s[0].id);
  }

  useEffect(() => { void refresh(); }, []);

  async function createSeason(e: FormEvent) {
    e.preventDefault();
    if (!db || !seasonName.trim()) return;
    const database = db;
    const year = Number(seasonName.slice(0, 4));
    if (!Number.isFinite(year)) return;
    await database.seasons.add({
      id: crypto.randomUUID(),
      name: seasonName.trim(),
      startDate: `${year}-07-01`,
      endDate: `${year + 1}-06-30`,
      active: true,
    });
    setMessage('Época criada.');
    await refresh();
  }

  async function createCompetition(e: FormEvent) {
    e.preventDefault();
    if (!db || !competitionSeasonId || !competitionName.trim()) return;
    const database = db;
    await database.competitions.add({
      id: crypto.randomUUID(),
      seasonId: competitionSeasonId,
      name: competitionName.trim(),
      category: 'Andebol',
    });
    setCompetitionName('');
    setMessage('Competição criada.');
    await refresh();
  }

  return <main style={{ maxWidth: 1000, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
    <h1>Épocas e Competições</h1>
    <p style={{ color: '#667085' }}>Tudo guardado localmente neste dispositivo.</p>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
      <form onSubmit={createSeason} style={{ padding: 20, border: '1px solid #ddd', borderRadius: 12 }}>
        <h2>Nova época</h2>
        <input value={seasonName} onChange={e => setSeasonName(e.target.value)} placeholder="2026/27" style={{ width: '100%', padding: 10 }} />
        <button type="submit" style={{ marginTop: 10, padding: 10 }}>Criar época</button>
      </form>
      <form onSubmit={createCompetition} style={{ padding: 20, border: '1px solid #ddd', borderRadius: 12 }}>
        <h2>Nova competição</h2>
        <select value={competitionSeasonId} onChange={e => setCompetitionSeasonId(e.target.value)} style={{ width: '100%', padding: 10 }}>
          <option value="">Selecionar época</option>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input value={competitionName} onChange={e => setCompetitionName(e.target.value)} placeholder="Nome da competição" style={{ width: '100%', padding: 10, marginTop: 10 }} />
        <button type="submit" style={{ marginTop: 10, padding: 10 }}>Criar competição</button>
      </form>
    </section>
    {message && <p>{message}</p>}
    <section style={{ marginTop: 24 }}><h2>Épocas</h2>{seasons.map(s => <div key={s.id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>{s.name} {s.active ? '— Ativa' : ''}</div>)}</section>
    <section style={{ marginTop: 24 }}><h2>Competições</h2>{competitions.map(c => <div key={c.id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>{c.name}</div>)}</section>
  </main>;
}
