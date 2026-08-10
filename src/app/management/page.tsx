'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { db } from '@/lib/storage/db';
import type { Player, Team } from '@/lib/storage/types';

const positions = ['GR', 'PE', 'LE', 'CE', 'LD', 'PD', 'PIV'] as const;

export default function ManagementPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamName, setTeamName] = useState('');
  const [category, setCategory] = useState('');
  const [gender, setGender] = useState<Team['gender']>('F');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [shirtNumber, setShirtNumber] = useState('');
  const [position, setPosition] = useState<Player['position']>('CE');
  const [message, setMessage] = useState('');

  async function load() {
    if (!db) return;
    const [nextTeams, nextPlayers] = await Promise.all([
      db.teams.orderBy('name').toArray(),
      db.players.orderBy('lastName').toArray(),
    ]);
    setTeams(nextTeams);
    setPlayers(nextPlayers);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createTeam(event: FormEvent) {
    event.preventDefault();
    if (!db || !teamName.trim()) return;

    let club = await db.clubs.toCollection().first();
    const now = new Date().toISOString();
    if (!club) {
      club = {
        id: crypto.randomUUID(),
        name: 'Meu Clube',
        createdAt: now,
        updatedAt: now,
      };
      await db.clubs.add(club);
    }

    await db.teams.add({
      id: crypto.randomUUID(),
      clubId: club.id,
      name: teamName.trim(),
      category: category.trim() || 'Seniores',
      gender,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    setTeamName('');
    setCategory('');
    setMessage('Equipa guardada localmente.');
    await load();
  }

  async function createPlayer(event: FormEvent) {
    event.preventDefault();
    if (!db || !firstName.trim() || !lastName.trim()) return;
    const now = new Date().toISOString();
    await db.players.add({
      id: crypto.randomUUID(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: `${firstName.trim()} ${lastName.trim()}`,
      shirtNumber: shirtNumber ? Number(shirtNumber) : undefined,
      position,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    setFirstName('');
    setLastName('');
    setShirtNumber('');
    setMessage('Jogador guardado localmente.');
    await load();
  }

  async function deleteTeam(id: string) {
    if (!db || !window.confirm('Eliminar esta equipa?')) return;
    await db.teams.delete(id);
    await load();
  }

  async function deletePlayer(id: string) {
    if (!db || !window.confirm('Eliminar este jogador?')) return;
    await db.players.delete(id);
    await load();
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.eyebrow}>HANDBALL PERFORMANCE OS</div>
          <h1 style={styles.title}>Gestão local</h1>
          <p style={styles.subtitle}>Equipas e jogadores — os dados ficam neste dispositivo.</p>
        </div>
        <span style={styles.badge}>● 100% LOCAL</span>
      </header>

      {message && <div style={styles.notice}>{message}</div>}

      <section style={styles.grid}>
        <form onSubmit={createTeam} style={styles.card}>
          <h2 style={styles.cardTitle}>Nova equipa</h2>
          <label style={styles.label}>Nome<input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Ex.: Seniores Femininos" style={styles.input} /></label>
          <label style={styles.label}>Categoria<input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex.: Seniores" style={styles.input} /></label>
          <label style={styles.label}>Género<select value={gender} onChange={e => setGender(e.target.value as Team['gender'])} style={styles.input}><option value="F">Feminino</option><option value="M">Masculino</option><option value="MIXED">Misto</option></select></label>
          <button style={styles.button} type="submit">+ Criar equipa</button>
        </form>

        <form onSubmit={createPlayer} style={styles.card}>
          <h2 style={styles.cardTitle}>Novo jogador</h2>
          <div style={styles.twoCol}>
            <label style={styles.label}>Nome<input value={firstName} onChange={e => setFirstName(e.target.value)} style={styles.input} required /></label>
            <label style={styles.label}>Apelido<input value={lastName} onChange={e => setLastName(e.target.value)} style={styles.input} required /></label>
          </div>
          <div style={styles.twoCol}>
            <label style={styles.label}>N.º<input type="number" min="0" max="99" value={shirtNumber} onChange={e => setShirtNumber(e.target.value)} style={styles.input} /></label>
            <label style={styles.label}>Posição<select value={position} onChange={e => setPosition(e.target.value as Player['position'])} style={styles.input}>{positions.map(p => <option key={p} value={p}>{p}</option>)}</select></label>
          </div>
          <button style={styles.button} type="submit">+ Criar jogador</button>
        </form>
      </section>

      <section style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.sectionHead}><h2 style={styles.cardTitle}>Equipas</h2><span style={styles.count}>{teams.length}</span></div>
          {teams.length === 0 ? <p style={styles.empty}>Ainda não existem equipas.</p> : teams.map(team => <div key={team.id} style={styles.row}><div><strong>{team.name}</strong><div style={styles.muted}>{team.category} · {team.gender === 'F' ? 'Feminino' : team.gender === 'M' ? 'Masculino' : 'Misto'}</div></div><button onClick={() => void deleteTeam(team.id)} style={styles.delete}>Eliminar</button></div>)}
        </div>

        <div style={styles.card}>
          <div style={styles.sectionHead}><h2 style={styles.cardTitle}>Jogadores</h2><span style={styles.count}>{players.length}</span></div>
          {players.length === 0 ? <p style={styles.empty}>Ainda não existem jogadores.</p> : players.map(player => <div key={player.id} style={styles.row}><div><strong>{player.shirtNumber ? `#${player.shirtNumber} ` : ''}{player.displayName}</strong><div style={styles.muted}>{player.position ?? 'Sem posição'}</div></div><button onClick={() => void deletePlayer(player.id)} style={styles.delete}>Eliminar</button></div>)}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', padding: '32px', background: '#f5f7fa', color: '#172033', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { maxWidth: 1180, margin: '0 auto 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 },
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: '#526174' },
  title: { margin: '6px 0', fontSize: 34 },
  subtitle: { margin: 0, color: '#657286' },
  badge: { padding: '9px 13px', borderRadius: 999, background: '#e6f6eb', color: '#26733b', fontSize: 12, fontWeight: 800 },
  notice: { maxWidth: 1180, margin: '0 auto 18px', padding: 12, borderRadius: 12, background: '#e8f1ff', color: '#24558f' },
  grid: { maxWidth: 1180, margin: '0 auto 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 },
  card: { background: '#fff', border: '1px solid #e1e6ee', borderRadius: 18, padding: 22, boxShadow: '0 4px 18px rgba(20,30,50,.05)' },
  cardTitle: { margin: 0, fontSize: 19 },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  count: { minWidth: 28, padding: '4px 8px', textAlign: 'center', borderRadius: 999, background: '#eef2f7', color: '#526174', fontWeight: 700 },
  label: { display: 'grid', gap: 6, marginTop: 14, fontSize: 13, fontWeight: 700, color: '#526174' },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #d4dbe5', borderRadius: 10, padding: '11px 12px', fontSize: 15, background: '#fff', color: '#172033' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  button: { marginTop: 18, width: '100%', border: 0, borderRadius: 11, padding: 12, background: '#172033', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '13px 0', borderTop: '1px solid #edf0f4' },
  muted: { marginTop: 3, color: '#7a8798', fontSize: 13 },
  delete: { border: 0, background: 'transparent', color: '#b33a3a', cursor: 'pointer', fontWeight: 700 },
  empty: { color: '#7a8798', margin: '18px 0 0' },
};
