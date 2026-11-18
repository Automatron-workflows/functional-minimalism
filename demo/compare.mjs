// Prompt lab and recorded-run comparison. No server, no telemetry, no stored
// key unless the visitor asks for it.
import {PROVIDERS,buildBaselineMessages,buildHarnessMessages,contentOnlyHTML,extractHTML,sanitizeHTML,requestProvider,listProviderModels} from '../src/lab.mjs?v=2026-11-18-7';
import {measureDocument,measureSummary} from './measure.mjs?v=2026-11-18-7';
import {composeBrief,validatePack,validateContract} from '../src/core.mjs?v=2026-11-18-7';

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const fmtDate=value=>{if(!value)return'Date not recorded';const date=new Date(value);if(Number.isNaN(date.valueOf()))return'Date not recorded';return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(date);};
const fmtNumber=value=>Number.isFinite(value)?new Intl.NumberFormat('en-GB').format(value):'n/a';
const fmtMs=value=>Number.isFinite(value)?(value<1000?`${value}ms`:`${(value/1000).toFixed(1)}s`):'n/a';
const truncate=(value,length=120)=>{const text=String(value??'').replace(/\s+/g,' ').trim();return text.length>length?`${text.slice(0,length-1)}…`:text;};
const emptyMemory={schema:'design-harness.memory/1',decisions:[]};
const STORE_KEY='functional-minimalism.lab.connection.v1';
const state={presetId:'invoice',modelId:null,prompt:'',dirty:false,view:'after',run:null,live:null,liveRuns:[],liveTargets:[],liveStatus:new Map(),busy:false,connection:null,measureView:'desktop',abort:null,exportRun:null};
const liveThumbs=new Map();
let data=null;
let modelsForPreset=[];

const prompt=$('#prompt'),frame=$('#frame'),models=$('#models'),source=$('#source'),runButton=$('#run'),runLabel=$('#run-label'),runStatus=$('#run-status'),liveModel=$('#live-model');
const shotBefore=$('#shot-before'),shotAfter=$('#shot-after'),liveBefore=$('#live-before'),liveAfter=$('#live-after');
const frameEmpty=$('#frame-empty'),frameLoading=$('#frame-loading'),loadingLabel=$('#loading-label'),cancelButton=$('#cancel');
const measureGrid=$('#measure-grid'),metaList=$('#meta-list'),metaLimits=$('#meta-limits'),downloadRunButton=$('#download-run'),approveRunButton=$('#approve-run'),showRecordedButton=$('#show-recorded');
const fixtureNote=$('#fixture-note'),benchmarkNote=$('#benchmark-note'),benchmarkV1=$('#benchmark-v1'),benchmarkApproved=$('#benchmark-approved'),benchmarkV0=$('#benchmark-v0'),benchmarkCount=$('#benchmark-count'),benchmarkTotal=$('#benchmark-total');
const headerConnect=$('#header-connect');

function readStore(storage){try{const raw=storage.getItem(STORE_KEY);return raw?JSON.parse(raw):null;}catch{return null;}}
function writeStore(connection,remember){
 try{
  if(remember){localStorage.setItem(STORE_KEY,JSON.stringify(connection));sessionStorage.removeItem(STORE_KEY);}
  else{localStorage.removeItem(STORE_KEY);sessionStorage.setItem(STORE_KEY,JSON.stringify(connection));}
 }catch{/* Storage can be unavailable in offline previews. */}
}
function clearStore(){try{localStorage.removeItem(STORE_KEY);sessionStorage.removeItem(STORE_KEY);}catch{}}
function restoreConnection(){
 const stored=readStore(localStorage)??readStore(sessionStorage);
 if(stored&&PROVIDERS[stored.provider]&&stored.key&&stored.model)state.connection=stored;
}
function preset(){return data?.presets.presets.find(item=>item.id===state.presetId)??null;}
function modelLabel(id){const model=state.connection?.models?.find(item=>item.id===id);return model?.label??id;}
function runFor(presetId,modelId){return data?.runs.find(item=>item.preset===presetId&&item.model.id===modelId)??null;}
function defaultModelForPreset(presetId){
 const runs=(data?.runs??[]).filter(item=>item.preset===presetId);
 const approved=data?.presets.presets.find(item=>item.id===presetId)?.approvedModel;
 if(approved&&runs.some(run=>run.model.id===approved))return approved;
 const current=runs.find(item=>item.model.id===state.modelId);
 return current?.model.id??runs[0]?.model.id??null;
}
function currentMeasures(side){
 const sourceRun=state.live??state.run;
 return sourceRun?.conditions?.[side]?.measures?.[state.measureView]??null;
}
function currentRunForExport(){return state.live??state.run;}
function freeModelsFor(connection){
 if(!connection||connection.provider!=='openrouter')return[];
 return (connection.models??[]).filter(model=>model.free);
}
function liveTargetsFor(connection){
 if(!connection)return[];
 const selected=connection.models?.find(model=>model.id===connection.model);
 if(selected)return [{id:selected.id,label:selected.label,free:!!selected.free}];
 const free=freeModelsFor(connection);
 const model=free[0];
 return model?[{id:model.id,label:model.label,free:true}]:[{id:connection.model,label:connection.model,free:false}];
}
async function mapLimit(items,limit,worker){
 const results=new Array(items.length);let index=0;
 async function run(){
  while(index<items.length){
   const current=index++;
   try{results[current]={status:'fulfilled',value:await worker(items[current],current)};}
   catch(error){results[current]={status:'rejected',reason:error};}
  }
 }
 await Promise.all(Array.from({length:Math.min(limit,items.length)},run));
 return results;
}
function liveThumb(run){
 if(liveThumbs.has(run.model.id))return liveThumbs.get(run.model.id);
 const wrap=document.createElement('div');wrap.className='thumb-wrap';
 const render=document.createElement('iframe');render.className='thumb-frame';render.title='';render.setAttribute('aria-hidden','true');render.setAttribute('tabindex','-1');render.setAttribute('sandbox','allow-same-origin');render.srcdoc=run.conditions.after.html;
 wrap.append(render);liveThumbs.set(run.model.id,wrap);return wrap;
}

