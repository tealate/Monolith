// Regression checks execute the generated functions, including overflow-checked scoreboard arithmetic.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {VM} from './animation-test-vm.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../datapack/data/monolith_anim/function');
const fresh=()=>{const v=new VM();v.fn('layer/load');v.fn('layer/init');return v;};
const score=(v,n)=>v.score('@s',n);
const values=v=>['tx','ty','tz','rx','ry','rz','sx','sy','sz'].map(c=>score(v,'ml_l_'+c));
const start=(v,slot,property,from,to,duration,easing='linear')=>v.fn('layer/start',{slot,property,from,to,duration,easing});
const tick=(v,n=1)=>{for(let i=0;i<n;i++)v.fn('layer/tick');};
const startPath=(v,type,slot=0,extra={})=>v.fn('path/'+type,{slot,sx:0,sy:0,sz:0,ex:10000,ey:0,ez:0,cx:5000,cy:6000,cz:2000,height:3000,duration:10,easing:'linear',...extra});

const axes=fresh();
for(const [i,c] of ['translation_x','translation_y','translation_z','rotation_x','rotation_y','rotation_z','scale_x','scale_y','scale_z'].entries())start(axes,0,c,i<6?0:1000,(i+1)*1000,i+1);
tick(axes,1);assert.deepEqual(values(axes),[1000,1000,999,1000,1000,999,1856,1875,1000]);
tick(axes,8);assert.deepEqual(values(axes),[1000,2000,3000,4000,5000,6000,7000,8000,1000]);
// scale_z=9000 is rejected; its prior identity value must survive.
assert.equal(score(axes,'ml_l0sza'),0);
console.log('PASS independent XYZ translation/rotation/scale durations and per-property validation.');

const mixed=fresh();
start(mixed,0,'translation_x',1000,1000,0);start(mixed,1,'translation_x',2000,2000,0);
start(mixed,2,'rotation_y',30000,30000,0);start(mixed,3,'rotation_y',60000,60000,0);
start(mixed,0,'scale_xyz',2000,2000,0);start(mixed,1,'scale_x',500,500,0);
assert.deepEqual(values(mixed),[3000,0,0,0,90000,0,1000,2000,2000]);
mixed.fn('layer/clear',{slot:1});assert.deepEqual(values(mixed),[1000,0,0,0,90000,0,2000,2000,2000]);
for(let i=0;i<4;i++)start(mixed,i,'scale_xyz',8000,8000,0);
assert.deepEqual(values(mixed).slice(6),[32000,32000,32000]);
console.log('PASS additive translation/Euler, multiplicative scale, identity clear, scale saturation.');

for(const type of ['linear','arc','bezier']){
  const v=fresh();startPath(v,type);start(v,0,'rotation_x',0,90000,10);start(v,1,'translation_x',0,2000,10);
  tick(v,5);assert.equal(score(v,'ml_l_tx'),6000);assert.equal(score(v,'ml_l_ty'),type==='linear'?0:3000);assert.equal(score(v,'ml_l_tz'),type==='bezier'?1000:0);assert.equal(score(v,'ml_l_rx'),45000);
  tick(v,5);assert.deepEqual(values(v).slice(0,6),[12000,0,0,90000,0,0]);assert.equal(score(v,'ml_l0_path'),0);
}
const interrupt=fresh();startPath(interrupt,'bezier',0);startPath(interrupt,'arc',1);tick(interrupt,2);
const frozenY=score(interrupt,'ml_l0tyv'),frozenZ=score(interrupt,'ml_l0tzv');
start(interrupt,0,'translation_x',0,4000,4);assert.equal(score(interrupt,'ml_l0_path'),0);assert.equal(score(interrupt,'ml_l1_path'),2);
tick(interrupt,2);assert.equal(score(interrupt,'ml_l0tyv'),frozenY);assert.equal(score(interrupt,'ml_l0tzv'),frozenZ);assert.equal(score(interrupt,'ml_l1_pt'),4);
startPath(interrupt,'linear',0);assert.equal(score(interrupt,'ml_l0txa'),0);assert.equal(score(interrupt,'ml_l0_path'),1);
console.log('PASS linear/arc/Bezier midpoints and endpoints; per-slot path ownership and scalar interruption isolation.');

