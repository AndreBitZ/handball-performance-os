'use client';

import { FormEvent, useEffect, useState } from 'react';
import { db, type Season, type Competition, type Team } from '@/lib/storage/db';

export default function SeasonsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teamId, setTeamId] = useState<number | ''>('');
  const [seasonName, setSeasonName] = useState('2026/27');
  const [competitionName, setCompetitionName] = useState('');
  const [competitionSeasonId, setCompetitionSeasonId] = useState<number | ''>('');
  const [message, setMessage] = useState('');

  async function refresh() {
    const [t, s, c] = await Promise.all([db.teams.toArray(), db.seasons.toArray(), db.competitions.toArray()]);
    setTeams(t); setSeasons(s); setCompetitions(c);
    if (teamId === '' && t[0]?.id) setTeamId(t[0].id);
    if (competitionSeasonId === '' && s[0]?.id) setCompetitionSeasonId(s[0].id);
  }

  useEffect(() => { refresh(); }, []);

  async function createSeason(e: FormEvent) {
    e.preventDefault();
    if (!teamId || !seasonName.trim()) return;
    await db.seasons.add({ teamId: Number(teamId), name: seasonName.trim(), startDate: `${seasonName.slice(0,4)}-07-01`, endDate: `${Number(seasonName.slice(0,4)) + 1}-06-30`, status: 'active' });
    setMessage('Época criada.'); await refresh();
  }

  async function createCompetition(e: FormEvent) {
    e.preventDefault();
    if (!competitionSeasonId || !competitionName.trim()) return;
    await db.competitions.add({ seasonId: Number(competitionSeasonId), name: competitionName.trim(), category: 'Andebol', gender: 'Misto' });
    setCompetitionName(''); setMessage('Competição criada.'); await refresh();
  }

  return <main style={{maxWidth:1000,margin:'0 auto',padding:24,fontFamily:'system-ui'}}>
    <h1>Épocas e Competições</h1>
    <p style={{color:'#667085'}}>Tudo guardado localmente neste dispositivo.</p>
    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:20}}>
      <form onSubmit={createSeason} style={{padding:20,border:'1px solid #ddd',borderRadius:12}}>
        <h2>Nova época</h2>
        <select value={teamId} onChange={e=>setTeamId(e.target.value ? Number(e.target.value) : '')} style={{width:'100%',padding:10}}>
          <option value="">Selecionar equipa</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input value={seasonName} onChange={e=>setSeasonName(e.target.value)} placeholder="2026/27" style={{width:'100%',padding:10,marginTop:10}} />
        <button type="submit" style={{marginTop:10,padding:10}}>Criar época</button>
      </form>
      <form onSubmit={createCompetition} style={{padding:20,border:'1px solid #ddd',borderRadius:12}}>
        <h2>Nova competição</h2>
        <select value={competitionSeasonId} onChange={e=>setCompetitionSeasonId(e.target.value ? Number(e.target.value) : '')} style={{width:'100%',padding:10}}>
          <option value="">Selecionar época</option>{seasons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input value={competitionName} onChange={e=>setCompetitionName(e.target.value)} placeholder="Nome da competição" style={{width:'100%',padding:10,marginTop:10}} />
        <button type="submit" style={{marginTop:10,padding:10}}>Criar competição</button>
      </form>
    </section>
    {message && <p>{message}</p>}
    <section style={{marginTop:24}}><h2>Épocas</h2>{seasons.map(s=><div key={s.id} style={{padding:12,borderBottom:'1px solid #eee'}}>{s.name} — {teams.find(t=>t.id===s.teamId)?.name ?? 'Equipa'}</div>)}</section>
    <section style={{marginTop:24}}><h2>Competições</h2>{competitions.map(c=><div key={c.id} style={{padding:12,borderBottom:'1px solid #eee'}}>{c.name}</div>)}</section>
  </main>;
}