async function fetchJSON(url){const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error(`${url} returned ${response.status}`);return response.json();}
async function loadData(){
 if(globalThis.__labData){
  const embedded=globalThis.__labData;
  return {index:embedded.index,presets:embedded.presets,pack:validatePack(embedded.pack),contracts:embedded.contracts,fixtures:embedded.fixtures??{},runs:embedded.runs,benchmark:embedded.benchmark??null,gallery:embedded.gallery??null};
 }
 const index=await fetchJSON('./runs/index.json');
 const presetsDoc=await fetchJSON('./presets.json');
 const pack=validatePack(await fetchJSON('../packs/atelier/pack.json'));
 const contracts={},fixtures={};
 for(const item of presetsDoc.presets){
  contracts[item.id]=validateContract(await fetchJSON(item.contract));
  if(item.fixture)fixtures[item.id]=await fetchJSON(item.fixture);
 }
 const settled=await Promise.allSettled(index.runs.map(row=>fetchJSON(`./runs/${row.id}.json`)));
 const runs=settled.filter(result=>result.status==='fulfilled').map(result=>result.value);
 let benchmark=null,gallery=null;
 try{benchmark=await fetchJSON('../docs/benchmark.json');}catch{}
 try{gallery=await fetchJSON('../gallery/templates.json');}catch{}
 return {index,presets:presetsDoc,pack,contracts,fixtures,runs,benchmark,gallery};
}

