// Generate the recorded prompt-lab runs. Requires an OpenCode API key with
// access to the selected models. Keys are read from the environment and are
// never written to the repository.
//
//   OPENCODE_API_KEY=... node scripts/generate-lab-runs.mjs
//   OPENCODE_API_KEY=... node scripts/generate-lab-runs.mjs --force
//   OPENCODE_API_KEY=... node scripts/generate-lab-runs.mjs --models claude-haiku-5-5
//
// The script writes HTML, rendered measurements, screenshots and metadata to
// demo/runs/. It does not call a browser from the page; the static demo only
// reads the recorded files.

import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,readFile,writeFile,rm,access,stat,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from './serve.mjs';
import {readJSON} from '../src/node.mjs';
import {composeBrief,validatePack,validateContract} from '../src/core.mjs';
import {LAB_INDEX_SCHEMA,LAB_RUN_SCHEMA,extractHTML,contentOnlyHTML,buildBaselineMessages,buildHarnessMessages,parseProviderResponse,runSlug,sanitizeHTML} from '../src/lab.mjs';

const run=promisify(execFile);
const outDir=path.join(root,'demo/runs');
const token=process.env.OPENCODE_API_KEY||process.env.OPENCODE_TOKEN;
const args=process.argv.slice(2);
const force=args.includes('--force');
const remeasure=args.includes('--remeasure');
const ingestBefore=args.includes('--before')?args[args.indexOf('--before')+1]:null;
const ingestAfter=args.includes('--after')?args[args.indexOf('--after')+1]:null;
const ingest=!!(ingestBefore&&ingestAfter);
const modelFilter=args.includes('--models')?args[args.indexOf('--models')+1].split(',').map(s=>s.trim()).filter(Boolean):null;
const presetFilter=args.includes('--presets')?args[args.indexOf('--presets')+1].split(',').map(s=>s.trim()).filter(Boolean):null;
const maxTokens=Number(process.env.LAB_MAX_TOKENS??32000);
const temperature=0.3;

const MODELS=[
  {id:'longcat-2.5-free',label:'LongCat 2.5',provider:'OpenCode Go',via:'Free',base:'https://opencode.ai/zen/go/v1',free:true},
  {id:'beam-free',label:'Beam',provider:'OpenCode Go',via:'Free',base:'https://opencode.ai/zen/go/v1',free:true},
  {id:'hy4-flash-free',label:'HY4 Flash',provider:'OpenCode Go',via:'Free',base:'https://opencode.ai/zen/go/v1',free:true},
  {id:'qwen3.8-flash',label:'Qwen 3.8 Flash',provider:'OpenCode Go',via:'Open model',base:'https://opencode.ai/zen/go/v1',free:false},
  {id:'claude-haiku-5-5',label:'Claude Haiku 5.5',provider:'OpenCode Go',via:'Frontier',base:'https://opencode.ai/zen/go/v1',free:false},
  {id:'qwen3.8-max',label:'Qwen 3.8 Max',provider:'OpenCode Go',via:'Open model',base:'https://opencode.ai/zen/go/v1',free:false},
  {id:'deepseek-v4.1-flash',label:'DeepSeek V4.1 Flash',provider:'OpenCode Go',via:'Open model',base:'https://opencode.ai/zen/go/v1',free:false},
  {id:'kimi-k2.7-code',label:'Kimi K2.7 Code',provider:'OpenCode Go',via:'Open model',base:'https://opencode.ai/zen/go/v1',free:false}
].filter(model=>!modelFilter||modelFilter.includes(model.id));

const chromeCandidates=[process.env.CHROME_BIN,...(process.platform==='darwin'?['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']:['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'])].filter(Boolean);
let chrome;
for(const candidate of chromeCandidates){if(await access(candidate).then(()=>true,()=>false)){chrome=candidate;break;}}
if(!chrome){console.error('Chrome not found. Set CHROME_BIN to a Chrome executable. No browser was downloaded.');process.exit(1);}
if(!token){console.error('Set OPENCODE_API_KEY or OPENCODE_TOKEN. The key is only read from the environment.');process.exit(1);}

