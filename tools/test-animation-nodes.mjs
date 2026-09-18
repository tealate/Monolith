// Numeric regression of generated commands; entity lookup and rendering are not covered by this harness.
import assert from 'node:assert/strict';
import {VM} from './animation-test-vm.mjs';
const xyz=[...'xyz'],xyzw=[...'xyzw'];
class NodeVM extends VM {
 cmd(line){
  if(line.startsWith('data merge entity @s ')){
   const text=line.slice('data merge entity @s '.length).replace(/([{,])\s*([a-zA-Z_][\w:.-]*)\s*:/g,'$1"$2":').replace(/(-?\d+(?:\.\d+)?)[fdbLs](?=[,}\]\s]|$)/g,'$1');
   Object.assign(this.nbt,JSON.parse(text));this.commands++;return 1;
  }
  return super.cmd(line);
 }
}
function vm(){const v=new VM();v.fn('node/load');return v;}
function read(v,p){return [...p].map(a=>v.score('@s','ml_n_q'+a)/10000);}
function euler(v,angles){xyz.forEach((a,i)=>v.set('@s','ml_n_e'+a,angles[i]));v.fn('node/math/euler');return read(v,'xyzw');}
function multiply(a,b){return [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];}
function expected(angles){const [x,y,z]=angles.map(d=>d*Math.PI/360000);return multiply([0,0,Math.sin(z),Math.cos(z)],multiply([0,Math.sin(y),0,Math.cos(y)],[Math.sin(x),0,0,Math.cos(x)]));}
function near(a,b,tol,label){assert.equal(a.length,b.length);a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<=tol,`${label}[${i}]: ${v} vs ${b[i]}`));}
let worst=0;
for(const angles of [[0,0,0],[90000,0,0],[0,90000,0],[0,0,90000],[45000,80000,-123456],[720000,-1080000,333333],...Array.from({length:100},(_,i)=>[i*7921-350000,i*2377-130000,i*11731-550000])]){
 const v=vm(),q=euler(v,angles),e=expected(angles);const sign=q.reduce((s,x,i)=>s+x*e[i],0)<0?-1:1;
 near(q,e.map(x=>x*sign),.001,'Euler');worst=Math.max(worst,...q.map((x,i)=>Math.abs(x-sign*e[i])));
 assert.ok(Math.abs(q.reduce((s,x)=>s+x*x,0)-1)<.001,'normalized quaternion');
 const t=[1234567,-765432,2345678];xyz.forEach((a,i)=>v.set('@s','ml_n_t'+a,t[i]));v.fn('node/math/rotate');
 const result=multiply(multiply(e,[...t,0]),[-e[0],-e[1],-e[2],e[3]]).slice(0,3);
 near(xyz.map(a=>v.score('@s','ml_n_v'+a)),result,3500,'rotated long vector');
}
{
 const v=vm();euler(v,[0,90000,0]);xyz.forEach((a,i)=>v.set('@s','ml_n_t'+a,[0,0,3000][i]));v.fn('node/math/rotate');near(xyz.map(a=>v.score('@s','ml_n_v'+a)),[3000,0,0],3,'quarter turn');
 const parent=euler(v,[50000,80000,10000]),child=euler(v,[17000,-123000,74000]);xyzw.forEach((a,i)=>{v.set('@s','ml_n_a'+a,Math.round(parent[i]*10000));v.set('@s','ml_n_b'+a,Math.round(child[i]*10000));});v.fn('node/math/multiply');v.fn('node/math/normalize');near(read(v,'xyzw'),multiply(parent,child),.001,'hierarchy multiplication');
}
function node(pos=[0,0,0]){const v=new NodeVM();v.nbt.Pos=pos;v.nbt.Rotation=[0,0];v.fn('node/load');v.fn('layer/load');assert.equal(v.fn('node/init'),1);return v;}
const base=(v,tx,ty,tz,rx=0,ry=0,rz=0)=>v.fn('node/base',{tx,ty,tz,rx,ry,rz,sx:1000,sy:1000,sz:1000});
function childTick(parent,child){for(const a of xyz)child.set('#p'+a,'ml_n_math',parent.score('@s','ml_n_w'+a));for(const a of xyzw)child.set('#q'+a,'ml_n_math',parent.score('@s','ml_n_q'+a));child.set('#depth','ml_n_math',parent.score('@s','ml_n_depth'));child.fn('node/evaluate_child');}
{
 const root=node([10,64,20]),orbit=node(),part=node();
 base(root,0,0,0,0,90000,0);base(orbit,0,1000,2000,0,0,90000);base(part,1000,0,0);
 part.fn('layer/start',{slot:0,property:'translation_y',from:0,to:1000,duration:10,easing:'linear'});
 part.fn('layer/start',{slot:1,property:'scale_y',from:1000,to:2000,duration:10,easing:'linear'});
 root.fn('node/root');childTick(root,orbit);childTick(orbit,part);
 near(orbit.nbt.Pos,[12,65,20],.003,'parent yaw rotates child offset');
 near(part.nbt.Pos,[12,66,20.1],.008,'grandchild gets composed parent rotation and independent layer');
 near(part.nbt.transformation.scale,[1,1.1,1],.001,'scale independent from quaternion trig');
 const visible=JSON.stringify(root.nbt),before=root.commands;root.fn('node/root');assert.equal(JSON.stringify(root.nbt),visible,'static cache retains pose');const idleCommands=root.commands-before;
 root.fn('layer/start',{slot:0,property:'rotation_y',from:0,to:45000,duration:10,easing:'linear'});const activeBefore=root.commands;root.fn('node/root');const activeCommands=root.commands-activeBefore;assert.ok(activeCommands>idleCommands*2,'static transform avoids expensive math');
 for(let i=1;i<10;i++){childTick(root,orbit);childTick(orbit,part);}assert.equal(part.score('@s','ml_l_ty'),1000);assert.equal(part.nbt.transformation.scale[1],2);
 const pose=[...part.nbt.Pos];assert.equal(part.fn('parent/unbind'),1);part.fn('node/root');near(part.nbt.Pos,pose,.003,'unbind preserves world pose');
 console.log(`Node cache commands: idle ${idleCommands}, active single-axis root ${activeCommands} (interpreter command accounting).`);
}
// Generation invariants: no unnamed runtime cross-namespace dependency and bounded phase traversal.
const fs=await import('node:fs');
const tick=fs.readFileSync(new URL('../datapack/data/monolith_anim/function/node/tick.mcfunction',import.meta.url),'utf8');
assert.equal((tick.match(/ml_n_depth=/g)||[]).length,8);
console.log(`Node generated-command numeric tests passed; peak quaternion component error ${worst.toFixed(6)}.`);