function setPrompt(value,{dirty=false}={}){state.prompt=value;state.dirty=dirty;prompt.value=value;renderFixtureNote();renderRunButton();renderSource();}
function renderFixtureNote(){if(fixtureNote)fixtureNote.hidden=state.dirty||!preset()?.fixture;}
function renderPresetButtons(){for(const button of $$('[data-preset]'))button.setAttribute('aria-pressed',String(button.dataset.preset===state.presetId));}
function renderRunButton(){
 runLabel.textContent=state.busy?'Generating…':state.dirty?'Run this prompt':'Generate design';
 runButton.disabled=state.busy;
 runButton.setAttribute('aria-busy',String(state.busy));
 runButton.title=state.connection?'Generate one design with the approved Atelier gallery':'Connect a model to generate a design';
}
function renderLiveModelLine(){
 liveModel.replaceChildren();
 if(state.connection){
  const strong=document.createElement('strong');strong.textContent=modelLabel(state.connection.model);
  const change=document.createElement('button');change.type='button';change.className='connect-link';change.textContent='Change';
  change.addEventListener('click',()=>openDialog('connect'));
  liveModel.append('Run with ',strong,' · ',change);
 }else{
  const button=document.createElement('button');button.type='button';button.className='connect-link';button.textContent='Connect a model';
  button.addEventListener('click',()=>openDialog('connect'));
  liveModel.append(button,' to generate one design with the approved gallery.');
 }
 headerConnect.textContent=state.connection?'Model connected':'Connect a model';
 headerConnect.classList.toggle('is-connected',!!state.connection);
}
function renderBenchmark(){
 const summary=data?.benchmark?.summary;
 if(!summary){benchmarkNote.hidden=true;return;}
 benchmarkNote.hidden=false;
 benchmarkV1.textContent=summary.v1After??'–';
 const approvedId=preset()?.approvedModel;
 const approvedRecord=data?.benchmark?.records?.find(record=>record.model.id===approvedId);
 benchmarkApproved.textContent=approvedRecord?.v1?.after?.score?.score??'–';
 benchmarkV0.textContent=summary.v0After??'–';
 benchmarkCount.textContent=summary.improved??'–';
 benchmarkTotal.textContent=summary.total??'–';
}
function renderSource(){
 if(state.live){
  const free=state.live.model.free?' · Free':'';
  source.textContent=`Live · ${state.live.model.label} · approved gallery${free}`;
  return;
 }
 if(!state.run){source.textContent='No run selected';return;}
 const base=`Recorded · ${state.run.model.label} · ${fmtDate(state.run.createdAt)}`;
 source.textContent=state.dirty?`${base} · your prompt has not been run`:base;
}
function renderModels(){
 models.replaceChildren();
 if(state.liveTargets.length||state.liveRuns.length){
  const targets=state.liveTargets.length?state.liveTargets:state.liveRuns.map(run=>run.model);
  for(const target of targets){
   const live=state.liveRuns.find(run=>run.model.id===target.id);
   const status=state.liveStatus.get(target.id)??(live?'done':'queued');
   const button=document.createElement('button');button.type='button';button.className='model';button.dataset.model=target.id;
   button.setAttribute('aria-pressed',String(state.live?.model.id===target.id));
   button.setAttribute('aria-label',`Compare ${target.label??target.id}`);
   button.disabled=!live;
   if(live)button.append(liveThumb(live));
   else{const placeholder=document.createElement('span');placeholder.className='thumb-placeholder';placeholder.textContent=(target.label??target.id).slice(0,2).toUpperCase();button.append(placeholder);}
   const label=document.createElement('span');label.className='label';label.textContent=target.label??target.id;
   const meta=document.createElement('span');meta.className='meta';meta.dataset.status=status;
   meta.textContent=status==='done'?'Ready':status==='error'?'Failed':status==='baseline'?'Drafting':status==='harness'?'Harness':status==='measuring'?'Measuring':status==='queued'?'Queued':'Working';
   button.append(label,meta);
   if(live)button.addEventListener('click',()=>{state.live=live;showLive(live);renderModels();});
   models.append(button);
  }
  return;
 }
 modelsForPreset=(data?.index.models??[]).filter(model=>data.runs.some(run=>run.preset===state.presetId&&run.model.id===model.id));
 if(!modelsForPreset.length){
  const message=document.createElement('p');message.className='rail-empty';message.textContent='No recorded runs for this prompt.';models.append(message);return;
 }
 const approvedId=preset()?.approvedModel??modelsForPreset[0]?.id;
 const model=modelsForPreset.find(item=>item.id===approvedId)??modelsForPreset[0];
 const run=runFor(state.presetId,model.id);
 if(run){
  const button=document.createElement('button');button.type='button';button.className='model';button.dataset.model=model.id;
  button.setAttribute('aria-pressed',String(model.id===state.modelId));
  button.setAttribute('aria-label','Compare the approved Atelier template');
  const thumb=document.createElement('img');thumb.className='thumb';thumb.src=run.conditions.after.screenshot;thumb.alt='';
  const label=document.createElement('span');label.className='label';label.textContent='Atelier · approved';
  const meta=document.createElement('span');meta.className='meta';meta.textContent=`${model.label} · ${model.via??'recorded'}`;
  button.append(thumb,label,meta);
  button.addEventListener('click',()=>selectModel(model.id));
  models.append(button);
 }
 const benchmark=document.createElement('a');benchmark.className='rail-link';benchmark.href='../docs/BENCHMARK.md';benchmark.target='_blank';benchmark.rel='noreferrer';benchmark.textContent='Benchmark · 4 models';
 models.append(benchmark);
}
function renderMeasureViewButtons(){for(const button of $$('[data-measure-view]'))button.setAttribute('aria-pressed',String(button.dataset.measureView===state.measureView));}
function renderMeasures(){
 const before=currentMeasures('before'),after=currentMeasures('after');
 measureGrid.replaceChildren();
 renderMeasureViewButtons();
 if(!before||!after){
  const message=document.createElement('p');message.className='measure-empty';message.textContent='Measurements are not available for this run.';measureGrid.append(message);return;
 }
 const table=document.createElement('table');table.className='measure-table';
 const thead=document.createElement('thead');const headRow=document.createElement('tr');
 for(const label of ['Measure','Before','After','Change']){const th=document.createElement('th');th.scope='col';th.textContent=label;headRow.append(th);}
 thead.append(headRow);table.append(thead);
 const tbody=document.createElement('tbody');
 const rows=measureSummary(before,after);
 rows.push({label:'Horizontal overflow',before:before.overflowX?'Yes':'No',after:after.overflowX?'Yes':'No'});
 const factsBefore=before.facts??[],factsAfter=after.facts??[];
 if(factsBefore.length){
  const countBefore=factsBefore.filter(fact=>fact.visible).length,countAfter=factsAfter.filter(fact=>fact.visible).length;
  rows.push({label:'Required facts visible',before:`${countBefore} of ${factsBefore.length}`,after:`${countAfter} of ${factsAfter.length}`});
 }
 for(const row of rows){
  const tr=document.createElement('tr');
  const label=document.createElement('th');label.scope='row';label.textContent=row.label;tr.append(label);
  const beforeCell=document.createElement('td');beforeCell.textContent=typeof row.before==='number'?fmtNumber(row.before):String(row.before);tr.append(beforeCell);
  const afterCell=document.createElement('td');afterCell.textContent=typeof row.after==='number'?fmtNumber(row.after):String(row.after);tr.append(afterCell);
  const changeCell=document.createElement('td');changeCell.className='change';
  if(typeof row.before==='number'&&typeof row.after==='number'){
   const delta=row.after-row.before;
   changeCell.textContent=delta>0?`+${fmtNumber(delta)}`:delta<0?`−${fmtNumber(Math.abs(delta))}`:'0';
   changeCell.dataset.direction=delta>0?'up':delta<0?'down':'same';
  }else{
   changeCell.textContent=row.before===row.after?'same':'changed';
   changeCell.dataset.direction=row.before===row.after?'same':'changed';
  }
  tr.append(changeCell);tbody.append(tr);
 }
 table.append(tbody);measureGrid.append(table);
 if(factsBefore.length){
  const details=document.createElement('details');details.className='fact-detail';
  const summary=document.createElement('summary');summary.textContent='Fact check';details.append(summary);
  const list=document.createElement('ul');
  for(const fact of factsAfter){
   const beforeFact=factsBefore.find(item=>item.id===fact.id);
   const item=document.createElement('li');
   item.textContent=`${fact.label}: ${beforeFact?.visible?'visible before':'missing before'} · ${fact.visible?'visible after':'missing after'}`;
   list.append(item);
  }
  details.append(list);measureGrid.append(details);
 }
}
function addMetaRow(term,value){
 const dt=document.createElement('dt');dt.textContent=term;
 const dd=document.createElement('dd');dd.textContent=value;
 metaList.append(dt,dd);
}
function renderMeta(run){
 metaList.replaceChildren();
 state.exportRun=run;
 const live=!!state.live;
 addMetaRow('Source',live?'Live browser run':'Recorded run');
 addMetaRow('Model',run.model.label);
 addMetaRow('Provider',[run.model.provider,run.model.via].filter(Boolean).join(' · '));
 addMetaRow('Created',fmtDate(run.createdAt));
 const before=run.conditions.before,after=run.conditions.after;
 addMetaRow('First draft',`${fmtMs(before.elapsedMs)}${before.usage?.input!=null&&before.usage?.output!=null?` · ${fmtNumber(before.usage.input)} in / ${fmtNumber(before.usage.output)} out`:''}`);
 addMetaRow('Harness pass',`${fmtMs(after.elapsedMs)}${after.usage?.input!=null&&after.usage?.output!=null?` · ${fmtNumber(after.usage.input)} in / ${fmtNumber(after.usage.output)} out`:''}`);
 addMetaRow('Pack',run.harness?.pack??'Studio reference');
 addMetaRow('Gallery',run.harness?.gallery?`Approved components v${run.harness.gallery}`:'Recorded Atelier v1');
 addMetaRow('Prompt',truncate(run.prompt,400));
 if(run.note)addMetaRow('Note',run.note);
 if(before.finishReason==='length'||after.finishReason==='length')addMetaRow('Warning','The provider stopped at its output limit. The rendered HTML may be incomplete.');
 metaLimits.textContent=run.limitations??'One run. Results vary by model, prompt and sampling. This is not a benchmark.';
 downloadRunButton.disabled=!run;
 approveRunButton.disabled=!run;
 showRecordedButton.hidden=!live;
}
function applyView(){frame.dataset.view=state.view;for(const button of $$('[data-view]'))button.setAttribute('aria-pressed',String(button.dataset.view===state.view));}
function updateURL(){
 try{const url=new URL(location.href);url.searchParams.set('preset',state.presetId);if(state.modelId)url.searchParams.set('model',state.modelId);url.searchParams.set('view',state.view);history.replaceState(null,'',url);}catch{}
}
function scaleLive(){
 if(frame.dataset.source!=='live')return;
 const scale=Math.max(0.1,frame.clientWidth/1280);
 for(const view of [liveBefore,liveAfter])view.style.transform=`scale(${scale})`;
}
function showRun(run){
 if(!run){state.run=null;frameEmpty.hidden=false;source.textContent='No recorded run';return;}
 state.run=run;state.modelId=run.model.id;
 if(!state.dirty)setPrompt(run.prompt,{dirty:false});
 shotBefore.src=run.conditions.before.screenshot;
 shotBefore.alt=`Model default for ${run.model.label}: ${truncate(run.prompt,140)}`;
 shotAfter.src=run.conditions.after.screenshot;
 shotAfter.alt=`With the Functional Minimalism harness for ${run.model.label}: ${truncate(run.prompt,140)}`;
 liveBefore.removeAttribute('srcdoc');liveAfter.removeAttribute('srcdoc');
 frame.dataset.source='recorded';
 frameEmpty.hidden=true;
 showRecordedButton.hidden=true;
 renderModels();renderPresetButtons();renderSource();renderMeasures();renderMeta(run);renderRunButton();renderLiveModelLine();updateURL();
}
function showLive(run=state.live){
 if(!run)return;
 state.live=run;
 liveBefore.srcdoc=run.conditions.before.html;
 liveAfter.srcdoc=run.conditions.after.html;
 frame.dataset.source='live';frameEmpty.hidden=true;
 scaleLive();renderSource();renderMeasures();renderMeta(run);renderRunButton();showRecordedButton.hidden=false;applyView();renderModels();
}
function loadRunFor(presetId,modelId){
 const run=runFor(presetId,modelId)??data?.runs.find(item=>item.preset===presetId)??null;
 if(run)showRun(run);
 else{state.run=null;frameEmpty.hidden=false;source.textContent='No recorded run for this prompt.';measureGrid.replaceChildren();metaList.replaceChildren();showRecordedButton.hidden=true;}
}
function selectPreset(id,{announce=true}={}){
 const item=data?.presets.presets.find(preset=>preset.id===id);
 if(!item)return;
 state.presetId=id;state.live=null;state.dirty=false;state.prompt=item.prompt;prompt.value=item.prompt;
 state.modelId=defaultModelForPreset(id);
 renderPresetButtons();renderModels();renderLiveModelLine();renderFixtureNote();renderRunButton();renderSource();
 loadRunFor(id,state.modelId);
 if(announce)runStatus.textContent=`${item.label} prompt loaded.`;
}
function selectModel(id,{announce=true}={}){
 if(!data)return;
 const live=state.liveRuns.find(run=>run.model.id===id);
 if(live){showLive(live);return;}
 if(state.liveTargets.length){const target=state.liveTargets.find(model=>model.id===id);if(target&&!state.liveRuns.some(run=>run.model.id===id)){runStatus.textContent=`${target.label??id} is still generating.`;return;}}
 state.live=null;state.modelId=id;
 renderModels();renderLiveModelLine();renderRunButton();renderSource();
 loadRunFor(state.presetId,id);
 if(announce){const model=modelsForPreset.find(item=>item.id===id);runStatus.textContent=`Recorded ${model?.label??id} output loaded.`;}
}
function openDialog(id){
 const dialog=document.getElementById(id);if(!dialog||dialog.open)return;
 if(id==='connect')prepareConnect();
 const preview=dialog.querySelector('iframe');if(preview&&!preview.hasAttribute('src')&&!preview.hasAttribute('srcdoc'))preview.src=preview.dataset.src;
 dialog.showModal();
}
function closeDialog(dialog){if(dialog?.open)dialog.close();}

