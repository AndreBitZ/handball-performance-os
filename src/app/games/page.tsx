'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { db } from '@/lib/storage/db';
import type { Competition, Match, Season, Team } from '@/lib/storage/types';

export default function GamesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teamId, setTeamId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [competitionId, setCompetitionId] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [homeAway, setHomeAway] = useState<Match['homeAway']>('HOME');
  const [message, setMessage] = useState('');

  async function refresh() {
    if (!db) return;
    const [t, s, c, m] = await Promise.all([
      db.teams.toArray(), db.seasons.toArray(), db.competitions.toArray(),
      db.matches.orderBy('date').reverse().toArray(),
    ]);
    setTeams(t); setSeasons(s); setCompetitions(c); setMatches(m);
    if (!teamId && t[0]) setTeamId(t[0].id);
    if (!seasonId && s[0]) setSeasonId(s[0].id);
  }

  useEffect(() => { void refresh(); }, []);

  async function createMatch(e: FormEvent) {
    e.preventDefault();
    if (!db || !teamId || !seasonId || !opponentName.trim() || !date) return;
    const now = new Date().toISOString();
    await db.matches.add({
      id: crypto.randomUUID(), seasonId, competitionId: competitionId || undefined, teamId,
      opponentName: opponentName.trim(), date, venue: venue.trim() || undefined,
      homeAway, status: 'PLANNED', createdAt: now, updatedAt: now,
    });
    setOpponentName(''); setVenue(''); setMessage('Jogo criado.'); await refresh();
  }

  const competitionOptions = competitions.filter(c => !seasonId || c.seasonId === seasonId);

  return <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
    <Link href="/">← Dashboard</Link>
    <h1>🤾 Jogos</h1>
    <p style={{ color: '#667085' }}>Calendário e preparação dos jogos. Tudo guardado localmente neste dispositivo.</p>
    <form onSubmit={createMatch} style={{ border: '1px solid #ddd', borderRadius: 16, padding: 20, marginBottom: 28 }}>
      <h2>Novo jogo</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        <select value={teamId} onChange={e => setTeamId(e.target.value)} style={{ padding: 10 }}><option value="">Equipa</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <select value={seasonId} onChange={e => { setSeasonId(e.target.value); setCompetitionId(''); }} style={{ padding: 10 }}><option value="">Época</option>{seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select value={competitionId} onChange={e => setCompetitionId(e.target.value)} style={{ padding: 10 }}><option value="">Competição (opcional)</option>{competitionOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input value={opponentName} onChange={e => setOpponentName(e.target.value)} placeholder="Adversário" style={{ padding: 10 }} required />
        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} style={{ padding: 10 }} required />
        <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Local" style={{ padding: 10 }} />
        <select value={homeAway} onChange={e => setHomeAway(e.target.value as Match['homeAway'])} style={{ padding: 10 }}><option value="HOME">Casa</option><option value="AWAY">Fora</option><option value="NEUTRAL">Neutro</option></select>
      </div>
      <button type="submit" style={{ marginTop: 14, padding: '10px 16px' }}>Criar jogo</button>
      {message && <p>{message}</p>}
    </form>
    <section><h2>Jogos</h2>{matches.length === 0 ? <p style={{ color: '#667085' }}>Ainda não existem jogos.</p> : matches.map(m => <article key={m.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 14, marginBottom: 10 }}><strong>{teams.find(t => t.id === m.teamId)?.name ?? 'Equipa'} vs {m.opponentName}</strong><div style={{ color: '#667085', marginTop: 4 }}>{new Date(m.date).toLocaleString('pt-PT')} · {m.homeAway === 'HOME' ? 'Casa' : m.homeAway === 'AWAY' ? 'Fora' : 'Neutro'}{m.venue ? ` · ${m.venue}` : ''}</div></article>)}</section>
  </main>;
}
