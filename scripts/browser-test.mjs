// No npm dependencies. Uses a local Chrome installation and a fresh temporary profile.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,readFile,writeFile,rm,access} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from './serve.mjs';
import {digest,readJSON} from '../src/node.mjs';
import {auditEvidence} from '../src/core.mjs';
const run=promisify(execFile);
const candidates=[process.env.CHROME_BIN,...(process.platform==='darwin'?['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']:['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'])].filter(Boolean);
let chrome;for(const candidate of candidates){if(await access(candidate).then(()=>true,()=>false)){chrome=candidate;break;}}
if(!chrome){console.error('Chrome not found. Set CHROME_BIN to a Chrome executable. No browser was downloaded.');process.exit(1);}
const preview=await readFile(path.join(root,'dist/Functional_Minimalism_Workshop.html'),'utf8');
const pack=await readJSON(path.join(root,'packs/studio/pack.json')),collected=[],summary=[];
const artifactDir=path.join(root,'artifacts');await mkdir(artifactDir,{recursive:true});
try{
 for(const width of [390,1440]){
  const profile=await mkdtemp(path.join(os.tmpdir(),'design-harness-chrome-'));
  try{
   // Chrome clamps top-level windows to 500px. An actual fixed-width iframe
   // exercises the requested CSS viewport without relabelling wider evidence.
   const fixture=path.join(profile,'viewport.html');
   const escaped=preview.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
   await writeFile(fixture,`<!doctype html><meta charset="utf-8"><style>body{margin:0}iframe{display:block;border:0;width:${width}px;height:1000px}</style><iframe data-selftest title="Workshop verification" srcdoc="${escaped}"></iframe><script>
    const frame=document.querySelector('iframe');
    frame.addEventListener('load',()=>{
     const collect=()=>{const result=frame.contentDocument.getElementById('harness-test-results');if(!result||document.getElementById('harness-test-results'))return;const output=document.createElement('script');output.id=result.id;output.type=result.type;output.textContent=result.textContent;document.body.append(output);};
     new MutationObserver(collect).observe(frame.contentDocument,{childList:true,subtree:true});collect();
    });
   </script>`);
   const {stdout}=await run(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,`--window-size=${Math.max(width,800)},1100`,'--hide-scrollbars','--virtual-time-budget=10000','--dump-dom',pathToFileURL(fixture).href],{timeout:45000,maxBuffer:10*1024*1024});
   const raw=stdout.match(/<script id="harness-test-results" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
   if(!raw)throw new Error('Browser did not produce test evidence');
   const result=JSON.parse(raw);
   if(result.width!==width)throw new Error(`Requested ${width}px but captured ${result.width}px`);
   collected.push(...result.evidence);summary.push({...result,evidence:undefined});
   if(result.failed)process.exitCode=1;
  }finally{await rm(profile,{recursive:true,force:true});}
 }
 const reports=[];
 for(const screen of ['discovery','invoice','project']){
  const evidence={schema:'design-harness.evidence/1',packDigest:digest(pack),capturedAt:new Date().toISOString(),snapshots:collected.filter(s=>s.screen===screen)};
  await writeFile(path.join(artifactDir,`${screen}.evidence.json`),JSON.stringify(evidence,null,2));
  const report=auditEvidence(pack,await readJSON(path.join(root,`examples/${screen}.screen.json`)),evidence);reports.push({screen,...report});if(report.status!=='pass')process.exitCode=1;
 }
 await writeFile(path.join(artifactDir,'browser-results.json'),JSON.stringify({summary,reports},null,2));
 console.log(JSON.stringify({summary:summary.map(r=>({width:r.width,passed:r.passed,failed:r.failed,failures:r.results.filter(t=>!t.pass)})),reports:reports.map(r=>({screen:r.screen,status:r.status,missing:r.missing}))},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
