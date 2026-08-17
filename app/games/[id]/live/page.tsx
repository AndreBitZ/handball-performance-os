'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Pause, Play, RotateCcw, ArrowRightLeft } from 'lucide-react'
import LiveCoding, { type LiveCodingEvent } from '../../live-coding'
import { db } from '../../../../src/lib/storage/db'
import type { Match, MatchSquad, Player } from '../../../../src/lib/storage/types'

const HALF_SECONDS = 30 * 60
const ON_COURT = 7
type PlayerWithSquad = Player & Pick<MatchSquad, 'shirtNumber' | 'position' | 'starter'>
const uid = () => crypto.randomUUID()

export default function LiveMatchPage({ params }: { params: { id: string } }) {
  const [match, setMatch] = useState<Match | null>(null), [players, setPlayers] = useState<PlayerWithSquad[]>([]), [onCourt, setOnCourt] = useState<string[]>([])
  const [period, setPeriod] = useState<1 | 2>(1), [seconds, setSeconds] = useState(0), [running, setRunning] = useState(false), [startedPeriod, setStartedPeriod] = useState(false)
  const [savedCount, setSavedCount] = useState(0), [minutes, setMinutes] = useState<Record<string, number>>({}), [subOut, setSubOut] = useState<string | null>(null), [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      if (!db) return
      const current = await db.matches.get(params.id); if (!current) return
      const squad = await db.matchSquads.where('matchId').equals(params.id).toArray(), ids = squad.map(x => x.playerId)
      const loaded = ids.length ? await db.players.where('id').anyOf(ids).toArray() : [], byId = new Map(loaded.map(p => [p.id, p]))
      const mapped: PlayerWithSquad[] = squad.flatMap(item => { const p = byId.get(item.playerId); return p ? [{ ...p, shirtNumber: item.shirtNumber ?? p.shirtNumber, position: item.position ?? p.position, starter: item.starter }] : [] }).sort((a,b)=>(a.shirtNumber??999)-(b.shirtNumber??999))
      const intervals = await db.playerIntervals.where('matchId').equals(params.id).toArray(), events = await db.events.where('matchId').equals(params.id).toArray()
      if (!active) return
      const currentPeriod: 1 | 2 = intervals.some(i => i.period === 2) ? 2 : 1, open = intervals.filter(i => i.period === currentPeriod && i.endSeconds === undefined)
      setMatch(current); setPlayers(mapped); setSavedCount(events.length); setPeriod(currentPeriod); setOnCourt(open.map(i => i.playerId).slice(0, ON_COURT)); setStartedPeriod(open.length > 0)
      const last = events.reduce((a,e)=>e.timestampSeconds>a.timestampSeconds?e:a,{timestampSeconds:0,period:1} as typeof events[number]); setSeconds(currentPeriod===2 ? Math.max(0,last.timestampSeconds-HALF_SECONDS) : Math.min(HALF_SECONDS,Math.max(0,last.timestampSeconds)))
    }
    void load(); return () => { active = false }
  }, [params.id])

  useEffect(() => { if (!running) return; const t=window.setInterval(()=>setSeconds(v=>{if(v>=HALF_SECONDS){setRunning(false);return HALF_SECONDS}return v+1}),1000); return ()=>window.clearInterval(t) }, [running])

  useEffect(() => { if (!db || !match) return; let cancelled=false; const refresh=async()=>{const all=await db.playerIntervals.where('matchId').equals(match.id).toArray(); if(cancelled)return; const totals:Record<string,number>={}; for(const i of all){const end=i.endSeconds ?? (i.period===period?seconds:HALF_SECONDS); totals[i.playerId]=(totals[i.playerId]??0)+Math.max(0,end-i.startSeconds)} setMinutes(totals)}; void refresh(); return()=>{cancelled=true} },[seconds,period,match])

  const displayTime=useMemo(()=>`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`,[seconds])
  const courtPlayers=useMemo(()=>players.filter(p=>onCourt.includes(p.id)),[players,onCourt]), benchPlayers=useMemo(()=>players.filter(p=>!onCourt.includes(p.id)),[players,onCourt])

  async function startPeriod(){
    if(!db||!players.length)return; setError(null)
    try { const existing=await db.playerIntervals.where('matchId').equals(params.id).toArray(), open=existing.filter(i=>i.period===period&&i.endSeconds===undefined); let lineup=open.map(i=>i.playerId)
      if(!lineup.length){lineup=players.filter(p=>p.starter).slice(0,ON_COURT).map(p=>p.id); if(lineup.length<ON_COURT)lineup=[...lineup,...players.filter(p=>!lineup.includes(p.id)).slice(0,ON_COURT-lineup.length).map(p=>p.id)]; const now=new Date().toISOString(); await db.playerIntervals.bulkAdd(lineup.map(playerId=>({id:uid(),matchId:params.id,playerId,period,startSeconds:0,createdAt:now,updatedAt:now})))}
      setOnCourt(lineup.slice(0,ON_COURT));setStartedPeriod(true);setRunning(true)
    } catch {setError('Não foi possível iniciar a parte.')}
  }
  async function finishPeriod(){if(!db)return;setRunning(false);const all=await db.playerIntervals.where('matchId').equals(params.id).toArray(),open=all.filter(i=>i.period===period&&i.endSeconds===undefined),now=new Date().toISOString();for(const i of open)await db.playerIntervals.update(i.id,{endSeconds:HALF_SECONDS,updatedAt:now});setStartedPeriod(false);if(period===1){setPeriod(2);setSeconds(0);setSubOut(null)}}
  async function substitute(playerIn:string){if(!db||!subOut||playerIn===subOut||onCourt.length!==ON_COURT)return;setError(null);try{const all=await db.playerIntervals.where('matchId').equals(params.id).toArray(),out=all.find(i=>i.period===period&&i.playerId===subOut&&i.endSeconds===undefined);if(!out)throw new Error();const now=new Date().toISOString();await db.playerIntervals.update(out.id,{endSeconds:seconds,updatedAt:now});await db.playerIntervals.add({id:uid(),matchId:params.id,playerId:playerIn,period,startSeconds:seconds,createdAt:now,updatedAt:now});setOnCourt(v=>v.map(id=>id===subOut?playerIn:id));setSubOut(null)}catch{setError('Não foi possível efetuar a substituição.')}}
  async function handleEvent(event:LiveCodingEvent){if(!db)return;setError(null);try{await db.events.add({id:event.id,matchId:params.id,timestampSeconds:event.timestampSeconds,period:event.period,type:event.action,playerId:event.playerId,createdAt:new Date().toISOString()});setSavedCount(v=>v+1)}catch{setError('Não foi possível guardar o evento.')}}

  if(!match)return <main className="content standalonePage"><p>A carregar jogo…</p></main>
  return <main className="content standalonePage">
    <header className="topbar"><div><Link href={`/games/${match.id}`} className="navItem" style={{display:'inline-flex',padding:0,marginBottom:12}}><ArrowLeft size={16}/> Jogo</Link><p className="eyebrow">LIVE MATCH</p><h1>{match.opponentName}</h1><p>{period}.ª parte · {savedCount} eventos · {courtPlayers.length}/7 em campo</p></div><div className="heroBadge" aria-live="polite">{displayTime}</div></header>
    <section className="hero"><div><p className="eyebrow">CONTROLO DO JOGO</p><h2>{period}.ª parte</h2><p>{startedPeriod?'Parte iniciada. Entradas e saídas são contabilizadas automaticamente.':'Inicia a parte para criar os primeiros intervalos.'}</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>{!startedPeriod?<button onClick={()=>void startPeriod()} disabled={!players.length}><Play size={16}/> Iniciar parte</button>:<button onClick={()=>setRunning(v=>!v)}>{running?<Pause size={16}/>:<Play size={16}/>} {running?'Pausar':'Retomar'}</button>}<button onClick={()=>{setRunning(false);setSeconds(0)}}><RotateCcw size={16}/> Reiniciar relógio</button>{startedPeriod&&<button onClick={()=>void finishPeriod()} disabled={seconds<HALF_SECONDS}>{period===1?'Fechar 1.ª parte':'Fechar jogo'}</button>}</div></section>
    {error&&<p role="alert" style={{color:'crimson',marginTop:12}}>{error}</p>}
    <section className="section"><div className="sectionHeader"><div><p className="eyebrow">7 EM CAMPO</p><h2>{courtPlayers.length}/{ON_COURT}</h2></div><ArrowRightLeft size={20}/></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:8}}>{courtPlayers.map(p=><button key={p.id} onClick={()=>setSubOut(p.id)} aria-pressed={subOut===p.id} style={{minHeight:62}}><strong>#{p.shirtNumber??'—'} {p.displayName}</strong><br/><small>{p.position??'—'} · {((minutes[p.id]??0)/60).toFixed(1)} min</small></button>)}</div>{subOut&&<p style={{marginTop:12}}>A sair: <strong>{players.find(p=>p.id===subOut)?.displayName}</strong>. Escolhe quem entra.</p>}</section>
    <section className="section"><div className="sectionHeader"><div><p className="eyebrow">BANCO</p><h2>Substituições</h2></div></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:8}}>{benchPlayers.map(p=><button key={p.id} onClick={()=>void substitute(p.id)} disabled={!subOut||!startedPeriod} style={{minHeight:62}}><strong>#{p.shirtNumber??'—'} {p.displayName}</strong><br/><small>{p.position??'—'} · {((minutes[p.id]??0)/60).toFixed(1)} min</small></button>)}</div>{!benchPlayers.length&&<p>Não existem jogadores no banco.</p>}</section>
    <LiveCoding players={courtPlayers} period={period} timestampSeconds={period===1?seconds:HALF_SECONDS+seconds} onEvent={handleEvent}/>
    {!players.length&&<section className="section"><p>Este jogo ainda não tem convocados. Adiciona jogadores ao jogo antes de fazer live coding.</p></section>}
  </main>
}
