import {useState,useEffect,useRef} from 'react'
import {ref,set,get,update,onValue} from 'firebase/database'
import {db,ok} from './firebase'
import {AXIES,COL,card,newState,resolve,aiPick} from './game'

const DEC={beast:'M25 28 L18 6 L42 22Z M75 28 L82 6 L58 22Z',aquatic:'M50 6 L38 26 L62 26Z M10 58 L-2 46 L12 70Z',plant:'M50 24 Q38 0 64 4 Q60 20 50 24Z',
 bird:'M12 46 L-6 28 L24 38Z M88 46 L106 28 L76 38Z',bug:'M38 24 L30 2 M62 24 L70 2',reptile:'M28 22 L37 6 L46 22 L55 6 L64 22Z'}
const Ax=({cls,flip})=>{const c=COL[cls];return <svg viewBox="-8 0 116 92" className="ax" style={{transform:flip?'scaleX(-1)':'none'}}>
 <path d={DEC[cls]} fill={c} stroke={c} strokeWidth="4" strokeLinejoin="round"/>
 <ellipse cx="32" cy="82" rx="12" ry="6" fill={c}/><ellipse cx="68" cy="82" rx="12" ry="6" fill={c}/>
 <ellipse cx="50" cy="56" rx="35" ry="28" fill={c} stroke="#0003" strokeWidth="3"/><ellipse cx="50" cy="68" rx="22" ry="13" fill="#fff" opacity=".35"/>
 {[38,62].map(x=><g key={x}><circle cx={x} cy="48" r="8" fill="#fff"/><circle cx={x+(flip?-2:2)} cy="49" r="4" fill="#222"/></g>)}
 <path d="M42 64 Q50 70 58 64" stroke="#222" strokeWidth="2.5" fill="none" strokeLinecap="round"/></svg>}

const L=(k,d)=>localStorage.getItem(k)||d
const CH='ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function TeamPick({onReady,onUnready,ready,title}){
 const [t,setT]=useState([])
 const tog=i=>!ready&&setT(t.includes(i)?t.filter(x=>x!==i):t.length<3?[...t,i]:t)
 return <div className="panel"><h3>{title||'Choose 3 Axies'} <span className="mut">(first pick fights in front)</span></h3>
  <div className="grid">{AXIES.map((a,i)=><button key={i} className={'pick'+(t.includes(i)?' on':'')} onClick={()=>tog(i)}>
   <div style={{width:70,margin:'0 auto'}}><Ax cls={a[1]}/></div><b>{t.includes(i)?`#${t.indexOf(i)+1} `:''}{a[0]}</b>
   <small>{a[1]} · HP {a[2]} · SPD {a[3]}</small></button>)}</div>
  <p className="flex">{ready?<button className="btn alt" onClick={onUnready}>Not ready — change team</button>
   :<button className="btn" disabled={t.length!==3} onClick={()=>onReady(t)}>{t.length===3?'Ready!':`Pick ${3-t.length} more`}</button>}</p></div>}