function prepareConnect(){
 const provider=$('#provider');
 if(state.connection)provider.value=state.connection.provider;
 syncProviderFields();
 $('#api-key').value='';
 $('#connect-status').textContent=state.connection?'Connected. Choose a model, then close this panel.':'Connect a model to run your prompt.';
 syncConnected();
}
function syncProviderFields(){
 const provider=PROVIDERS[$('#provider').value]??PROVIDERS.openrouter;
 $('#key-link').href=provider.keyURL;
 $('#key-link').textContent=provider.label;
 $('#provider-docs').href=provider.docs;
 $('#api-key').placeholder=`Paste a ${provider.label} key`;
 $('#free-row').hidden=provider.id!=='openrouter';
 $('#connect-help').firstChild.textContent='Create a key at ';
}
function syncConnected(){
 const connected=$('#connected'),button=$('#disconnect-button'),select=$('#live-model-select');
 if(!state.connection){connected.hidden=true;button.hidden=true;select.replaceChildren();return;}
 connected.hidden=false;button.hidden=false;
 select.replaceChildren();
 const freeOnly=$('#free-only').checked;
 const models=state.connection.models.filter(model=>!freeOnly||state.connection.provider!=='openrouter'||model.free);
 for(const model of models){
  const option=document.createElement('option');option.value=model.id;option.textContent=model.free?`${model.label} · Free`:model.label;
  option.selected=model.id===state.connection.model;select.append(option);
 }
 if(!models.some(model=>model.id===state.connection.model)&&models[0]){state.connection.model=models[0].id;writeStore(state.connection,$('#remember').checked);}
 select.value=state.connection.model;
 $('#connected-note').textContent=`Connected. ${models.length} model${models.length===1?'':'s'} available. Choose one, then close this panel.`;
}
function defaultModel(providerId,models){
 const freeOnly=$('#free-only').checked;
 const pool=providerId==='openrouter'&&freeOnly?models.filter(model=>model.free):models;
 const pick=(patterns)=>pool.find(model=>patterns.some(pattern=>pattern.test(model.id)))??null;
 if(providerId==='openai')return pick([/gpt-5\.4-mini/i,/gpt-5\.4-nano/i,/gpt-5\.3-codex-spark/i,/gpt-4\.1-mini/i])??pool[0]??models[0];
 if(providerId==='anthropic')return pick([/haiku/i])??pool[0]??models[0];
 return pool[0]??models[0];
}
async function connectProvider(){
 const providerId=$('#provider').value;
 const key=$('#api-key').value.trim();
 const status=$('#connect-status');
 if(!key){status.textContent='Paste an API key first.';$('#api-key').focus();return;}
 const button=$('#connect-button');button.disabled=true;status.textContent='Checking the key and loading models…';
 try{
  const models=await listProviderModels(providerId,{key});
  const chatModels=providerId==='openai'?models.filter(model=>!/(embedding|moderation|tts|whisper|transcribe|image|dall-e|audio|realtime|search|computer-use|codex-mini)/i.test(model.id)):models;
  if(!chatModels.length)throw new Error('This key has no chat models available.');
  const previous=state.connection?.provider===providerId&&chatModels.some(model=>model.id===state.connection.model)?state.connection.model:null;
  const selected=previous??defaultModel(providerId,chatModels).id;
  state.connection={provider:providerId,key,models:chatModels,model:selected};
  writeStore(state.connection,$('#remember').checked);
  $('#api-key').value='';
  status.textContent='Connected. Choose a model, then close this panel.';
  syncConnected();renderLiveModelLine();$('#prompt-lab').open=true;
 }catch(error){
  status.textContent=error.message;
 }finally{
  button.disabled=false;
 }
}
function disconnectProvider(){
 state.connection=null;clearStore();$('#api-key').value='';$('#remember').checked=false;
 $('#connect-status').textContent='Disconnected. The key was removed from this browser.';
 syncConnected();renderLiveModelLine();renderRunButton();
}

