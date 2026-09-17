// Executes the actual generated mcfunctions' numeric/state commands, not a second Tween implementation.
// This is a deterministic regression harness, not a substitute for Minecraft rendering tests.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../datapack/data/monolith/function');
const cache=new Map();
const parse=s=>JSON.parse(s.replace(/([{,])\s*([a-zA-Z_][\w:.-]*)\s*:/g,'$1"$2":').replace(/(-?\d+(?:\.\d+)?)[fdbLs](?=[,}\]\s]|$)/g,'$1'));
const clone=x=>JSON.parse(JSON.stringify(x));
const parts=s=>s.replace(/\[(\d+)\]/g,'.$1').split('.');
function get(obj,key){return parts(key).reduce((a,k)=>a?.[k],obj);}
function assign(obj,key,value){const p=parts(key),last=p.pop();for(const k of p) obj=obj[k]??= {};obj[last]=clone(value);}
const range=(v,r)=>v!==undefined&&(r.includes('..')?((r.split('..')[0]===''||v>=+r.split('..')[0])&&(r.split('..')[1]===''||v<=+r.split('..')[1])):v===+r);
class Ret {constructor(n){this.n=n;}}
class VM {
  scores=new Map(); tags=new Set(); storage={}; commands=0;
  nbt={Pos:[0,0,0],Rotation:[30,20],transformation:{translation:[0,0,0],scale:[1,1,1],left_rotation:[0,0,0,1],right_rotation:[0,0,0,1]}};
  contextPos=[100,64,200];contextRot=[90,35];
  score(p,o){return this.scores.get(p+' '+o);}
  set(p,o,v){assert.ok(Number.isFinite(v),'finite score');assert.ok(v>=-2147483648&&v<=2147483647,'int32 overflow: '+v);this.scores.set(p+' '+o,v);}
  fn(name,args={}){
    name=name.replace(/^monolith:/,'');
    if(!cache.has(name))cache.set(name,fs.readFileSync(path.join(root,name+'.mcfunction'),'utf8').split(/\r?\n/));
    try{for(let line of cache.get(name)){line=line.trim();if(!line||line.startsWith('#'))continue;
      if(line.startsWith('$'))line=line.slice(1).replace(/\$\((\w+)\)/g,(_,k)=>{assert.ok(k in args,'Missing macro '+k);return args[k];});
      this.cmd(line);
    }}catch(e){if(e instanceof Ret)return e.n;throw new Error(name+': '+e.message,{cause:e});}return 1;
  }
  condition(s){
    let m=s.match(/^(if|unless) score (\S+) (\S+) matches (\S+)\s*/);
    if(m)return [m[1]==='if'?range(this.score(m[2],m[3]),m[4]):!range(this.score(m[2],m[3]),m[4]),s.slice(m[0].length)];
    m=s.match(/^(if|unless) score (\S+) (\S+) (=|>=|<=|>|<) (\S+) (\S+)\s*/);
    if(m){const a=this.score(m[2],m[3]),b=this.score(m[5],m[6]);const v=a!==undefined&&b!==undefined&&({'=':a===b,'>=':a>=b,'<=':a<=b,'>':a>b,'<':a<b}[m[4]]);return [m[1]==='if'?v:!v,s.slice(m[0].length)];}
    m=s.match(/^(if|unless) entity @s\[(tag|type)=([^\]]+)\]\s*/);
    if(m){const v=m[2]==='tag'?this.tags.has(m[3]):m[3]==='minecraft:block_display';return [m[1]==='if'?v:!v,s.slice(m[0].length)];}
    m=s.match(/^(if|unless) data storage (\S+) (\w+)(\{[^}]*\})\s*/);
    if(m){const expected=parse(m[4]),val=get(this.storage[m[2]],m[3]);const v=val&&Object.entries(expected).every(([k,x])=>val[k]===x);return [m[1]==='if'?!!v:!v,s.slice(m[0].length)];}
    throw Error('Unsupported condition: '+s);
  }
  cmd(s){
    this.commands++;
    let m;
    if(s.startsWith('return run '))throw new Ret(this.cmd(s.slice(11)));
    if(s.startsWith('return '))throw new Ret(+s.slice(7));
    if(s.startsWith('execute ')){
      const cut=s.indexOf(' run ');assert.ok(cut>0,s);let cond=s.slice(8,cut);let ok=true;
      while(cond.startsWith('if ')||cond.startsWith('unless ')){let [v,rest]=this.condition(cond);ok&&=v;cond=rest.trim();}
      if(!ok)return 0;
      const command=s.slice(cut+5);
      if(cond==='')return this.cmd(command);
      if(cond==='positioned as @s'){const saved=this.contextPos;this.contextPos=[...this.nbt.Pos];try{return this.cmd(command);}finally{this.contextPos=saved;}}
      m=cond.match(/^store result score (\S+) (\S+)$/);
      if(m){const v=this.cmd(command);this.set(m[1],m[2],v);return v;}
      m=cond.match(/^store result (entity|storage) (\S+) (\S+) (float|double|int) ([\d.e-]+)$/);
      if(m){const v=this.cmd(command)*+m[5];const obj=m[1]==='entity'?this.nbt:(this.storage[m[2]]??={});assign(obj,m[3],m[4]==='int'?Math.floor(v):v);return Math.floor(v);}
      throw Error('Unsupported execute: '+s);
    }
    m=s.match(/^function (\S+)(?: (.*))?$/);
    if(m){const args=m[2]?.startsWith('with storage ')?(()=>{const [id,p]=m[2].slice(13).split(' ');return p?get(this.storage[id],p):this.storage[id];})():(m[2]?parse(m[2]):{});return this.fn(m[1],args);}
    m=s.match(/^scoreboard players (set|add|remove) (\S+) (\S+) (-?\d+)$/);
    if(m){const v=+m[4];this.set(m[2],m[3],m[1]==='set'?v:(this.score(m[2],m[3])??0)+(m[1]==='add'?v:-v));return this.score(m[2],m[3]);}
    m=s.match(/^scoreboard players operation (\S+) (\S+) (\S+) (\S+) (\S+)$/);
    if(m){let a=this.score(m[1],m[2])??0,b=this.score(m[4],m[5]);assert.notEqual(b,undefined,'Missing operand '+s);let v;
      switch(m[3]){case '=':v=b;break;case '+=':v=a+b;break;case '-=':v=a-b;break;case '*=':v=a*b;break;case '/=':assert.notEqual(b,0);v=Math.floor(a/b);break;case '%=':assert.notEqual(b,0);v=((a%b)+b)%b;break;default:throw Error(s);}
      this.set(m[1],m[2],v);return v;
    }
    m=s.match(/^scoreboard players get (\S+) (\S+)$/);if(m){const v=this.score(m[1],m[2]);assert.notEqual(v,undefined,s);return v;}
    m=s.match(/^scoreboard players reset (\S+) (\S+)$/);if(m){this.scores.delete(m[1]+' '+m[2]);return 1;}
    if(s.startsWith('scoreboard objectives add '))return 1;
    m=s.match(/^tag @s (add|remove) (\S+)$/);if(m){this.tags[m[1]==='add'?'add':'delete'](m[2]);return 1;}
    m=s.match(/^tp @s (\S+) (\S+) (\S+)(?: (\S+) (\S+))?$/);
    if(m){const coord=(v,b)=>v.startsWith('~')?b+ +(v.slice(1)||0):+v;
      this.nbt.Pos=m.slice(1,4).map((v,i)=>coord(v,this.contextPos[i]));
      if(m[4])this.nbt.Rotation=m.slice(4,6).map((v,i)=>coord(v,this.contextRot[i]));return 1;
    }
    m=s.match(/^data modify (entity|storage) (\S+) (\S+) (set|merge) value (.*)$/);
    if(m){const obj=m[1]==='entity'?this.nbt:(this.storage[m[2]]??={}),v=parse(m[5]);assign(obj,m[3],m[4]==='set'?v:{...get(obj,m[3]),...v});return 1;}
    m=s.match(/^data get (entity|storage) (\S+) (\S+)(?: ([\d.e-]+))?$/);
    if(m){const v=get(m[1]==='entity'?this.nbt:this.storage[m[2]],m[3]);assert.equal(typeof v,'number',s);return Math.floor(v*+(m[4]??1));}
    throw Error('Unsupported command: '+s);
  }
}
function create(){const vm=new VM();
  // Execute constants and storage from load, omitting world selectors and objective declarations.
  for(const name of ['load','animation/track/load'])for(const s of fs.readFileSync(path.join(root,name+'.mcfunction'),'utf8').split(/\r?\n/))if(s.startsWith('scoreboard players set #')||s.startsWith('scoreboard players add #')||s.startsWith('data modify storage '))vm.cmd(s);
  return vm;
}
const names=fs.readdirSync(path.join(root,'animation/easing/resolve')).map(n=>n.replace('.mcfunction',''));
assert.equal(names.length,31);
const bounce=x=>{const n=7.5625,d=2.75;if(x<1/d)return n*x*x;if(x<2/d)return n*(x-1.5/d)**2+.75;if(x<2.5/d)return n*(x-2.25/d)**2+.9375;return n*(x-2.625/d)**2+.984375;};
const ins={quad:x=>x*x,cubic:x=>x**3,quart:x=>x**4,quint:x=>x**5,sine:x=>1-Math.cos(x*Math.PI/2),expo:x=>x===0?0:2**(10*x-10),circ:x=>1-Math.sqrt(1-x*x),back:x=>2.70158*x**3-1.70158*x*x,bounce:x=>1-bounce(1-x),elastic:x=>x===0?0:x===1?1:-(2**(10*x-10))*Math.sin((x*10-10.75)*2*Math.PI/3)};
function expected(name,x){if(name==='linear')return x;const cat=name.split('_').at(-1),f=ins[cat];
  if(name==='in_out_back'){const c=1.70158*1.525;return x<.5?(2*x)**2*((c+1)*2*x-c)/2:((2*x-2)**2*((c+1)*(2*x-2)+c)+2)/2;}
  if(name==='in_out_elastic'){const c=2*Math.PI/4.5;return x===0?0:x===1?1:x<.5?-(2**(20*x-10)*Math.sin((20*x-11.125)*c))/2:(2**(-20*x+10)*Math.sin((20*x-11.125)*c))/2+1;}
  return name.startsWith('in_out_')?(x<.5?f(2*x)/2:1-f(2-2*x)/2):name.startsWith('out_')?1-f(1-x):f(x);
}
let peak=0;
for(const name of names){const vm=create();vm.fn('animation/easing/resolve/'+name);let error=0;
  for(const t of [-1,0,...Array.from({length:199},(_,i)=>(i+1)*50),10000,10001]){
    vm.set('@s','ml_a_tmp0',t);vm.fn('animation/easing/dispatch');const v=vm.score('@s','ml_a_tmp1');
    const e=Math.abs(v/10000-expected(name,Math.min(10000,Math.max(0,t))/10000));error=Math.max(error,e);
    assert.ok(e<(name.includes('circ')?.06:name.includes('elastic')?.045:name.includes('expo')?.01:.004),name+' t='+t+' actual='+v+' error='+e);
    if(t<=0)assert.equal(v,0);if(t>=10000)assert.equal(v,10000);
  }peak=Math.max(peak,error);
}
console.log('PASS 31 easing curves: clamp, endpoints and 201 interior/boundary samples. Largest LUT error:',peak.toFixed(5));
function start(vm,property,from,to,duration,easing='linear'){vm.fn('animation/start',{property,from,to,duration,easing});}
const vm=create();start(vm,'translation_y',0,3000,20);start(vm,'rotation_y',0,90000,40);start(vm,'scale_xyz',250,1500,10,'out_back');
for(let i=1;i<=40;i++){vm.fn('animation/update');if(i===10)assert.equal(vm.nbt.transformation.scale[0],1.5);if(i===20){assert.equal(vm.nbt.transformation.translation[1],3);assert.equal(vm.score('@s','ml_r_active'),1);}}
assert.equal(vm.nbt.Rotation[0],90);assert.equal(vm.tags.has('monolith.animating'),false);
start(vm,'translation_x',0,5000,20);start(vm,'scale_xyz',500,2000,40);vm.fn('animation/update');start(vm,'translation_z',0,1000,3);
assert.equal(vm.score('@s','ml_s_elapsed'),1);assert.equal(vm.score('@s','ml_s_active'),1);
start(vm,'rotation_x',0,30000,0);assert.equal(vm.nbt.Rotation[1],30);assert.equal(vm.score('@s','ml_s_active'),1);
start(vm,'rotation_x',0,-30000,-2);assert.equal(vm.nbt.Rotation[1],-30);
const before=clone(vm.nbt);vm.fn('animation/cancel_translation');assert.deepEqual(vm.nbt,before);assert.equal(vm.score('@s','ml_s_active'),1);
vm.fn('animation/cancel');assert.deepEqual(vm.nbt,before);assert.equal(vm.tags.has('monolith.animating'),false);
console.log('PASS simultaneous tracks, differing durations, overwrite isolation, immediate finish and cancellation.');
for(const type of ['linear','arc','bezier'])for(const space of ['local','world']){
  const p=create();p.fn('animation/path/'+type,{space,sx:0,sy:0,sz:0,ex:10000,ey:0,ez:0,cx:5000,cy:6000,cz:2000,height:3000,duration:10,easing:'linear'});
  for(let i=0;i<5;i++)p.fn('animation/update');
  const pos=space==='local'?p.nbt.transformation.translation:p.nbt.Pos;
  assert.equal(pos[0],5);assert.equal(pos[1],type==='linear'?0:3);assert.equal(pos[2],type==='bezier'?1:0);
  for(let i=0;i<5;i++)p.fn('animation/update');assert.deepEqual(space==='local'?p.nbt.transformation.translation:p.nbt.Pos,[10,0,0]);
}
// Arc / Bezier retain eased overshoot, and failed starts do not overwrite the current path.
const p=create();const cfg={space:'local',sx:0,sy:0,sz:0,ex:1000,ey:0,ez:0,height:1000,duration:20,easing:'out_back'};
p.fn('animation/path/arc',cfg);p.set('@s','ml_a_value',11000);p.fn('animation/path/evaluate');assert.ok(p.nbt.transformation.translation[0]>1);assert.ok(p.nbt.transformation.translation[1]<0);
const old=p.score('@s','ml_end_x');p.fn('animation/path/arc',{...cfg,ex:200000000});assert.equal(p.score('@s','ml_end_x'),old);
console.log('PASS Linear/Arc/Bezier local/world midpoint, exact endpoint, overshoot and invalid argument isolation.');
for(const axis of 'xyz')for(const angle of [-450000,0,45123,90000,360000,720000]){
  const r=create();r.tags.add('monolith.child');start(r,'local_rotation_'+axis,0,angle,0);
  assert.deepEqual(r.nbt.Rotation,[30,20]);const q=r.nbt.transformation.left_rotation;
  assert.ok(Math.abs(q.reduce((s,x)=>s+x*x,0)-1)<.0005,'Quaternion unit length');
  assert.ok(Math.abs(q['xyz'.indexOf(axis)]**2-Math.sin(angle*Math.PI/360000)**2)<.0003);
}
const child=create();child.set('#selected','ml_parent_id',7);child.fn('animation/parent/bind',{mode:'full_rotation',anchor:'eyes'});
assert.equal(child.score('@s','ml_parent_ref'),7);assert.equal(child.score('@s','ml_parent_mode'),2);assert.equal(child.score('@s','ml_parent_eye'),1);
start(child,'translation_y',0,3000,20);child.fn('animation/update');assert.equal(child.score('@s','ml_t_elapsed'),0);
child.set('@s','ml_parent_seen',1);child.fn('animation/update');assert.equal(child.score('@s','ml_t_elapsed'),1);
child.fn('animation/parent/unbind');child.fn('animation/update');assert.equal(child.score('@s','ml_t_elapsed'),2);
console.log('PASS local rotation composition, parent binding, missing-parent freeze, resume and detach.');
for(const world of [0,1])for(const mode of [0,1,2]){
  const c=create();c.tags.add('monolith.child');c.set('@s','ml_space',world);c.set('@s','ml_parent_mode',mode);
  c.nbt.Pos=[12,65,25];c.nbt.Rotation=[15,10];start(c,'local_rotation_y',0,90000,0);
  const q=clone(c.nbt.transformation.left_rotation);c.fn('animation/parent/follow');
  assert.deepEqual(c.nbt.Pos,world?[12,65,25]:[100,64,200]);
  assert.deepEqual(c.nbt.Rotation,mode===0?[15,10]:mode===1?[90,0]:[90,35]);
  assert.deepEqual(c.nbt.transformation.left_rotation,q);
}
console.log('PASS actual follow commands for position/yaw/full_rotation, world position override, and independent child quaternion.');
const rotating=create();rotating.tags.add('monolith.child');rotating.set('@s','ml_parent_seen',1);
start(rotating,'rotation_y',0,90000,20);assert.equal(rotating.score('@s','ml_r_property'),11);
rotating.fn('animation/update');rotating.fn('animation/parent/unbind');
const body=clone(rotating.nbt.Rotation);rotating.fn('animation/update');assert.deepEqual(rotating.nbt.Rotation,body);
console.log('PASS legacy rotation stays local across parent detach.');
// Run the sample's actual API calls through both stages, checking continuity and cleanup timing.
for(let i=0;i<5;i++){
  const sample=create();sample.set('#selected','ml_parent_id',1);
  const setup=fs.readFileSync(path.join(root,`animation/debug/sentinel_part_${i}.mcfunction`),'utf8');
  for(const line of setup.split(/\r?\n/))if(line.startsWith('function '))sample.cmd(line);
  sample.set('@s','ml_parent_seen',1);
  for(let tick=0;tick<80;tick++)sample.fn('animation/update');
  const endpoint=clone(sample.nbt.transformation);
  sample.fn(`animation/debug/sentinel_return_${i}`);
  assert.deepEqual(sample.nbt.transformation,endpoint,'Sample stage jump '+i);
  for(let tick=0;tick<40;tick++)sample.fn('animation/update');
  assert.deepEqual(sample.nbt.transformation.translation,[0,0,0]);
  assert.deepEqual(sample.nbt.transformation.scale,[0,0,0]);
  assert.equal(sample.tags.has('monolith.animating'),false);
}
console.log('PASS sentinel sample: five parts, continuous stage transition, all tracks finish at tick 120.');
// Static references, JSON and macro files. Engine command syntax is checked in Minecraft separately.
let count=0;
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,ent.name);if(ent.isDirectory())walk(f);else if(f.endsWith('.mcfunction')){count++;const s=fs.readFileSync(f,'utf8');for(const m of s.matchAll(/(?:^| run |return run )function monolith:([a-z0-9_./-]+)(?=\s|$)/gm))assert.ok(fs.existsSync(path.join(root,m[1]+'.mcfunction')),f+' -> '+m[1]);}}}
walk(root);
JSON.parse(fs.readFileSync(path.resolve(root,'../../../pack.mcmeta'),'utf8'));
console.log('PASS static references across '+count+' functions. No rendering or Minecraft command-parser claim.');