function Battle({S,names,me,onSubmit,submitted,act}){
 const [sel,setSel]=useState([]);useEffect(()=>setSel([]),[S.round]);
 const v=me??0,mine=S.p[v],play=me!==null&&!submitted&&S.win==null;
 const cost=i=>card(mine.hand[i].c).cost,spent=sel.reduce((n,i)=>n+cost(i),0);
 const tog=i=>{if(!play)return;if(sel.includes(i))return setSel(sel.filter(x=>x!==i));if(spent+cost(i)<=mine.en)setSel([...sel,i])};
 const team=(s,top)=>{const p=S.p[s],evs=S.ev||[];return <div className={'team '+(top?'top':'bot')} key={s+'-'+S.round}>
  <div className="nm">{names[s]||'…'}{s===me?' (you)':''}</div>
  <div className="row">{p.ax.map((x,a)=>{const li=evs.findIndex(e=>e.s===s&&e.a===a);return <div key={a} className={'unit'+(x.hp<=0?' out':'')}>
   {evs.map((e,j)=>e.ts===s&&e.ta===a&&<b key={j} className={'fl '+e.t} style={{animationDelay:j*.9+'s'}}>{e.t==='dmg'?'-':'+'}{e.v}{e.t==='sh'?' 🛡':''}</b>)}
   <div className={li>=0?'go':''} style={li>=0?{animationDelay:li*.9+'s'}:{}}><Ax cls={AXIES[x.i][1]} flip={s===1}/></div>
   <div className="hp"><i style={{width:x.hp/x.max*100+'%'}}/><span>{x.hp}/{x.max}</span></div>
   <small>{AXIES[x.i][0]}{x.sh>0&&<span className="shd"> 🛡{x.sh}</span>}</small></div>})}</div></div>};
 const w=S.win,res=w===2?'DRAW':me===null?`${names[w]||'Player'} wins!`:w===me?'VICTORY!':'DEFEAT';
 return <div><div className="arena">
  {S.win!=null&&<div className="ovl"><h2>{res}</h2><div className="flex">{act.rematch&&<button className="btn" disabled={act.waiting} onClick={act.rematch}>{act.waiting?'Waiting for opponent…':'Rematch'}</button>}<button className="btn alt" onClick={act.leave}>Leave</button></div></div>}
  {team(1-v,true)}<div style={{textAlign:'center',fontWeight:900,textShadow:'0 2px #000'}}>ROUND {S.round}</div>{team(v,false)}</div>
  {me!==null?<><div className="bar" style={{marginTop:10}}><span className="en">⚡ {mine.en-spent}/10</span>
   <button className="btn" disabled={!play} onClick={()=>onSubmit(sel)}>{submitted?'Waiting for opponent…':`End Turn (${sel.length} card${sel.length===1?'':'s'})`}</button></div>
   <div className="hand">{mine.hand.map((c,i)=>{const d=card(c.c),ax=mine.ax[c.a],n=sel.indexOf(i);
    return <button key={i} disabled={ax.hp<=0} className={'card '+d.cls+(n>=0?' sel':'')+(ax.hp<=0?' dis':'')} onClick={()=>tog(i)}>
     <u>{d.cost}</u>{n>=0&&<s>{n+1}</s>}<strong>{d.n}</strong><em>{AXIES[ax.i][0]}</em>
     <p>{d.d?`⚔${d.d} `:''}{d.s?`🛡${d.s} `:''}{d.h?`❤${d.h}`:''}</p></button>})}</div></>
   :<p className="bar mut">👁 Spectating — cards are hidden</p>}
  <div className="panel log">{S.log.slice().reverse().map((l,i)=><div key={i}>{l}</div>)}</div></div>}

function Solo({nick,leave}){
 const [S,setS]=useState(null),[team,setTeam]=useState(null);
 const go=t=>{setTeam(t);setS(newState(t,[...AXIES.keys()].sort(()=>Math.random()-.5).slice(0,3)))};
 if(!S)return <><TeamPick onReady={go} title="Solo practice — choose 3 Axies"/><button className="btn alt" onClick={leave}>Back</button></>;
 return <Battle S={S} names={[nick,'AI Bot']} me={0} onSubmit={pk=>setS(resolve(S,[pk,aiPick(S,1)]))} act={{rematch:()=>go(team),leave}}/>}

function Room({code,pid,leave}){
 const [R,setR]=useState(undefined),sig=useRef('');
 useEffect(()=>onValue(ref(db,'rooms/'+code),s=>setR(s.val())),[code]);
 const side=R?(R.host?.id===pid?0:R.guest?.id===pid?1:null):null;
 const ru=p=>update(ref(db,'rooms/'+code),p);
 useEffect(()=>{if(!R||side!==0)return;const rd=R.ready||{},g=R.games||0;
  const start=()=>ru({status:'battle',state:JSON.stringify(newState(R.teams[0],R.teams[1])),picks:null,ready:null,rematch:null,games:g+1});
  let k;if(R.status==='lobby'&&rd[0]&&rd[1]&&R.teams?.[0]&&R.teams?.[1]){k='L'+g;if(sig.current!==k){sig.current=k;start()}}
  else if(R.status==='battle'&&R.state){const S=JSON.parse(R.state),pk=R.picks?.[S.round];k='B'+g+'-'+S.round;
   if(pk&&pk[0]!=null&&pk[1]!=null&&sig.current!==k){sig.current=k;const N=resolve(S,[JSON.parse(pk[0]),JSON.parse(pk[1])]);ru({state:JSON.stringify(N),picks:null,status:N.win!=null?'over':'battle'})}}
  else if(R.status==='over'&&R.rematch?.[0]&&R.rematch?.[1]){k='R'+g;if(sig.current!==k){sig.current=k;start()}}},[R]);
 if(R===undefined)return <p>Connecting…</p>;
 if(R===null)return <div className="panel">Room not found. <button className="btn" onClick={leave}>Back</button></div>;
 const names=[R.host?.name,R.guest?.name],specs=Object.values(R.spec||{}),rd=R.ready||{};
 const S=R.state&&R.status!=='lobby'?JSON.parse(R.state):null;
 return <div><div className="panel flex" style={{justifyContent:'space-between'}}><div>Room <span className="code">{code}</span>
  <div className="mut">{side===null?'👁 You are spectating':'You are '+(side===0?'Host':'Guest')} · Spectators: {specs.length?specs.join(', '):'none'}</div></div>
  <button className="btn alt" onClick={leave}>Leave</button></div>
  {!S?<><div className="panel"><h3>Players</h3>
   {[0,1].map(s=><div key={s}>{s===side?'⭐ ':''}<b>{names[s]||'Waiting for player…'}</b> {names[s]&&(rd[s]?'✅ ready':'⏳ choosing team')}</div>)}
   <p className="mut">Share the room code <b>{code}</b> — a friend can join as the 2nd player or spectate.</p></div>
   {side!==null&&names[1]&&<TeamPick ready={!!rd[side]} onReady={t=>ru({['teams/'+side]:t,['ready/'+side]:true})} onUnready={()=>ru({['ready/'+side]:false})}/>}
   {side!==null&&!names[1]&&<p>Waiting for an opponent to join…</p>}</>
  :<Battle S={S} names={names} me={side} submitted={side!==null&&R.picks?.[S.round]?.[side]!=null}
    onSubmit={pk=>set(ref(db,`rooms/${code}/picks/${S.round}/${side}`),JSON.stringify(pk))}
    act={{leave,rematch:side!==null?()=>ru({['rematch/'+side]:true}):null,waiting:side!==null&&!!R.rematch?.[side]}}/>}</div>}

