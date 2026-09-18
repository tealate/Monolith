// Runs generated Sequencer mcfunctions with entity selectors, NBT, macros and execute contexts.
// Consumer functions are tiny mcfunction fixtures; layer calls are recorded integration boundaries.
// Does not claim Minecraft parser, client or world-runtime verification.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../datapack/data/monolith_anim/function');
const copy=v=>v===undefined?undefined:structuredClone(v);
const parse=s=>JSON.parse(s.replace(/([{,])\s*([a-zA-Z_][\w.-]*)\s*:/g,'$1"$2":'));
const parts=s=>Array.from(s.matchAll(/"([^"]+)"|([^.[\]]+)|\[(-?\d+)\]/g),m=>m[1]??(m[3]!==undefined?+m[3]:m[2]));
const at=(obj,key)=>typeof key==='number'&&key<0?obj?.length+key:key;
function get(obj,p){for(const k of parts(p))obj=obj?.[at(obj,k)];return obj;}
function set(obj,p,v){const keys=parts(p),last=keys.pop();for(let i=0;i<keys.length;i++){const k=at(obj,keys[i]);obj=obj[k]??=(typeof (keys[i+1]??last)==='number'?[]:{});}obj[at(obj,last)]=copy(v);}
function del(obj,p){const keys=parts(p),last=keys.pop();for(const k of keys)obj=obj?.[at(obj,k)];if(!obj)return;if(Array.isArray(obj))obj.splice(at(obj,last),1);else delete obj[last];}
const match=(value,expected)=>expected&&typeof expected==='object'?Object.entries(expected).every(([k,v])=>match(value?.[k],v)):value===expected;
const range=(v,r)=>v!==undefined&&(r.includes('..')?((r.split('..')[0]===''||v>=+r.split('..')[0])&&(r.split('..')[1]===''||v<=+r.split('..')[1])):v===+r);
class Ret{constructor(value){this.value=value;}}
class VM{
 entities=[];storage={};fake=new Map();fixtures=new Map();layer=[];commands=0;next=0;ctx={entity:null,pos:[0,0,0]};
 entity(name,pos=[0,0,0],type='minecraft:marker'){const e={name,id:++this.next,type,pos:[...pos],alive:true,tags:new Set(),scores:new Map(),nbt:{data:{}}};this.entities.push(e);return e;}
 select(sel,ctx=this.ctx){if(sel==='@s')return ctx.entity?.alive?[ctx.entity]:[];if(!sel.startsWith('@'))return [];
  const body=sel.match(/^@([esap])(?:\[(.*)\])?$/);assert.ok(body,sel);let es=body[1]==='s'?this.select('@s',ctx):this.entities.filter(e=>e.alive);
  for(const m of (body[2]??'').matchAll(/(?:^|,)(type|tag|scores|limit)=([^,{}]+|\{[^}]*\})/g)){
   const [,key,v]=m;if(key==='type')es=es.filter(e=>e.type===v);if(key==='tag')es=es.filter(e=>v.startsWith('!')?!e.tags.has(v.slice(1)):e.tags.has(v));
   if(key==='scores')for(const p of v.slice(1,-1).split(',')){const [o,r]=p.split('=');es=es.filter(e=>range(e.scores.get(o),r));}
   if(key==='limit')es=es.slice(0,+v);
  }return es;
 }
 holders(sel){return sel.startsWith('@')?this.select(sel).map(e=>e.scores):[this.fake];}
 key(sel,obj){return sel.startsWith('@')?obj:sel+' '+obj;}
 score(sel,obj){const h=this.holders(sel)[0];return h?.get(this.key(sel,obj));}
 setscore(sel,obj,value){assert.ok(Number.isFinite(value));for(const h of this.holders(sel))h.set(this.key(sel,obj),value);}
 obj(kind,id){return kind==='storage'?(this.storage[id]??={}):this.select(id)[0]?.nbt;}
 as(e,f){const old=this.ctx;this.ctx={entity:e,pos:[...e.pos]};try{return f();}finally{this.ctx=old;}}
 fn(name,args={}){
  if(name.startsWith('monolith_anim:layer/')){this.layer.push({owner:this.ctx.entity.name,action:name.split('/').at(-1),...args});return 1;}
  const source=this.fixtures.get(name)??fs.readFileSync(path.join(root,name.replace('monolith_anim:','')+'.mcfunction'),'utf8');
  try{for(let line of source.split(/\r?\n/)){line=line.trim();if(!line||line.startsWith('#'))continue;if(line.startsWith('$'))line=line.slice(1).replace(/\$\((\w+)\)/g,(_,key)=>{assert.ok(key in args,'Missing macro '+key+' in '+name);const v=args[key];return typeof v==='object'?JSON.stringify(v):String(v);});this.cmd(line);}}
  catch(e){if(e instanceof Ret)return e.value;throw new Error(name+': '+e.message,{cause:e});}return 1;
 }
 condition(prefix){let m;
  if((m=prefix.match(/^(if|unless) score (\S+) (\S+) matches (\S+)\s*/))){const yes=range(this.score(m[2],m[3]),m[4]);return [m[1]==='if'?yes:!yes,prefix.slice(m[0].length)];}
  if((m=prefix.match(/^(if|unless) score (\S+) (\S+) (=|>=|<=|>|<) (\S+) (\S+)\s*/))){const a=this.score(m[2],m[3]),b=this.score(m[5],m[6]);const yes=a!==undefined&&b!==undefined&&({'=':a===b,'>':a>b,'<':a<b,'>=':a>=b,'<=':a<=b}[m[4]]);return [m[1]==='if'?yes:!yes,prefix.slice(m[0].length)];}
  if((m=prefix.match(/^(if|unless) entity (\S+)\s*/))){const yes=this.select(m[2]).length>0;return [m[1]==='if'?yes:!yes,prefix.slice(m[0].length)];}
  if((m=prefix.match(/^(if|unless) data (storage|entity) (\S+) (\S+)\s*/))){const list=m[4].match(/^(.*?)\[(\{.*\})\]$/);let yes;if(list){const value=get(this.obj(m[2],m[3]),list[1]);yes=Array.isArray(value)&&value.some(x=>match(x,parse(list[2])));}else{const [p,...filter]=m[4].split(/(?=\{)/);const value=get(this.obj(m[2],m[3]),p);yes=filter.length?match(value,parse(filter.join(''))):value!==undefined;}return [m[1]==='if'?yes:!yes,prefix.slice(m[0].length)];}
  throw Error('Condition '+prefix);
 }
 execute(prefix,command){let m;prefix=prefix.trim();if(!prefix)return this.cmd(command);
  if(prefix.startsWith('if ')||prefix.startsWith('unless ')){const [ok,rest]=this.condition(prefix);return ok?this.execute(rest,command):0;}
  if((m=prefix.match(/^(as|at) (\S+)\s*/))){let result=0;const saved=this.ctx;for(const e of this.select(m[2])){this.ctx={entity:m[1]==='as'?e:saved.entity,pos:m[1]==='at'?[...e.pos]:saved.pos};try{result+=this.execute(prefix.slice(m[0].length),command);}finally{this.ctx=saved;}}return result;}
  if((m=prefix.match(/^summon (\S+)\s*/))){const e=this.entity('instance-'+this.next,this.ctx.pos,m[1]);const saved=this.ctx;this.ctx={entity:e,pos:[...saved.pos]};try{return this.execute(prefix.slice(m[0].length),command);}finally{this.ctx=saved;}}
  if((m=prefix.match(/^store result score (\S+) (\S+)\s*/))){const value=this.execute(prefix.slice(m[0].length),command);this.setscore(m[1],m[2],value);return value;}
  if((m=prefix.match(/^store result (storage|entity) (\S+) (\S+) int (\S+)\s*/))){const object=this.obj(m[1],m[2]);const value=this.execute(prefix.slice(m[0].length),command);if(object)set(object,m[3],Math.floor(value*+m[4]));return value;}
  throw Error('Execute '+prefix+' run '+command);
 }
 cmd(line){assert.ok(++this.commands<2000000,'Command runaway');let m;
  if(line.startsWith('return run '))throw new Ret(this.cmd(line.slice(11)));if(line.startsWith('return '))throw new Ret(+line.slice(7));
  if(line.startsWith('execute ')){const i=line.indexOf(' run ');assert.ok(i>0,line);return this.execute(line.slice(8,i),line.slice(i+5));}
  if((m=line.match(/^function (\S+)(?: (.*))?$/))){let args={};if(m[2]?.startsWith('with storage ')){const [id,p]=m[2].slice(13).split(' ');args=get(this.storage[id],p);}else if(m[2])args=parse(m[2]);return this.fn(m[1],copy(args));}
  if(line.startsWith('scoreboard objectives add '))return 1;
  if((m=line.match(/^scoreboard players (set|add|remove) (\S+) (\S+) (-?\d+)$/))){const v=m[1]==='set'?+m[4]:(this.score(m[2],m[3])??0)+(m[1]==='add'?+m[4]:-m[4]);this.setscore(m[2],m[3],v);return v;}
  if((m=line.match(/^scoreboard players get (\S+) (\S+)$/)))return this.score(m[1],m[2])??0;
  if((m=line.match(/^scoreboard players operation (\S+) (\S+) (=|\+=|-=) (\S+) (\S+)$/))){const b=this.score(m[4],m[5]);if(b===undefined)return 0;const a=this.score(m[1],m[2])??0;const v=m[3]==='='?b:m[3]==='+='?a+b:a-b;this.setscore(m[1],m[2],v);return v;}
  if((m=line.match(/^tag (\S+) (add|remove) (\S+)$/))){const es=this.select(m[1]);for(const e of es)e.tags[m[2]==='add'?'add':'delete'](m[3]);return es.length;}
  if((m=line.match(/^kill (\S+)$/))){const es=this.select(m[1]);for(const e of es)e.alive=false;return es.length;}
  if((m=line.match(/^tp @s ~ ~ ~$/))){for(const e of this.select('@s'))e.pos=[...this.ctx.pos];return 1;}
  if((m=line.match(/^data get (storage|entity) (\S+) (\S+)(?: (\S+))?$/))){const v=get(this.obj(m[1],m[2]),m[3]);return typeof v==='number'?Math.floor(v*+(m[4]??1)):Array.isArray(v)||typeof v==='string'?v.length:v?Object.keys(v).length:0;}
  if((m=line.match(/^data modify (storage|entity) (\S+) (\S+) (set|merge|append) (value|from) (.*)$/))){const object=this.obj(m[1],m[2]);if(!object)return 0;let value;if(m[5]==='value')value=parse(m[6]);else{const [kind,id,p]=m[6].split(' ');value=get(this.obj(kind,id),p);if(value===undefined)return 0;}
   if(m[4]==='merge')value={...get(object,m[3]),...value};if(m[4]==='append')value=[...(get(object,m[3])??[]),value];set(object,m[3],value);return 1;}
  if((m=line.match(/^data remove (storage|entity) (\S+) (\S+)$/))){del(this.obj(m[1],m[2]),m[3]);return 1;}
  throw Error('Command '+line);
 }
 define(id,definition){this.fn('monolith_anim:sequence/define',{id,definition});}
 api(e,name,args={}){return this.as(e,()=>this.fn('monolith_anim:sequence/'+name,args));}
 tick(){this.fn('monolith_anim:sequence/tick');}
 live(e){return this.entities.filter(x=>x.alive&&x.tags.has('monolith_anim.sequence')&&(!e||x.scores.get('ma_so_id')===e.scores.get('ma_so_id')));}
 fixture(id,body,definition={}){const tick='fixture:'+id;this.fixtures.set(tick,body);this.define(id,{tick,duration:10,...definition});}
}
function create(){const v=new VM();v.fn('monolith_anim:sequence/load');return v;}
// Parallel instances share owner execution but have independent inclusive clocks and isolated context.
{
 const v=create(),a=v.entity('A',[10,20,30]),b=v.entity('B',[40,50,60]);
 v.fixture('count','scoreboard players add @s hits 1\nexecute if score @s ml_seq_time matches 0 run scoreboard players add @s starts 1',{duration:2});
 v.api(a,'start',{id:'count'});v.api(a,'start',{id:'count'});v.api(b,'start',{id:'count'});
 assert.equal(v.live().length,3);assert.equal(a.scores.get('hits'),undefined);for(let i=0;i<3;i++)v.tick();
 assert.equal(a.scores.get('hits'),6);assert.equal(b.scores.get('hits'),3);assert.equal(a.scores.get('starts'),2);assert.equal(v.live().length,0);assert.equal(v.score('#current','ma_si_id'),0);
}
// A wait consumes its event once and resumes on the tick after the child's completion.
{
 const v=create(),a=v.entity('A');v.fixture('child','scoreboard players add @s child_hits 1',{duration:1});
 v.fixture('parent','execute if score @s ml_seq_time matches 0 run function monolith_anim:sequence/child {id:"child",mode:"wait"}\nexecute if score @s ml_seq_time matches 0 run scoreboard players add @s starts 1\nexecute if score @s ml_seq_time matches 1 run scoreboard players add @s continued 1',{duration:2});
 v.api(a,'start',{id:'parent'});v.tick();assert.equal(a.scores.get('starts'),1);assert.equal(a.scores.get('child_hits'),undefined);
 v.tick();v.tick();assert.equal(a.scores.get('continued'),undefined);v.tick();assert.equal(a.scores.get('continued'),1);v.tick();assert.equal(v.live().length,0);assert.equal(a.scores.get('starts'),1);
}
// Priority refusal is atomic; nested interrupts thaw the previous blocker before its waiter.
{
 const v=create(),a=v.entity('A');v.fixture('base','scoreboard players add @s base_ticks 1',{duration:9,priority:10,slot:0});
 v.fixture('hit','scoreboard players add @s hit_ticks 1',{duration:1,priority:50,slot:1});v.fixture('stun','scoreboard players add @s stun_ticks 1',{duration:0,priority:80,slot:2});
 const base=v.api(a,'start',{id:'base'});v.tick();assert.ok(base>0);assert.equal(v.api(a,'interrupt',{id:'base',mode:'pause'}),-5);assert.equal(v.live().length,1);
 const hit=v.api(a,'interrupt',{id:'hit',mode:'pause'});assert.ok(hit>0);assert.equal(v.api(a,'interrupt',{id:'base',mode:'replace'}),-3);
 const stun=v.api(a,'interrupt',{id:'stun',mode:'pause'});assert.ok(stun>0);v.tick();assert.equal(a.scores.get('base_ticks'),1);assert.equal(a.scores.get('hit_ticks'),undefined);
 v.tick();v.tick();assert.equal(a.scores.get('base_ticks'),1);v.tick();assert.equal(a.scores.get('base_ticks'),2);
 assert.deepEqual(v.layer.filter(x=>x.slot===0).map(x=>x.action),['pause','resume']);assert.deepEqual(v.layer.filter(x=>x.slot===1).map(x=>x.action),['pause','resume','resume']);
}
// A waited child may replace itself. Its parent stays blocked until the replacement ends.
{
 const v=create(),a=v.entity('A');v.fixture('new','scoreboard players add @s new_ticks 1',{duration:1});
 v.fixture('old','execute if score @s ml_seq_time matches 0 run function monolith_anim:sequence/child {id:"new",mode:"replace"}',{duration:10});
 v.fixture('parent','execute if score @s ml_seq_time matches 0 run function monolith_anim:sequence/child {id:"old",mode:"wait"}\nexecute if score @s ml_seq_time matches 1 run scoreboard players add @s continued 1',{duration:1});
 v.api(a,'start',{id:'parent'});v.tick();v.tick();v.tick();assert.equal(a.scores.get('continued'),undefined);v.tick();assert.equal(a.scores.get('continued'),undefined);v.tick();assert.equal(a.scores.get('continued'),1);assert.equal(v.live().length,0);
}
// Callback reason, ownership release, nested callbacks and exposed time restoration.
{
 const v=create(),a=v.entity('A');
 v.fixtures.set('fixture:cancel','execute if score @s ml_seq_reason matches 3 run scoreboard players add @s replaced 1\nfunction monolith_anim:sequence/start {id:"callback_child"}\nfunction monolith_anim:sequence/control {instance:2,action:"complete"}');
 v.fixtures.set('fixture:complete','scoreboard players add @s completes 1');
 v.fixture('callback_child','scoreboard players add @s callback_ticks 1',{duration:0});
 v.fixture('old','execute if score @s ml_seq_time matches 1 run function monolith_anim:sequence/child {id:"next",mode:"replace"}\nexecute if score @s ml_seq_time matches 1 run scoreboard players add @s restored 1',{duration:4,slot:0,on_cancel:'fixture:cancel',on_complete:'fixture:complete'});
 v.fixture('next','scoreboard players add @s next_ticks 1',{duration:0,slot:0});
 v.api(a,'start',{id:'old'});v.tick();v.tick();assert.equal(a.scores.get('replaced'),1);assert.equal(a.scores.get('completes'),undefined);assert.equal(a.scores.get('restored'),1);assert.equal(v.score('#current','ma_si_id'),0);assert.equal(v.score('#owner','ma_so_id'),0);
 assert.equal(v.layer.filter(x=>x.action==='clear').length,1);assert.equal(v.storage['monolith_anim:sequence'].frames.length,0);assert.equal(v.storage['monolith_anim:sequence'].requests.length,0);
}
// Manual pause is independent of a wait blocker, and resume cannot bypass a running child.
{
 const v=create(),a=v.entity('A');v.fixture('child','scoreboard players add @s child_ticks 1',{duration:1});
 v.fixture('parent','execute if score @s ml_seq_time matches 0 run function monolith_anim:sequence/child {id:"child",mode:"wait"}\nexecute if score @s ml_seq_time matches 1 run scoreboard players add @s resumed 1',{duration:1});
 const id=v.api(a,'start',{id:'parent'});v.tick();v.api(a,'control',{instance:id,action:'pause'});v.tick();v.tick();v.tick();assert.equal(a.scores.get('resumed'),undefined);v.api(a,'control',{instance:id,action:'resume'});v.tick();assert.equal(a.scores.get('resumed'),1);
}
// Reload preserves live states and definition snapshots; missing owner reclaims marker state.
{
 const v=create(),a=v.entity('A',[7,8,9]);v.fixture('old','scoreboard players add @s old_ticks 1',{duration:3,slot:0});
 const id=v.api(a,'start',{id:'old'});v.tick();v.fixtures.set('fixture:new','scoreboard players add @s new_ticks 1');v.define('old',{tick:'fixture:new',duration:0});v.fn('monolith_anim:sequence/load');a.pos=[20,30,40];v.tick();assert.equal(a.scores.get('old_ticks'),2);assert.equal(a.scores.get('new_ticks'),undefined);assert.deepEqual(v.live()[0].pos,a.pos);
 a.alive=false;v.tick();assert.equal(v.live().length,0);a.alive=true;v.api(a,'owner');assert.equal(a.scores.get('ml_sq_slot0'),0);assert.equal(v.score('#next','ma_si_id'),id);
}
// Shared slot denial does not pause/cancel anything; instance cap is enforced before mutation.
{
 const v=create(),a=v.entity('A');v.fixture('slot','return 1',{duration:9,slot:0});v.fixture('free','return 1',{duration:9});
 assert.ok(v.api(a,'start',{id:'slot'})>0);assert.equal(v.api(a,'start',{id:'slot'}),-5);for(let i=1;i<64;i++)assert.ok(v.api(a,'start',{id:'free'})>0);assert.equal(v.api(a,'start',{id:'free'}),-4);assert.equal(v.live().length,64);
}
console.log('PASS Sequencer generated-command regressions: parallel owners, wait once, priorities, nested pause, replacement wait transfer, callbacks, reload, missing owners, slot/cap failures.');
