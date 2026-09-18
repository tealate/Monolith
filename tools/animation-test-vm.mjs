// Strict numeric/state interpreter for the generated functions; never claims Minecraft parser or renderer coverage.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
const parse=s=>JSON.parse(s.replace(/([{,])\s*([a-zA-Z_][\w:.-]*)\s*:/g,'$1"$2":').replace(/(-?\d+(?:\.\d+)?)[fdbLs](?=[,}\]\s]|$)/g,'$1'));
const clone=x=>JSON.parse(JSON.stringify(x));
const parts=s=>s.replace(/\[(\d+)\]/g,'.$1').split('.');
function get(obj,key){return parts(key).reduce((a,k)=>a?.[k],obj);}
function assign(obj,key,value){const p=parts(key),last=p.pop();for(const k of p) obj=obj[k]??= {};obj[last]=clone(value);}
const range=(v,r)=>v!==undefined&&(r.includes('..')?((r.split('..')[0]===''||v>=+r.split('..')[0])&&(r.split('..')[1]===''||v<=+r.split('..')[1])):v===+r);
class Ret {constructor(n){this.n=n;}}
export class VM {
  constructor({root,namespace="monolith_anim"}={}) { this.root=root??path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../datapack/data/monolith_anim/function"); this.namespace=namespace; this.cache=new Map(); }
  scores=new Map(); tags=new Set(); storage={}; commands=0;
  nbt={Pos:[0,0,0],Rotation:[30,20],transformation:{translation:[0,0,0],scale:[1,1,1],left_rotation:[0,0,0,1],right_rotation:[0,0,0,1]}};
  contextPos=[100,64,200];contextRot=[90,35];
  score(p,o){return this.scores.get(p+' '+o);}
  set(p,o,v){assert.ok(Number.isFinite(v),'finite score');assert.ok(v>=-2147483648&&v<=2147483647,'int32 overflow: '+v);this.scores.set(p+' '+o,v);}
  fn(name,args={}){
    name=name.replace(this.namespace+"::", "").replace(this.namespace+":", "");
    if(!this.cache.has(name))this.cache.set(name,fs.readFileSync(path.join(this.root,name+'.mcfunction'),'utf8').split(/\r?\n/));
    try{for(let line of this.cache.get(name)){line=line.trim();if(!line||line.startsWith('#'))continue;
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