const lifecycle=fresh();start(lifecycle,0,'translation_x',0,10000,10);start(lifecycle,1,'translation_y',0,20000,10);tick(lifecycle,2);
lifecycle.fn('layer/pause',{slot:0});tick(lifecycle,3);assert.equal(score(lifecycle,'ml_l_tx'),2000);assert.equal(score(lifecycle,'ml_l_ty'),10000);
lifecycle.fn('layer/resume',{slot:0});tick(lifecycle,1);assert.equal(score(lifecycle,'ml_l_tx'),3000);
lifecycle.fn('layer/cancel',{slot:0});tick(lifecycle,2);assert.equal(score(lifecycle,'ml_l_tx'),3000);assert.equal(score(lifecycle,'ml_l0_used'),1);
lifecycle.fn('layer/finish',{slot:1});assert.equal(score(lifecycle,'ml_l_ty'),20000);
lifecycle.fn('layer/clear',{slot:0});assert.equal(score(lifecycle,'ml_l_tx'),0);assert.equal(score(lifecycle,'ml_l0_used'),0);
startPath(lifecycle,'bezier',2);lifecycle.fn('layer/pause',{slot:2});lifecycle.fn('layer/finish',{slot:2});assert.equal(score(lifecycle,'ml_l2txv'),10000);assert.equal(score(lifecycle,'ml_l2_path'),0);
const allocation=fresh();for(let i=0;i<4;i++){allocation.fn('layer/start_auto',{property:'translation_x',from:0,to:i*1000,duration:0,easing:'linear'});assert.equal(score(allocation,'ml_l_slot'),i);assert.equal(score(allocation,'ml_l_ok'),1);}
allocation.fn('layer/allocate');assert.equal(score(allocation,'ml_l_slot'),-1);assert.equal(score(allocation,'ml_l_ok'),0);
allocation.fn('layer/clear',{slot:2});allocation.fn('layer/allocate');assert.equal(score(allocation,'ml_l_slot'),2);
console.log('PASS pause/resume/cancel/finish/clear and deterministic four-slot allocation/exhaustion/reuse.');

const invalid=fresh();startPath(invalid,'arc');tick(invalid,2);
const snapshot=()=>Object.fromEntries([...invalid.scores].filter(([key])=>key.startsWith('@s ml_l0')));
for(const arg of [{slot:4},{duration:200001},{duration:-1},{sx:1000001},{height:-1000001}]){const before=snapshot();startPath(invalid,'arc',0,arg);assert.equal(score(invalid,'ml_l_ok'),0);assert.deepEqual(snapshot(),before);}
for(const args of [[0,'translation_x',0,1000001,10],[0,'rotation_x',0,3600001,10],[0,'scale_x',0,8001,10],[0,'translation_x',0,0,-1],[4,'translation_x',0,0,10]]){const before=snapshot();start(invalid,...args);assert.equal(score(invalid,'ml_l_ok'),0);assert.deepEqual(snapshot(),before);}
const stateBefore=[...invalid.scores];invalid.fn('layer/init');assert.deepEqual([...invalid.scores],stateBefore);
console.log('PASS invalid starts preserve running state and idempotent initialization.');

const easings=fs.readdirSync(path.join(root,'easing/resolve')).map(n=>n.slice(0,-11));assert.equal(easings.length,31);
for(const easing of easings){
  const v=fresh();start(v,0,'translation_x',-1000000,1000000,40,easing);start(v,0,'rotation_z',-3600000,3600000,40,easing);start(v,0,'scale_x',-8000,8000,40,easing);
  startPath(v,'arc',1,{sx:-1000000,sy:-1000000,sz:-1000000,ex:1000000,ey:1000000,ez:1000000,height:1000000,duration:40,easing});
  startPath(v,'bezier',2,{sx:1000000,sy:1000000,sz:1000000,ex:-1000000,ey:-1000000,ez:-1000000,cx:-1000000,cy:1000000,cz:-1000000,duration:40,easing});
  tick(v,40);assert.equal(score(v,'ml_l0txv'),1000000);assert.equal(score(v,'ml_l0rzv'),3600000);assert.equal(score(v,'ml_l0sxv'),8000);
  assert.equal(score(v,'ml_l1txv'),1000000);assert.equal(score(v,'ml_l2txv'),-1000000);
}
const overshoot=fresh();start(overshoot,0,'translation_x',0,10000,20,'out_back');tick(overshoot,12);assert.ok(score(overshoot,'ml_l_tx')>10000);
const precision=fresh();start(precision,0,'translation_x',-1000000,999999,7);tick(precision,3);assert.equal(score(precision,'ml_l_tx'),-143001);
console.log('PASS all 31 curves at numeric limits without int32 overflow, exact endpoints, signed interpolation and overshoot.');

const idle=fresh();idle.commands=0;tick(idle);assert.ok(idle.commands<=8,'idle command count '+idle.commands);
const active=fresh();start(active,0,'translation_x',0,1000,100);active.commands=0;tick(active);const activeCommands=active.commands;
active.fn('layer/finish',{slot:0});active.commands=0;tick(active);assert.ok(active.commands<=8,'completed command count '+active.commands);
console.log(`PASS idle/completed gating (${idle.commands} interpreted commands/node/tick; one active scalar ${activeCommands}).`);

for(const dir of ['layer','path','easing','math'])walk(path.join(root,dir));
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(f.endsWith('.mcfunction')){const s=fs.readFileSync(f,'utf8');assert.ok(!s.includes('monolith:'),'legacy runtime dependency '+f);for(const m of s.matchAll(/\bfunction monolith_anim:([a-z0-9_./-]+)(?=\s|$)/g))assert.ok(fs.existsSync(path.join(root,m[1]+'.mcfunction')),f+' -> '+m[1]);}}}
console.log('PASS independent namespace and static function references. Minecraft command parsing/rendering remain separate checks.');