const pack=validatePack(await readJSON(path.join(root,'packs/studio/pack.json')));
const presets=await readJSON(path.join(root,'demo/presets.json'));
const measurementSource=(await readFile(path.join(root,'demo/measure.mjs'),'utf8')).replace(/^export /gm,'');
const emptyMemory={schema:'design-harness.memory/1',decisions:[]};
const workRoot=await mkdtemp(path.join(os.tmpdir(),'functional-minimalism-lab-'));
const temp=path.join(workRoot,'work');await mkdir(temp,{recursive:true});
await mkdir(outDir,{recursive:true});

async function chromeExec(args,{timeout=60000,allowFailure=false}={}){
  const chromeProfile=await mkdtemp(path.join(os.tmpdir(),'functional-minimalism-chrome-'));
  try{
    return await run(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${chromeProfile}`,'--hide-scrollbars',...args],{timeout,maxBuffer:20*1024*1024});
  }catch(error){
    if(allowFailure||error.stdout)return {stdout:error.stdout??'',stderr:error.stderr??''};
    throw error;
  }finally{
    await rm(chromeProfile,{recursive:true,force:true});
    await run('pkill',['-f',chromeProfile]).catch(()=>{});
  }
}

function contractFor(preset){return validateContract(JSON.parse(JSON.stringify(preset.contractData)));}
function openCodeMessages(messages){return [{role:'system',content:messages.system},{role:'user',content:messages.user}];}
async function callOpenCode(model,messages,session){
  let lastError;
  for(let attempt=1;attempt<=2;attempt++){
    const started=Date.now();
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),300000);
    try{
      const response=await fetch(`${model.base}/chat/completions`,{
        method:'POST',
        headers:{'content-type':'application/json',authorization:`Bearer ${token}`,'x-opencode-session':session},
        body:JSON.stringify({model:model.id,messages:openCodeMessages(messages),max_tokens:maxTokens,temperature,stream:false,...(model.id==='hy4-flash-free'?{reasoning_effort:'low'}:{})}),
        signal:controller.signal
      });
      const text=await response.text();
      let json;
      try{json=JSON.parse(text);}catch{json=null;}
      if(!response.ok){
        const message=json?.error?.message??text.slice(0,300);
        throw new Error(`${model.label}: ${message}`);
      }
      if(!json)throw new Error(`${model.label} returned a non-JSON response.`);
      const parsed=parseProviderResponse('openai',json);
      if(!parsed.text.trim())throw new Error(`${model.label} returned an empty response.`);
      if(parsed.finishReason==='length')console.warn(`  warning: ${model.label} hit the ${maxTokens}-token limit; the HTML may be truncated.`);
      return {...parsed,elapsedMs:Date.now()-started,rawUsage:json.usage??null};
    }catch(error){
      lastError=error;
      console.warn(`  attempt ${attempt} failed: ${error.message}`);
      if(attempt<2)await new Promise(resolve=>setTimeout(resolve,5000));
    }finally{
      clearTimeout(timeout);
    }
  }
  throw lastError;
}
function measureFixture(html,facts,width){
  const clean=html.replace(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>/gi,'');
  const measure=`<script>${measurementSource}\nconst __facts=${JSON.stringify(facts??[])};\nconst __r=measureDocument(document,{width:innerWidth,facts:__facts});\nconst __out=document.createElement('script');__out.type='application/json';__out.id='lab-measure';__out.textContent=JSON.stringify(__r);document.body.append(__out);<\/script>`;
  const injected=/<\/body>/i.test(clean)?clean.replace(/<\/body>/i,`${measure}</body>`):`${clean}${measure}`;
  if(width===1280)return injected;
  const srcdoc=injected.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  return `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#101211}iframe{display:block;width:${width}px;height:${width===390?844:800}px;border:0}</style><iframe id="frame" title="Measurement viewport" srcdoc="${srcdoc}"></iframe><script>
   const frame=document.getElementById('frame');
   frame.addEventListener('load',()=>{try{const out=frame.contentDocument.getElementById('lab-measure');if(!out)return;const copy=document.createElement('script');copy.id='lab-measure';copy.type='application/json';copy.textContent=out.textContent;document.body.append(copy);}catch(error){document.body.dataset.error=String(error);}});
  <\/script>`;
}
async function measure(html,facts,width,label){
  const file=path.join(temp,`${label}.html`);
  await writeFile(file,measureFixture(html,facts,width));
  const windowSize=width===390?'500,900':'1280,800';
  const {stdout}=await chromeExec([`--window-size=${windowSize}`,'--virtual-time-budget=3000','--dump-dom',pathToFileURL(file).href]);
  const raw=stdout.match(/<script[^>]*id="lab-measure"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if(!raw){await writeFile(path.join(outDir,`${label}-failure.html`),html);throw new Error(`No measurement for ${label} at ${width}px`);}
  return JSON.parse(raw);
}
async function screenshot(html,file){
  const source=path.join(temp,`${path.basename(file,'.png')}.html`);
  await writeFile(source,html);
  const chromeProfile=await mkdtemp(path.join(os.tmpdir(),'functional-minimalism-chrome-'));
  try{
    await new Promise(resolve=>{
      const child=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',`--user-data-dir=${chromeProfile}`,'--hide-scrollbars','--window-size=1280,800','--force-device-scale-factor=1','--virtual-time-budget=3000',`--screenshot=${file}`,pathToFileURL(source).href],{stdio:'ignore'});
      const timer=setTimeout(()=>{child.kill('SIGKILL');resolve();},20000);
      child.on('exit',()=>{clearTimeout(timer);resolve();});
      child.on('error',()=>{clearTimeout(timer);resolve();});
    });
  }finally{
    await run('pkill',['-f',chromeProfile]).catch(()=>{});
    await rm(chromeProfile,{recursive:true,force:true});
  }
  const info=await stat(file).catch(()=>null);
  if(!info?.size)throw new Error(`Chrome did not write ${file}`);
}
function compactUsage(usage){return usage?{input:usage.input??null,output:usage.output??null,total:usage.total??null,cost:usage.cost??null}:null;}
function runIndexEntry(record){return {id:record.id,preset:record.preset,presetLabel:record.presetLabel,model:record.model.id,modelLabel:record.model.label,provider:record.model.provider,via:record.model.via,free:record.model.free,createdAt:record.createdAt,screenshots:{before:`./runs/${record.id}-before.png`,after:`./runs/${record.id}-after.png`},measures:{desktop:record.conditions.before.measures.desktop??null,mobile:record.conditions.before.measures.mobile??null}};}

try{
  const records=[];
  if(!remeasure)for(const preset of presets.presets.filter(p=>!presetFilter||presetFilter.includes(p.id))){
    const contractPath=path.resolve(root,'demo',preset.contract);
    preset.contractData=await readJSON(contractPath);
    const contract=contractFor(preset);
    const brief=composeBrief(pack,contract,emptyMemory,{compact:true});
    for(const model of MODELS){
      const id=runSlug({preset:preset.id,model:model.id});
      const runFile=path.join(outDir,`${id}.json`);
      if(!force&&await access(runFile).then(()=>true,()=>false)&&await access(path.join(outDir,`${id}-before.png`)).then(()=>true,()=>false)&&await access(path.join(outDir,`${id}-after.png`)).then(()=>true,()=>false)){
        const existing=await readJSON(runFile);
        records.push(existing);
        console.log(`skip ${id}`);
        continue;
      }
      console.log(`generate ${id}`);
      try{
        const session=`functional-minimalism-lab-${id}-${Date.now()}`;
        let baseline,harness;
        if(ingest){
          console.log('  ingest before/after');
          baseline={text:await readFile(ingestBefore,'utf8'),elapsedMs:null,usage:null,finishReason:null};
          harness={text:await readFile(ingestAfter,'utf8'),elapsedMs:null,usage:null,finishReason:null};
        }else{
          console.log('  baseline');
          baseline=await callOpenCode(model,buildBaselineMessages(preset.prompt),`${session}-before`);
          const beforePrompt=contentOnlyHTML(sanitizeHTML(extractHTML(baseline.text)));
          console.log(`  harness (${baseline.elapsedMs}ms, ${baseline.text.length} chars)`);
          harness=await callOpenCode(model,buildHarnessMessages({prompt:preset.prompt,beforeHTML:beforePrompt,brief,guidance:preset.guidance,outline:true}),`${session}-after`);
        }
        const beforeHTML=sanitizeHTML(extractHTML(baseline.text));
        const afterHTML=sanitizeHTML(extractHTML(harness.text));
        console.log(`  measure (${harness.elapsedMs??'ingested'}ms, ${harness.text.length} chars)`);
        const beforeMeasures={desktop:await measure(beforeHTML,preset.facts,1280,`${id}-before-1280`),mobile:await measure(beforeHTML,preset.facts,390,`${id}-before-390`)};
        const afterMeasures={desktop:await measure(afterHTML,preset.facts,1280,`${id}-after-1280`),mobile:await measure(afterHTML,preset.facts,390,`${id}-after-390`)};
        await screenshot(beforeHTML,path.join(outDir,`${id}-before.png`));
        await screenshot(afterHTML,path.join(outDir,`${id}-after.png`));
        const record={
          schema:LAB_RUN_SCHEMA,
          id,
          preset:preset.id,
          presetLabel:preset.label,
          prompt:preset.prompt,
          createdAt:new Date().toISOString(),
          model:{id:model.id,label:model.label,provider:model.provider,via:model.via,free:model.free},
          harness:{pack:`${pack.id}@${pack.version}`,brief:true,conditions:['model default','same model with harness brief']},
          conditions:{
            before:{label:'Model default',html:beforeHTML,elapsedMs:baseline.elapsedMs,usage:compactUsage(baseline.usage),finishReason:baseline.finishReason,measures:beforeMeasures,screenshot:`./runs/${id}-before.png`},
            after:{label:'With harness',html:afterHTML,elapsedMs:harness.elapsedMs,usage:compactUsage(harness.usage),finishReason:harness.finishReason,measures:afterMeasures,screenshot:`./runs/${id}-after.png`}
          },
          limitations:'A single recorded run. The harness pass receives the brief and rules; it does not run a coding-agent repair loop or a usability study.',
          ...(ingest?{note:'Recovered from an earlier recorded run. Timings and token counts were not captured.'}:{})
        };
        await writeFile(runFile,JSON.stringify(record,null,2));
        records.push(record);
      }catch(error){
        console.error(`  skipped ${id}: ${error.message}`);
      }
    }
  }
  records.sort((a,b)=>a.preset.localeCompare(b.preset)||a.model.label.localeCompare(b.model.label));
  const allFiles=(await readdir(outDir)).filter(name=>name.endsWith('.json')&&name!=='index.json');
  const allRecords=[];
  for(const name of allFiles){try{const record=await readJSON(path.join(outDir,name));if(record.schema===LAB_RUN_SCHEMA)allRecords.push(record);}catch{}}
  allRecords.sort((a,b)=>a.preset.localeCompare(b.preset)||a.model.label.localeCompare(b.model.label));
  if(remeasure){
    for(const record of allRecords){
      const preset=presets.presets.find(item=>item.id===record.preset);
      if(!preset)continue;
      console.log(`remeasure ${record.id}`);
      record.conditions.before.measures={
        desktop:await measure(record.conditions.before.html,preset.facts,1280,`${record.id}-before-1280`),
        mobile:await measure(record.conditions.before.html,preset.facts,390,`${record.id}-before-390`)
      };
      record.conditions.after.measures={
        desktop:await measure(record.conditions.after.html,preset.facts,1280,`${record.id}-after-1280`),
        mobile:await measure(record.conditions.after.html,preset.facts,390,`${record.id}-after-390`)
      };
      await writeFile(path.join(outDir,`${record.id}.json`),JSON.stringify(record,null,2));
    }
  }
  const usedModels=[...new Map(allRecords.map(record=>[record.model.id,record.model])).values()].sort((a,b)=>a.label.localeCompare(b.label));
  const usedPresets=[...new Map(allRecords.map(record=>[record.preset,{id:record.preset,label:record.presetLabel}])).values()];
  const index={schema:LAB_INDEX_SCHEMA,generatedAt:new Date().toISOString(),models:usedModels,presets:usedPresets,runs:allRecords.map(runIndexEntry)};
  await writeFile(path.join(outDir,'index.json'),JSON.stringify(index,null,2));
  console.log(`wrote ${allRecords.length} run(s) to demo/runs/index.json`);
}catch(error){
  console.error(error.stack??error.message);
  process.exitCode=1;
}finally{
  await rm(workRoot,{recursive:true,force:true});
}
