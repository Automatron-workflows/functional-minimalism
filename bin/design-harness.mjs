#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { validatePack, tokensToCSS, auditEvidence, invariant } from '../src/core.mjs';
import { initialize, setupProject, readScreen, doctor, readJSON, loadProject, remember, brief, checkProject, digest, regularFile, writeNew } from '../src/node.mjs';
const bundle=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),command=args.shift();
const positional=[],flags={};
try {
  while(args.length) { const a=args.shift(); if(a.startsWith('--')) { const key=a.slice(2); invariant(!Object.hasOwn(flags,key),`Duplicate option: ${a}`); flags[key]=['accept','json','compact'].includes(key)?true:args.shift(); invariant(flags[key]!==undefined && !(typeof flags[key]==='string' && flags[key].startsWith('--')),`Missing value for ${a}`); } else positional.push(a); }
  const allowed={setup:['pack','client','template'],doctor:['project'],init:['pack','client'],validate:[],tokens:['out'],brief:['project','out','compact'],check:['project','css'],audit:['project'],remember:['project','scope','target','rule','reason','accept','supersedes'],pin:['project'], 'import-tokens':['pack','out','source'],help:[]};
  invariant(!command || Object.hasOwn(allowed,command),`Unknown command: ${command}`);
  for(const flag of Object.keys(flags)) invariant(allowed[command]?.includes(flag),`Unknown option: --${flag}`);
  const project=path.resolve(flags.project??'.');
  let output;
  switch(command) {
    case 'setup': invariant(positional.length===1,'Usage: setup <project> [--template discovery|invoice|project] [--client both]'); output=await setupProject(path.resolve(positional[0]),bundle,{template:flags.template,client:flags.client,packPath:flags.pack?path.resolve(flags.pack):undefined});break;
    case 'doctor': invariant(!positional.length,'Usage: doctor [--project dir]');output=await doctor(project);if(output.status==='fail')process.exitCode=1;break;
    case 'init': invariant(positional.length===1,'Usage: init <project> [--pack pack.json] [--client both]'); output=await initialize(path.resolve(positional[0]),path.resolve(flags.pack??path.join(bundle,'packs/studio/pack.json')),bundle,flags.client??'both');break;
    case 'validate': invariant(positional.length===1,'Usage: validate <pack.json>'); output={valid:true,pack:validatePack(await readJSON(positional[0])).id};break;
    case 'tokens': { invariant(positional.length===1,'Usage: tokens <pack.json> [--out tokens.css]'); const css=tokensToCSS(await readJSON(positional[0])); if(flags.out){await writeNew(path.resolve(flags.out),css);output={written:path.resolve(flags.out)};}else output=css; break;}
    case 'brief': invariant(positional.length<=1,'Usage: brief [screen-id|screen.json] [--project dir] [--out brief.md]'); output=await brief(project,await readScreen(project,positional[0]),{compact:Boolean(flags.compact)});if(flags.out){await writeNew(path.resolve(flags.out),output);output={written:path.resolve(flags.out)};}break;
    case 'check': output=await checkProject(project,flags.css?flags.css.split(','):[]); if(output.status==='fail')process.exitCode=1;break;
    case 'audit': {invariant(positional.length===2,'Usage: audit <screen.json> <evidence.json> [--project dir]');const {pack,config}=await loadProject(project);const evidence=await readJSON(positional[1]);invariant(evidence.packDigest===config.packDigest,'Evidence belongs to a different design-pack revision');output=auditEvidence(pack,await readJSON(positional[0]),evidence);if(output.status!=='pass')process.exitCode=1;break;}
    case 'remember': output=await remember(project,flags);break;
    case 'pin': { const base=path.join(project,'.design-harness'); const config=await readJSON(path.join(base,'config.json'));invariant(config.schema==='design-harness.project/1'&&config.pack==='pack.json','Invalid project config'); const pack=validatePack(await readJSON(path.join(base,'pack.json'))); const prior=config.packDigest;config.packDigest=digest(pack);await regularFile(path.join(base,'config.json'));await writeFile(path.join(base,'config.json'),JSON.stringify(config,null,2)+'\n');output={previous:prior,current:config.packDigest};break; }
    case 'import-tokens': {invariant(positional.length===1&&flags.pack&&flags.out&&flags.source,'Usage: import-tokens <normalized-tokens.json> --pack pack.json --out new-pack.json --source <reference>');const pack=validatePack(await readJSON(flags.pack));const tokens=await readJSON(positional[0]);const next={...pack,tokens,source:{kind:'export',reference:flags.source,importedAt:new Date().toISOString(),previous:pack.source},version:pack.version.split('.').map((v,i)=>i===2?Number(v)+1:v).join('.')};validatePack(next);await writeNew(path.resolve(flags.out),JSON.stringify(next,null,2)+'\n');output={written:path.resolve(flags.out),digest:digest(next)};break;}
    default: output=await readFile(path.join(bundle,'docs/CLI.txt'),'utf8');
  }
  process.stdout.write(typeof output==='string'?output+'\n':JSON.stringify(output,null,2)+'\n');
}catch(error){process.stderr.write(`functional-minimalism: ${error.message}\n`);process.exitCode=1;}
