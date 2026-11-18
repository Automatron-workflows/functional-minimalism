// Measure the recorded v0 and v1 runs with the same browser instrumentation.
// Writes a JSON artifact and a Markdown report. No model calls.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,readFile,writeFile,rm,access,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from './serve.mjs';
import {readJSON} from '../src/node.mjs';
import {craftScore,average} from '../src/craft.mjs';

const run=promisify(execFile);
const candidates=[process.env.CHROME_BIN,...(process.platform==='darwin'?['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']:['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'])].filter(Boolean);
let chrome;
for(const candidate of candidates){if(await access(candidate).then(()=>true,()=>false)){chrome=candidate;break;}}
if(!chrome){console.error('Chrome not found. Set CHROME_BIN.');process.exit(1);}
const measurementSource=(await readFile(path.join(root,'demo/measure.mjs'),'utf8')).replace(/^export /gm,'');
const presets=await readJSON(path.join(root,'demo/presets.json'));
const facts=presets.presets[0]?.facts??[];
const workRoot=await mkdtemp(path.join(os.tmpdir(),'functional-minimalism-benchmark-'));
const work=path.join(workRoot,'work');await mkdir(work,{recursive:true});

async function chromeExec(args){
 const profile=await mkdtemp(path.join(os.tmpdir(),'functional-minimalism-benchmark-chrome-'));
 try{
  return await run(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--hide-scrollbars',...args],{timeout:60000,maxBuffer:20*1024*1024});
 }catch(error){
  if(error.stdout)return {stdout:error.stdout};
  throw error;
 }finally{
  await run('pkill',['-f',profile]).catch(()=>{});
  await rm(profile,{recursive:true,force:true});
 }
}
function fixture(html,width){
 const clean=html.replace(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>/gi,'');
 const script=`<script>${measurementSource}\nconst __facts=${JSON.stringify(facts)};\nconst __r=measureDocument(document,{width:innerWidth,facts:__facts});\nconst __o=document.createElement('script');__o.type='application/json';__o.id='bench-measure';__o.textContent=JSON.stringify(__r);document.body.append(__o);<\/script>`;
 const injected=/<\/body>/i.test(clean)?clean.replace(/<\/body>/i,`${script}</body>`):`${clean}${script}`;
 if(width===1280)return injected;
 const srcdoc=injected.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 return `<!doctype html><meta charset="utf-8"><style>html,body{margin:0}iframe{display:block;width:390px;height:844px;border:0}</style><iframe id="frame" title="Benchmark viewport" srcdoc="${srcdoc}"></iframe><script>
  const frame=document.getElementById('frame');
  frame.addEventListener('load',()=>{const out=frame.contentDocument.getElementById('bench-measure');if(!out)return;const copy=document.createElement('script');copy.id='bench-measure';copy.type='application/json';copy.textContent=out.textContent;document.body.append(copy);});
 <\/script>`;
}
async function measure(html,width,label){
 const file=path.join(work,`${label}.html`);
 await writeFile(file,fixture(html,width));
 const {stdout}=await chromeExec([`--window-size=${width===390?'500,900':'1280,800'}`,'--virtual-time-budget=3000','--dump-dom',pathToFileURL(file).href]);
 const raw=stdout.match(/<script[^>]*id="bench-measure"[^>]*>([\s\S]*?)<\/script>/)?.[1];
 if(!raw)throw new Error(`No measurement for ${label} at ${width}px`);
 return JSON.parse(raw);
}
async function loadRuns(dir){
 const files=(await readdir(dir)).filter(name=>name.endsWith('.json')&&name!=='index.json');
 const runs=[];
 for(const file of files){
  const value=await readJSON(path.join(dir,file));
  if(value.schema==='functional-minimalism.lab-run/1')runs.push(value);
 }
 return runs;
}
async function measureRun(run,label){
 const before={desktop:await measure(run.conditions.before.html,1280,`${label}-before-1280`),mobile:await measure(run.conditions.before.html,390,`${label}-before-390`)};
 const after={desktop:await measure(run.conditions.after.html,1280,`${label}-after-1280`),mobile:await measure(run.conditions.after.html,390,`${label}-after-390`)};
 return {
  before:{...before,score:craftScore(before)},
  after:{...after,score:craftScore(after)}
 };
}
function delta(after,before){return Number((after-before).toFixed(1));}
function markdownTable(rows,headers){return [`| ${headers.join(' | ')} |`,`| ${headers.map(()=>'---').join(' | ')} |`,...rows.map(row=>`| ${row.join(' | ')} |`)].join('\n');}

try{
 const v0Dir=path.join(root,'docs/benchmark/v0'),v1Dir=path.join(root,'demo/runs');
 const v0Runs=await loadRuns(v0Dir),v1Runs=await loadRuns(v1Dir);
 const models=[...new Set(v1Runs.map(run=>run.model.id))].filter(id=>v0Runs.some(run=>run.model.id===id));
 const records=[];
 for(const modelId of models){
  const before0=v0Runs.find(run=>run.model.id===modelId),after1=v1Runs.find(run=>run.model.id===modelId);
  console.log(`measure ${modelId}`);
  const v0=await measureRun(before0,`v0-${modelId}`),v1=await measureRun(after1,`v1-${modelId}`);
  records.push({
   model:after1.model,
   v0:{before:v0.before.after??v0.before,after:v0.after},
   v1
  });
 }
 const rows=records.map(record=>{
  const before0=record.v0.before.score.score,after0=record.v0.after.score.score,before1=record.v1.before.score.score,after1=record.v1.after.score.score;
  return {
   model:record.model.label,
   id:record.model.id,
   before0,after0,delta0:delta(after0,before0),
   before1,after1,delta1:delta(after1,before1),
   afterScore:record.v1.after.score,
   metrics:record.v1.after.desktop
  };
 });
 const report={
  schema:'functional-minimalism.lab-benchmark/1',
  generatedAt:new Date().toISOString(),
  sample:{models:records.length,runsPerVersion:records.length,viewport:[1280,390],prompt:presets.presets[0].prompt},
  harness:{v0:'studio@0.2.0, generic rules',v1:'atelier@1.0.0, explicit visual system, invoice fixture, page container, text budget'},
  records,
  summary:{
   v0Before:average(rows.map(row=>row.before0)),
   v0After:average(rows.map(row=>row.after0)),
   v0Delta:average(rows.map(row=>row.delta0)),
   v1Before:average(rows.map(row=>row.before1)),
   v1After:average(rows.map(row=>row.after1)),
   v1Delta:average(rows.map(row=>row.delta1)),
   improved:rows.filter(row=>row.delta1>0).length,
   total:rows.length
  },
  note:'Craft heuristic, not a beauty model, usability study or the CLI audit. One run per model.'
 };
 await writeFile(path.join(root,'docs/benchmark.json'),JSON.stringify(report,null,2));
 const table=markdownTable(rows.map(row=>[row.model,row.before0,row.after0,row.delta0>=0?`+${row.delta0}`:row.delta0,row.before1,row.after1,row.delta1>=0?`+${row.delta1}`:row.delta1]),['Model','v0 before','v0 after','v0 delta','v1 before','v1 after','v1 delta']);
 const componentRows=rows.map(row=>[row.model,...row.afterScore.breakdown.map(item=>item.points)]);
 const components=markdownTable(componentRows,['Model',...rows[0].afterScore.breakdown.map(item=>`${item.label} (${item.weight})`)]);
 const images=rows.map(row=>`| ${row.model} | [v1 before](../demo/runs/invoice-${row.id.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()}-before.png) · [v1 after](../demo/runs/invoice-${row.id.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()}-after.png) | [v0 before](./benchmark/v0/invoice-${row.id.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()}-before.png) · [v0 after](./benchmark/v0/invoice-${row.id.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()}-after.png) |`).join('\n');
 const markdown=`# Prompt-lab benchmark

Generated ${new Date().toISOString().slice(0,10)} from ${records.length} recorded models. Each model has one run per harness version. The v1 first draft received the invoice fixture; v0 used the natural-language prompt without it. The v1 after pass received the Atelier brief, guidance and explicit visual system; v0 used the earlier Studio rules. Compare the before/after delta within each version, not the raw before scores across versions.

## Craft heuristic

The score is a transparent heuristic out of 100: text restraint (15), paragraph restraint (5), action clarity (20), hierarchy (15), visual cohesion (15), whitespace (10), responsive integrity (10), required facts (5) and contrast (5), with penalties for missing facts, overflow, a disabled primary action and extreme word counts. It measures rendered output at 1280 and 390px. It is not a beauty model, a usability study or the CLI audit.

## Before and after, v0 and v1

${table}

v0 average: before ${report.summary.v0Before}, after ${report.summary.v0After}, delta ${report.summary.v0Delta}.  
v1 average: before ${report.summary.v1Before}, after ${report.summary.v1After}, delta ${report.summary.v1Delta}.  
v1 improved ${report.summary.improved} of ${report.summary.total} models.

## What changed in v1

- An **Atelier** pack with a warm paper canvas, white document, display serif hero amount, one deep-green accent, an 8px spacing scale, six type sizes and one soft shadow.
- A **real invoice fixture** supplied to both conditions, so line items, totals, supplier, customer, destination and consequence are consistent.
- An explicit **visual system** in the harness prompt: page container, two-column document review, 48px gutters, 360px summary rail, one primary action and a 120-word budget.
- The harness pass still receives a content-only outline of the first draft, not its CSS. It rebuilds the composition instead of copying it.

## Next layer: the approved component gallery

The hosted [approved gallery](../gallery/) contains nine manually reviewed components extracted from the Atelier output: page shell, brand line, document, hero amount, summary rail, primary action, line items, labels and status. The live prompt lab now passes that gallery to the harness pass. This table measures v1, which used the Atelier principles without the gallery; the gallery is the next iteration and will be benchmarked as v2.

## Gallery v2 trial (rejected)

A first LongCat 2.5 pass with the approved gallery duplicated the hero amount in the document and the summary rail: 144 words and 88 paragraph words against 130 and 32 in the approved v1 design. It was not approved. The [v2 evidence](./benchmark/v2-longcat-gallery/) is kept for review. The gallery rules now state that each fact appears once and that the summary rail owns the hero amount; the next live pass uses the tightened rules. The approved default remains the v1 LongCat design.

### Gallery v3 trial

A second LongCat 2.5 pass with the tightened gallery rules fixed the v2 duplication: 136 words, the amount repeated twice, the page shell applied, one enabled primary action. It scored 92.7 on the heuristic against 96.3 for v1 because the complete invoice blocks add necessary address paragraphs. It was not promoted; the recorded default stays at v1. The live connector uses the tightened gallery so a visitor can generate a gallery-composed design on demand. Evidence: [v3](./benchmark/v3-longcat-gallery/).

## v1 component points

${components}

## Rendered evidence

| Model | v1 | v0 |
| --- | --- | --- |
${images}

## Limits

This is four models, one run each, one prompt. It does not establish universal beauty or a time saving. It does not run a coding-agent repair loop, the CLI audit, a participant study or a blind human preference test. The v0 and v1 first drafts were generated with different prompt envelopes because the fixture was added in v1; compare the before/after delta within each version, not the raw before scores across versions.
`;
 await writeFile(path.join(root,'docs/BENCHMARK.md'),markdown);
 console.log(JSON.stringify(report.summary,null,2));
 console.log('Wrote docs/BENCHMARK.md and docs/benchmark.json');
}catch(error){
 console.error(error.stack??error.message);
 process.exitCode=1;
}finally{
 await rm(workRoot,{recursive:true,force:true});
}
