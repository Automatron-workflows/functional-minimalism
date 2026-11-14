import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {composeStarterBrief} from '../demo/starter.mjs';
import {setupProject,readJSON} from '../src/node.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pack=await readJSON(path.join(root,'packs/studio/pack.json'));
test('downloaded starter briefs match installed setup for all three screens',async()=>{
 const temp=await mkdtemp(path.join(os.tmpdir(),'minimalism-export-'));
 try{for(const template of ['discovery','invoice','project']){
  const screen=await readJSON(path.join(root,`examples/${template}.screen.json`));
  const project=path.join(temp,template,'my-app');
  const setup=await setupProject(project,root,{template});
  assert.equal(composeStarterBrief(pack,screen),await readFile(setup.brief,'utf8'));
 }}finally{await rm(temp,{recursive:true,force:true});}
});
test('starter exports preserve applicable decisions without leaking other screens or mutating memory',async()=>{
 const screen=await readJSON(path.join(root,'examples/invoice.screen.json'));
 const make=(id,scope,target,rule)=>({id,scope,target,rule,reason:'Accepted in demo',status:'accepted',createdAt:'2026-11-14T00:00:00Z'});
 const memory={schema:'design-harness.memory/1',decisions:[make('project','project',screen.project,'Label unfamiliar actions.'),make('screen','screen',`${screen.project}/invoice`,'Keep the recipient visible.'),make('elsewhere','screen',`${screen.project}/discovery`,'Artwork first.')]};
 const before=JSON.stringify(memory),output=composeStarterBrief(pack,screen,memory);
 assert.match(output,/project:my-app: Label unfamiliar actions/);
 assert.match(output,/screen:my-app\/invoice: Keep the recipient visible/);
 assert.doesNotMatch(output,/Artwork first|demo\/components/);
 assert.equal(JSON.stringify(memory),before);
});
