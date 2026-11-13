// Battle engine: pure functions, shared by solo (AI) and online (host-authoritative) modes.
// card tuple: [name, energy cost, damage, shield, heal]
export const CLS={
 beast:[['Nut Crack',1,26,0,0],['Ronin',2,50,0,0],['Fur Wall',1,0,30,0],['Rage Bite',1,20,12,0]],
 aquatic:[['Tail Slap',1,24,0,0],['Aqua Stream',2,46,0,10],['Bubble Guard',1,0,28,0],['Tide Heal',1,0,10,24]],
 plant:[['Leaf Blade',1,24,0,0],['Vine Lash',2,48,0,0],['Bark Armor',1,0,32,0],['Photosynth',1,0,0,28]],
 bird:[['Peck',1,22,0,0],['Dive Bomb',2,52,0,0],['Feather Fan',1,0,26,0],['Gale Dash',1,20,14,0]],
 bug:[['Sting',1,25,0,0],['Swarm',2,46,0,8],['Shell Up',1,0,30,0],['Sticky Goo',1,18,0,14]],
 reptile:[['Claw',1,26,0,0],['Venom Bite',2,50,0,0],['Scale Plate',1,0,30,0],['Regrow',1,12,0,22]]}
export const COL={beast:'#ffb030',aquatic:'#12b8d0',plant:'#74c000',bird:'#ff8bb0',bug:'#ff5638',reptile:'#c98ee0'}
// [name, class, hp, speed, secondary-class card]
export const AXIES=[['Hexa','beast',120,60,'bug'],['Rook','beast',140,45,'reptile'],['Tidus','aquatic',110,70,'plant'],['Mira','aquatic',130,50,'bird'],
 ['Fern','plant',150,35,'aquatic'],['Thorn','plant',125,55,'beast'],['Skye','bird',100,85,'bug'],['Zephyr','bird',115,75,'aquatic'],
 ['Buzz','bug',105,80,'plant'],['Chitin','bug',135,40,'bird'],['Scaly','reptile',125,60,'beast'],['Viper','reptile',110,72,'plant']]
const ADV={plant:'aquatic',aquatic:'bird',bird:'plant',beast:'bug',bug:'reptile',reptile:'beast'}
export const card=id=>{const[c,k]=id.split(':');const[n,cost,d,s,h]=CLS[c][k];return{n,cost,d,s,h,cls:c}}
const rnd=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const deckOf=i=>{const[,c,,,x]=AXIES[i];return[c+':0',c+':1',c+':2',x+':3']};
function draw(p){p.hand=p.hand.filter(c=>p.ax[c.a].hp>0);let n=0;while(n<3&&p.hand.length<6){if(!p.deck.length){if(!p.disc.length)break;p.deck=rnd(p.disc);p.disc=[]}
 const c=p.deck.pop();if(p.ax[c.a].hp>0){p.hand.push(c);n++}}}
const mk=t=>({ax:t.map(i=>({i,hp:AXIES[i][2],max:AXIES[i][2],sh:0})),deck:rnd(t.flatMap((i,a)=>deckOf(i).map(c=>({c,a})))),hand:[],disc:[],en:3});
export function newState(t0,t1){const S={round:1,win:null,ev:[],log:['Battle start!'],p:[mk(t0),mk(t1)]};S.p.forEach(draw);return S}
// pk = [[handIdx,...],[handIdx,...]] in the order each player queued their cards
export function resolve(S0,pk){
 const S=JSON.parse(JSON.stringify(S0));S.ev=[];S.log=S.log.slice(-10);const plays=[];
 for(const s of [0,1]){const p=S.p[s];let en=p.en;const used=[];
  for(const i of pk[s]||[]){const c=p.hand[i];if(!c||used.includes(i)||p.ax[c.a].hp<=0)continue;const cd=card(c.c);if(cd.cost>en)continue;
   en-=cd.cost;used.push(i);plays.push({s,c,cd,spd:AXIES[p.ax[c.a].i][3]})}
  p.en=en;p.disc.push(...used.map(i=>p.hand[i]));p.hand=p.hand.filter((_,i)=>!used.includes(i))}
 plays.sort((a,b)=>b.spd-a.spd||a.s-b.s);const combo={};
 for(const{s,c,cd}of plays){
  const me=S.p[s],fo=S.p[1-s],ax=me.ax[c.a];if(ax.hp<=0)continue;
  const k=s+'_'+c.a;combo[k]=(combo[k]||0)+1;const m=1+0.1*(combo[k]-1),nm=AXIES[ax.i][0];
  if(cd.d){const ti=fo.ax.findIndex(x=>x.hp>0);if(ti<0)continue;const t=fo.ax[ti],B=AXIES[t.i][1];
   const d=Math.round(cd.d*m*(ADV[cd.cls]===B?1.2:ADV[B]===cd.cls?0.8:1));const ab=Math.min(t.sh,d);t.sh-=ab;t.hp=Math.max(0,t.hp-(d-ab));
   S.ev.push({s,a:c.a,ts:1-s,ta:ti,t:'dmg',v:d});S.log.push(`${nm} used ${cd.n} on ${AXIES[t.i][0]}: -${d}${ab?` (${ab} blocked)`:''}${t.hp<=0?' defeated!':''}`)}
  if(cd.s){ax.sh+=cd.s;S.ev.push({s,a:c.a,ts:s,ta:c.a,t:'sh',v:cd.s});S.log.push(`${nm} used ${cd.n}: +${cd.s} shield`)}
  if(cd.h){const h=Math.min(cd.h,ax.max-ax.hp);ax.hp+=h;S.ev.push({s,a:c.a,ts:s,ta:c.a,t:'heal',v:h});S.log.push(`${nm} used ${cd.n}: +${h} HP`)}
  if(S.p.some(p=>p.ax.every(x=>x.hp<=0)))break}
 const d0=S.p[0].ax.every(x=>x.hp<=0),d1=S.p[1].ax.every(x=>x.hp<=0);
 if(d0||d1){S.win=d0&&d1?2:d0?1:0;return S}
 S.p.forEach(p=>{p.ax.forEach(x=>x.sh=0);p.en=Math.min(10,p.en+2);draw(p)});S.round++;return S}
export function aiPick(S,s){const p=S.p[s];let en=p.en;const pk=[];
 const sc=p.hand.map((c,i)=>{const d=card(c.c),ax=p.ax[c.a],low=ax.hp/ax.max<.6;
  return{i,d,v:ax.hp<=0?-1:(d.d+(low?(d.s+d.h)*1.3:(d.s+d.h)*.3))/d.cost+Math.random()*8}}).sort((a,b)=>b.v-a.v);
 for(const x of sc)if(x.v>0&&x.d.cost<=en){en-=x.d.cost;pk.push(x.i)}
 return pk}
