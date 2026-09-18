// Complete offline validation. Server tests, when available, run separately.
import './test-animation-layers.mjs';
import './test-animation-nodes.mjs';
import './test-animation-sequence.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]);}
const engine=path.join(repo,'datapack/data/monolith_anim');
const functions=[...walk(engine),...walk(path.join(repo,'datapack/data/monolith/function/animation/demo'))].filter(p=>p.endsWith('.mcfunction'));
const json=[...walk(path.join(engine,'tags')), ...['load','tick'].map(type=>path.join(repo,`datapack/data/minecraft/tags/function/${type}.json`)),path.join(repo,'datapack/pack.mcmeta')];
let refs=0;
for(const f of json)JSON.parse(fs.readFileSync(f,'utf8'));
for(const f of functions){
 const text=fs.readFileSync(f,'utf8');
 for(const m of text.matchAll(/\bfunction ([a-z0-9_.-]+):([a-z0-9_./-]+)(?=[\s"},]|$)/g)){
  assert.ok(fs.existsSync(path.join(repo,'datapack/data',m[1],'function',m[2]+'.mcfunction')),`${path.relative(repo,f)} missing ${m[1]}:${m[2]}`);refs++;
 }
 if(f.includes(path.join('data','monolith_anim')))assert.ok(!/\b(?:function|storage) monolith:/.test(text),'Engine runtime depends on consumer: '+f);
}
for(const kind of ['load','tick']){const tag=JSON.parse(fs.readFileSync(path.join(repo,`datapack/data/minecraft/tags/function/${kind}.json`),'utf8'));assert.equal(tag.values.filter(v=>v==='monolith_anim:'+kind).length,1);}
console.log(`Static validation passed: ${functions.length} functions, ${refs} literal function references, JSON, isolated engine namespace and load/tick tags.`);