export default function App(){
 const [nick,setNick]=useState(L('axie_nick','')),[draft,setDraft]=useState(nick),[edit,setEdit]=useState(!nick);
 const [mode,setMode]=useState('home'),[code,setCode]=useState(''),[jc,setJc]=useState(''),[err,setErr]=useState('');
 const pid=useRef(null);if(!pid.current){pid.current=L('axie_pid','');if(!pid.current){pid.current=Math.random().toString(36).slice(2,10);localStorage.setItem('axie_pid',pid.current)}}
 const saveNick=()=>{const n=draft.trim().slice(0,16);if(!n)return;localStorage.setItem('axie_nick',n);setNick(n);setEdit(false)};
 const need=()=>{if(!nick){setErr('Enter a nickname first.');return true}if(!ok){setErr('Online play needs Firebase — see README. Solo mode works without it.');return true}setErr('');return false};
 const create=async()=>{if(need())return;const c=Array.from({length:5},()=>CH[Math.random()*CH.length|0]).join('');
  await set(ref(db,'rooms/'+c),{host:{id:pid.current,name:nick},status:'lobby',created:Date.now(),games:0});setCode(c);setMode('room')};
 const join=async spec=>{if(need())return;const c=jc.trim().toUpperCase(),r=ref(db,'rooms/'+c),s=await get(r);if(!s.exists())return setErr('Room not found.');
  const R=s.val(),id=pid.current;
  if(R.host?.id!==id&&R.guest?.id!==id){if(!spec&&!R.guest&&R.status==='lobby')await update(r,{guest:{id,name:nick}});else await set(ref(db,`rooms/${c}/spec/${id}`),nick)}
  setCode(c);setMode('room')};
 const leave=()=>{setMode('home');setCode('')};
 return <div className="wrap"><h1>⚔ Axie Classic Arena</h1>
  {mode==='ai'&&<Solo nick={nick} leave={leave}/>}{mode==='room'&&<Room code={code} pid={pid.current} leave={leave}/>}
  {mode==='home'&&<><div className="panel"><h3>Your nickname</h3>
   {edit?<div className="flex"><input value={draft} maxLength={16} placeholder="Enter nickname" onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveNick()}/>
    <button className="btn" onClick={saveNick} disabled={!draft.trim()}>Save</button>{nick&&<button className="btn alt" onClick={()=>{setDraft(nick);setEdit(false)}}>Cancel</button>}</div>
   :<div className="flex"><b style={{fontSize:20}}>{nick}</b><button className="btn alt" onClick={()=>setEdit(true)}>Change</button></div>}
   <p className="mut">No account needed. Saved on this device.</p></div>
   <div className="panel"><div className="flex"><button className="btn" onClick={()=>nick?setMode('ai'):setErr('Enter a nickname first.')}>🤖 Solo vs AI</button>
    <button className="btn alt" onClick={create}>🏠 Create private room</button></div>
    <h3 style={{marginTop:14}}>Join with a room code</h3><div className="flex"><input value={jc} maxLength={8} placeholder="ROOM CODE" onChange={e=>setJc(e.target.value.toUpperCase())}/>
    <button className="btn" disabled={!jc} onClick={()=>join(false)}>Join as player</button><button className="btn alt" disabled={!jc} onClick={()=>join(true)}>👁 Spectate</button></div>
    {err&&<p className="err">{err}</p>}</div>
   <div className="panel mut"><b>How to play:</b> each round you get 3 new cards (hand max 6) and +2 energy (max 10, start 3). Click cards to queue them (energy cost in the corner), then End Turn.
    Cards resolve fastest Axie first. Attacks hit the front living enemy. Shields last one round. Same-Axie combos add +10% each. Class advantage ±20%. Defeat all 3 enemy Axies to win.</div></>}</div>}
