'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/storage/db';
import { applyManualMatchStats } from '@/lib/integration/manualStats';
import { validateManualStatRow } from '@/lib/integration/manualStatsValidation';

const fields = ['goals','shots','assists','turnovers','saves','yellow','twoMin','red'] as const;
type Row = Record<(typeof fields)[number], string>;
const blank = (): Row => ({ goals:'', shots:'', assists:'', turnovers:'', saves:'', yellow:'', twoMin:'', red:'' });

export default function ManualStatsPage() {
  const [matches, setMatches] = useState<any[]>([]); const [players, setPlayers] = useState<any[]>([]); const [matchId, setMatchId] = useState(''); const [rows, setRows] = useState<Record<string, Row>>({}); const [message, setMessage] = useState('');
  useEffect(() => { if (!db) return; Promise.all([db.matches.toArray(), db.players.toArray()]).then(([m,p]) => { setMatches(m.filter(x=>x.status==='COMPLETED')); setPlayers(p.filter(x=>x.active)); }); }, []);
  const update = (id:string, field:string, value:string) => setRows(prev=>({...prev,[id]:{...(prev[id]||blank()),[field]:value}}));
  const save = async () => { if (!db || !matchId) return setMessage('Seleciona o jogo.'); const input = players.map(p => { const r=rows[p.id]||blank(); const out:any={playerId:p.id}; for(const f of fields) if(r[f] !== '') out[f]=Number(r[f]); return out; }).filter(r=>Object.keys(r).length>1); const errors=input.flatMap(r=>validateManualStatRow(r).map(e=>`${r.playerId}: ${e}`)); if(errors.length) return setMessage(errors.join(' | ')); const result=await applyManualMatchStats(db,{matchId,players:input}); setMessage(`Guardado: ${result.importedEvents} registos. Fonte: Estatística manual (Nível 1).`); };
  return <main style={{padding:24,maxWidth:1200,margin:'0 auto'}}><h1>Estatística manual — Nível 1</h1><p>Completa apenas os dados que conheces. O que ficar vazio permanece desconhecido.</p><select value={matchId} onChange={e=>setMatchId(e.target.value)}><option value=''>Selecionar jogo</option>{matches.map(m=><option key={m.id} value={m.id}>{m.date} — {m.opponentName}</option>)}</select><div style={{overflowX:'auto',marginTop:20}}><table><thead><tr><th>Atleta</th>{fields.map(f=><th key={f}>{f}</th>)}</tr></thead><tbody>{players.map(p=>{const r=rows[p.id]||blank();return <tr key={p.id}><td>{p.displayName}</td>{fields.map(f=><td key={f}><input type='number' min='0' step='1' value={r[f]} onChange={e=>update(p.id,f,e.target.value)} style={{width:70}} placeholder='—'/></td>)}</tr>})}</tbody></table></div><button onClick={save} style={{marginTop:20}}>Guardar estatística manual</button>{message&&<p>{message}</p>}</main>;
}
