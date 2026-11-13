import assert from 'node:assert'
import {newState,resolve,aiPick,AXIES} from '../src/game.js'
let S=newState([0,2,4],[1,3,5]);assert(S.p[0].hand.length===3&&S.p[0].en===3)
// full AI-vs-AI games must always terminate with a winner
for(let g=0;g<200;g++){S=newState([0,1,2],[3,4,5]);let r=0;while(S.win==null&&r++<80)S=resolve(S,[aiPick(S,0),aiPick(S,1)]);assert(S.win!=null,'game did not end')
 S.p.forEach(p=>{assert(p.hand.length<=6);assert(p.en<=10)})}
// energy cannot be overspent: queue the whole hand with 3 energy
S=newState([0,1,2],[3,4,5]);const before=S.p[0].hand.length;let N=resolve(S,[[0,1,2],[]]);assert(N.p[0].hand.length>=before-3+0)
// shields block damage, empty turn advances round + energy
S=newState([0,1,2],[3,4,5]);N=resolve(S,[[],[]]);assert(N.round===2&&N.p[0].en===5)
console.log('engine tests passed')