function genericBrief(promptText){
 return [
  `# lab | ${data.pack.id}@${data.pack.version}`,
  `Task: ${promptText}`,
  'Object: the main object the screen acts on',
  'Action: one primary action',
  'Layout: compose around the object and the task',
  'Preserve: every fact, label, value, permission and consequence in the request',
  `Rules:\n${data.pack.principles.join('\n')}`,
  'Verify: 1280/390px; ready state. Exercise the task, keyboard, focus, contrast and reduced motion. Preserve function, access and consequences.'
 ].join('\n\n');
}
function briefFor(promptText){
 const item=preset();
 if(item&&!state.dirty&&promptText.trim()===item.prompt.trim()){
  try{return composeBrief(data.pack,data.contracts[item.id],emptyMemory,{compact:true});}catch{}
 }
 return genericBrief(promptText);
}
function guidanceForCurrentPrompt(){
 const item=preset();
 if(item&&!state.dirty&&item.guidance?.length)return item.guidance;
 return ['Identify the task, the main object and one primary action before composing.','Remove explanatory copy, repeated summaries and competing primary actions.','Keep every fact, label, value and consequence from the request.','Keep the primary action and the decision facts visible in the first 1280 by 800 screen.'];
}
function factsForCurrentPrompt(){
 const item=preset();
 return item&&!state.dirty&&state.prompt.trim()===item.prompt.trim()?item.facts??[]:[];
}
function requestForPrompt(promptText){
 const item=preset();
 const fixture=data?.fixtures?.[item?.id];
 if(!fixture||state.dirty)return promptText;
 return `${promptText}\n\nUse this fictional data exactly. Do not invent or change facts:\n\`\`\`json\n${JSON.stringify(fixture,null,2)}\n\`\`\``;
}
function measureHTML(html,width,facts){
 return new Promise(resolve=>{
  const iframe=document.createElement('iframe');
  iframe.setAttribute('sandbox','allow-same-origin');iframe.setAttribute('aria-hidden','true');iframe.setAttribute('scrolling','no');iframe.tabIndex=-1;
  iframe.style.cssText=`position:fixed;left:-10000px;top:0;width:${width}px;height:${width===390?844:800}px;border:0;`;
  let done=false;
  const finish=result=>{if(done)return;done=true;iframe.remove();resolve(result);};
  const timer=setTimeout(()=>finish(null),5000);
  iframe.addEventListener('load',()=>{clearTimeout(timer);try{const actualWidth=iframe.contentWindow?.innerWidth??width;finish(measureDocument(iframe.contentDocument,{width:actualWidth,facts}));}catch{finish(null);}});
  iframe.srcdoc=html;document.body.append(iframe);
 });
}
function setBusy(busy,label){
 state.busy=busy;frame.setAttribute('aria-busy',String(busy));frameLoading.hidden=!busy;
 if(label)loadingLabel.textContent=label;
 renderRunButton();
}
function setStatus(targetId,status){state.liveStatus.set(targetId,status);renderModels();}
async function generateOne(target,promptText,connection,rootController){
 const local=new AbortController();
 const forward=()=>local.abort();
 rootController.signal.addEventListener('abort',forward);
 const timer=setTimeout(()=>local.abort(),180000);
 const maxTokens=connection.provider==='openrouter'?32000:16000;
 const reasoningEffort=connection.provider==='openrouter'?'low':null;
 const request=requestForPrompt(promptText);
 try{
  setStatus(target.id,'baseline');
  const baseline=await requestProvider(connection.provider,{key:connection.key,model:target.id,messages:buildBaselineMessages(request),maxTokens,temperature:0.3,reasoningEffort,signal:local.signal});
  const beforeHTML=sanitizeHTML(extractHTML(baseline.text));
  setStatus(target.id,'harness');
  const harness=await requestProvider(connection.provider,{key:connection.key,model:target.id,messages:buildHarnessMessages({prompt:request,beforeHTML:contentOnlyHTML(beforeHTML),brief:briefFor(promptText),guidance:guidanceForCurrentPrompt(),style:preset()?.style,gallery:data.gallery,outline:true}),maxTokens,temperature:0.3,reasoningEffort,signal:local.signal});
  const afterHTML=sanitizeHTML(extractHTML(harness.text));
  setStatus(target.id,'measuring');
  const facts=factsForCurrentPrompt();
  const [beforeDesktop,beforeMobile,afterDesktop,afterMobile]=await Promise.all([measureHTML(beforeHTML,1280,facts),measureHTML(beforeHTML,390,facts),measureHTML(afterHTML,1280,facts),measureHTML(afterHTML,390,facts)]);
  const item=preset();
  const run={schema:'functional-minimalism.lab-run/1',id:`live-${target.id}-${Date.now()}`,preset:state.presetId,presetLabel:item?.label??'Custom prompt',prompt:promptText,fixture:item?.fixture??null,createdAt:new Date().toISOString(),model:{id:target.id,label:target.label??modelLabel(target.id),provider:PROVIDERS[connection.provider]?.label??connection.provider,via:'Live browser call',free:!!target.free},harness:{pack:`${data.pack.id}@${data.pack.version}`,gallery:data.gallery?.version??null,brief:true},conditions:{before:{label:'Model default',html:beforeHTML,elapsedMs:baseline.elapsedMs??null,usage:baseline.usage??null,finishReason:baseline.finishReason,measures:{desktop:beforeDesktop,mobile:beforeMobile},screenshot:null},after:{label:'With harness',html:afterHTML,elapsedMs:harness.elapsedMs??null,usage:harness.usage??null,finishReason:harness.finishReason,measures:{desktop:afterDesktop,mobile:afterMobile},screenshot:null}},limitations:'A single live run. The harness pass receives the brief, rules and approved Atelier gallery; it does not run a coding-agent repair loop. Results vary by model, prompt and sampling. This is not a benchmark.'};
  state.liveStatus.set(target.id,'done');
  state.liveRuns.push(run);
  if(!state.live)showLive(run);
  renderModels();
  return run;
 }catch(error){
  state.liveStatus.set(target.id,'error');
  renderModels();
  throw error;
 }finally{
  clearTimeout(timer);rootController.signal.removeEventListener('abort',forward);
 }
}
async function runComparison(){
 if(state.busy)return;
 if(!state.connection){runStatus.textContent='Connect a model to generate a design.';openDialog('connect');return;}
 const promptText=prompt.value.trim();
 if(!promptText){runStatus.textContent='Write a prompt first.';prompt.focus();return;}
 state.prompt=promptText;
 const item=preset();
 state.dirty=!!item&&promptText!==item.prompt.trim();
 const connection=state.connection;
 const targets=liveTargetsFor(connection);
 if(!targets.length){runStatus.textContent='No model is available for this key.';return;}
 const previous={run:state.run,live:state.live,liveRuns:state.liveRuns,liveTargets:state.liveTargets};
 state.liveRuns=[];state.liveTargets=targets;state.live=null;state.liveStatus=new Map(targets.map(target=>[target.id,'queued']));liveThumbs.clear();
 const controller=new AbortController();state.abort=controller;
 setBusy(true,'Generating your design');
 runStatus.textContent=`Generating one design with ${modelLabel(targets[0].id)}. The first draft has no harness context; the second uses the approved Atelier gallery.`;
 renderModels();
 try{
  const results=await mapLimit(targets,1,async target=>{
   const run=await generateOne(target,promptText,connection,controller);
   loadingLabel.textContent='Design ready';
   runStatus.textContent='Design ready. The first draft is under Before; the approved gallery result is under After.';
   return run;
  });
  const successes=results.filter(result=>result.status==='fulfilled').length;
  if(successes){
   state.view='after';applyView();renderModels();renderSource();updateURL();
   if(!state.live&&state.liveRuns[0])showLive(state.liveRuns[0]);
   runStatus.textContent=controller.signal.aborted?'Cancelled. Keeping the finished design.':'Design ready. The first draft is under Before; the approved gallery result is under After.';
  }else{
   state.liveRuns=previous.liveRuns;state.liveTargets=previous.liveTargets;state.live=previous.live;liveThumbs.clear();
   if(previous.live)showLive(previous.live);else if(previous.run)showRun(previous.run);else frameEmpty.hidden=false;
   const reason=results.find(result=>result.status==='rejected')?.reason?.message??'The provider did not return a design.';
   runStatus.textContent=`No design completed. ${reason}`;
  }
 }finally{
  state.abort=null;setBusy(false);renderRunButton();
 }
}
function downloadRun(){
 const run=currentRunForExport();if(!run)return;
 const payload={...run,downloadedAt:new Date().toISOString(),page:location.href,note:'Generated by the Functional Minimalism prompt lab. No API key is included.'};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download=`${run.preset??'screen'}-${run.model.id}-${state.live?'live':'recorded'}.json`;link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function approveRun(){
 const run=currentRunForExport();if(!run)return;
 const approvedAt=new Date().toISOString();
 const proposal={schema:'functional-minimalism.gallery-proposal/1',approvedAt,model:run.model,prompt:run.prompt,fixture:run.fixture??null,harness:run.harness,measures:run.conditions.after.measures,html:run.conditions.after.html,note:'Review this render, extract reusable components, then merge them into gallery/templates.json with approval metadata.'};
 try{const key='functional-minimalism.gallery.approvals.v1';const existing=JSON.parse(localStorage.getItem(key)??'[]');existing.push({...proposal,html:undefined});localStorage.setItem(key,JSON.stringify(existing));}catch{/* Storage can be unavailable. */}
 const url=URL.createObjectURL(new Blob([JSON.stringify(proposal,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download=`gallery-proposal-${run.model.id}.json`;link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 runStatus.textContent='Design saved in this browser. The downloaded proposal can be reviewed and merged into the hosted gallery.';
}

function wire(){
 prompt.addEventListener('input',()=>{
  state.prompt=prompt.value;
  const item=preset();state.dirty=!item||prompt.value.trim()!==item.prompt.trim();
  renderFixtureNote();renderRunButton();renderSource();
  if(state.dirty)runStatus.textContent='Your prompt has not been run. The recorded example stays visible until you run it with a connected model.';
  else runStatus.textContent='';
 });
 $('#prompt-form').addEventListener('submit',event=>{event.preventDefault();runComparison();});
 for(const button of $$('[data-preset]'))button.addEventListener('click',()=>selectPreset(button.dataset.preset));
 for(const button of $$('[data-view]'))button.addEventListener('click',()=>{state.view=button.dataset.view==='after'?'after':'before';applyView();updateURL();});
 for(const button of $$('[data-measure-view]'))button.addEventListener('click',()=>{state.measureView=button.dataset.measureView==='mobile'?'mobile':'desktop';renderMeasures();});
 for(const button of $$('[data-open]'))button.addEventListener('click',()=>openDialog(button.dataset.open));
 for(const button of $$('[data-close]'))button.addEventListener('click',()=>closeDialog(button.closest('dialog')));
 for(const button of $$('[data-next]'))button.addEventListener('click',()=>{closeDialog(button.closest('dialog'));openDialog(button.dataset.next);});
 for(const dialog of $$('dialog'))dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog(dialog);});
 downloadRunButton.addEventListener('click',downloadRun);
 approveRunButton.addEventListener('click',approveRun);
 showRecordedButton.addEventListener('click',()=>{
  const item=preset();state.live=null;state.liveRuns=[];state.liveTargets=[];state.liveStatus.clear();liveThumbs.clear();state.dirty=false;state.prompt=item?.prompt??'';prompt.value=state.prompt;
  selectPreset(state.presetId,{announce:false});runStatus.textContent='Back to the recorded examples.';
 });
 cancelButton.addEventListener('click',()=>{state.abort?.abort();runStatus.textContent='Cancelling…';});
 $('#provider').addEventListener('change',()=>{syncProviderFields();syncConnected();});
 $('#free-only').addEventListener('change',()=>{syncConnected();if(state.connection)writeStore(state.connection,$('#remember').checked);});
 $('#live-model-select').addEventListener('change',event=>{
  if(!state.connection)return;
  state.connection.model=event.target.value;
  writeStore(state.connection,$('#remember').checked);
  $('#connect-status').textContent=`Model set to ${modelLabel(state.connection.model)}.`;
  renderLiveModelLine();renderRunButton();
 });
 $('#connect-button').addEventListener('click',connectProvider);
 $('#disconnect-button').addEventListener('click',disconnectProvider);
 let startX=null;
 frameLoading.addEventListener('pointerdown',event=>event.stopPropagation());
 frame.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button!==0)return;startX=event.clientX;frame.setPointerCapture?.(event.pointerId);});
 frame.addEventListener('pointermove',event=>{if(startX===null)return;const delta=event.clientX-startX;if(delta>45){state.view='after';applyView();updateURL();startX=null;}else if(delta<-45){state.view='before';applyView();updateURL();startX=null;}});
 frame.addEventListener('pointerup',()=>{startX=null;});
 frame.addEventListener('pointercancel',()=>{startX=null;});
 frame.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();state.view='before';applyView();updateURL();}if(event.key==='ArrowRight'){event.preventDefault();state.view='after';applyView();updateURL();}});
 window.addEventListener('resize',scaleLive);
 if('ResizeObserver'in window)new ResizeObserver(scaleLive).observe(frame);
 const info=$('#info'),details=$('#demo-details');
 const setInfo=open=>{details.hidden=!open;info.setAttribute('aria-expanded',String(open));};
 info.addEventListener('click',()=>setInfo(details.hidden));
 document.addEventListener('click',event=>{if(!details.hidden&&!event.target.closest('.demo-info'))setInfo(false);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')setInfo(false);});
 const command=()=>`node bin/functional-minimalism.mjs setup ../my-app --template ${$('#template').value} --client ${$('#client').value}\nnode bin/functional-minimalism.mjs doctor --project ../my-app`;
 const updateCommand=()=>{$('#command').textContent=command();$('#copy-status').textContent='';};
 for(const select of $$('.setup-fields select'))select.addEventListener('change',updateCommand);
 $('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(command());$('#copy-status').textContent='Copied. Run inside the extracted source folder.';}catch{const range=document.createRange();range.selectNodeContents($('#command'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);$('#copy-status').textContent='Commands selected. Use your browser’s Copy command.';}});
 updateCommand();
}
function runSelfTest(){
 const results=[];const check=(name,pass,detail='')=>results.push({name,pass,detail});
 check('recorded runs loaded',state.runs?.length>=4,`${state.runs?.length??0} runs`);
 check('default run shown',!!state.run,state.run?.id??'none');
 check('measure table rendered',$$('#measure-grid tbody tr').length>=6);
 const before=state.run?.conditions.before.measures.desktop,after=state.run?.conditions.after.measures.desktop;
 check('measured words present',Number.isFinite(before?.words)&&Number.isFinite(after?.words));
 check('four recorded models',modelsForPreset.length>=4,`${modelsForPreset.length} models`);
 check('approved template selected',state.run?.model.id===preset()?.approvedModel,state.run?.model.id??'none');
 check('one approved rail card',document.querySelectorAll('#models .model').length===1);
 check('benchmark note visible',!document.querySelector('#benchmark-note')?.hidden);
 check('gallery link present',!!document.querySelector('a[href="../gallery/"]'));
 const originalModel=state.modelId;
 const other=modelsForPreset.find(model=>model.id!==state.modelId);
 if(other){selectModel(other.id,{announce:false});check('model switch loads a run',state.run?.model.id===other.id,state.run?.id??'none');selectModel(originalModel,{announce:false});}
 state.view='after';applyView();check('after view selected',frame.dataset.view==='after');
 state.view='before';applyView();check('before view selected',frame.dataset.view==='before');
 state.view='after';applyView();
 const passed=results.filter(result=>result.pass).length,failed=results.length-passed;
 const output=document.createElement('script');output.id='lab-test-results';output.type='application/json';output.textContent=JSON.stringify({width:innerWidth,passed,failed,results});document.body.append(output);
 if(failed)document.documentElement.dataset.labTest='fail';
}

async function boot(){
 restoreConnection();
 try{data=await loadData();}catch(error){
  frameEmpty.hidden=false;frameEmpty.querySelector('p').textContent=`The recorded runs could not load: ${error.message}`;runButton.disabled=true;source.textContent='No runs loaded.';renderLiveModelLine();return;
 }
 state.runs=data.runs;
 const params=new URLSearchParams(location.search); const requestedPreset=params.get('preset');
 if(data.presets.presets.some(item=>item.id===requestedPreset))state.presetId=requestedPreset;
 const item=preset();
 state.prompt=item?.prompt??data.runs[0]?.prompt??'';
 prompt.value=state.prompt;
 state.modelId=params.get('model')??defaultModelForPreset(state.presetId);
 state.view=params.get('view')==='before'?'before':'after';
 wire();
 renderPresetButtons();renderModels();renderLiveModelLine();renderFixtureNote();renderRunButton();renderSource();renderMeasureViewButtons();applyView();renderBenchmark();
 loadRunFor(state.presetId,state.modelId);
 if(!state.run&&data.runs[0])showRun(data.runs[0]);
 if(params.has('selftest')||window.frameElement?.hasAttribute('data-selftest'))runSelfTest();
}
window.__lab={state,get data(){return data;},selectPreset,selectModel,runComparison,showRun,openDialog};
try{
 await boot();
}catch(error){
 frameEmpty.hidden=false;
 const message=frameEmpty.querySelector('p');if(message)message.textContent=`The prompt lab could not start: ${error.message}`;
 runButton.disabled=true;source.textContent='Prompt lab unavailable.';
}
