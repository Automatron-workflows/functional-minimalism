// Four recorded or live designs. Before is the model's first draft. After is the
// same model with the Functional Minimalism brief, Atelier system and gallery.
import {PROVIDERS,buildBaselineMessages,buildHarnessMessages,contentOnlyHTML,extractHTML,sanitizeHTML,requestProvider,listProviderModels} from '../src/lab.mjs?v=2026-11-18-13';
import {composeBrief,validatePack,validateContract} from '../src/core.mjs?v=2026-11-18-13';

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const fmtDate=value=>{if(!value)return'Date not recorded';const date=new Date(value);if(Number.isNaN(date.valueOf()))return'Date not recorded';return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(date);};
const truncate=(value,length=110)=>{const text=String(value??'').replace(/\s+/g,' ').trim();return text.length>length?`${text.slice(0,length-1)}…`:text;};
const emptyMemory={schema:'design-harness.memory/1',decisions:[]};
const STORE_KEY='functional-minimalism.lab.connection.v1';
const state={prompt:'',busy:false,connection:null,connector:null,abort:null,results:new Map(),targets:[],liveCards:new Map()};
let data=null;

const prompt=$('#prompt'),grid=$('#models-grid'),runButton=$('#run'),runLabel=$('#run-label'),runStatus=$('#run-status'),liveModel=$('#live-model'),headerConnect=$('#header-connect'),showRecordedButton=$('#show-recorded');
const connectorNote=$('#connector-note'),noConnectorNote=$('#no-connector-note');

function readStore(storage){try{const raw=storage.getItem(STORE_KEY);return raw?JSON.parse(raw):null;}catch{return null;}}
function writeStore(connection,remember){try{if(remember){localStorage.setItem(STORE_KEY,JSON.stringify(connection));sessionStorage.removeItem(STORE_KEY);}else{localStorage.removeItem(STORE_KEY);sessionStorage.setItem(STORE_KEY,JSON.stringify(connection));}}catch{}}
function clearStore(){try{localStorage.removeItem(STORE_KEY);sessionStorage.removeItem(STORE_KEY);}catch{}}
function restoreConnection(){const stored=readStore(localStorage)??readStore(sessionStorage);if(stored&&PROVIDERS[stored.provider]&&stored.key&&Array.isArray(stored.models)&&stored.models.length)state.connection=stored;}
function preset(){return data?.presets.presets[0]??null;}
function modelLabel(id){const model=state.connection?.models?.find(item=>item.id===id)??state.connector?.models?.find(item=>item.id===id);return model?.label??id;}

async function fetchJSON(url){const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error(`${url} returned ${response.status}`);return response.json();}
async function loadData(){
 if(globalThis.__labData)return globalThis.__labData;
 const index=await fetchJSON('./runs/index.json');
 const presets=await fetchJSON('./presets.json');
 const pack=validatePack(await fetchJSON('../packs/atelier/pack.json'));
 const contracts={},fixtures={};
 for(const item of presets.presets){
  contracts[item.id]=validateContract(await fetchJSON(item.contract));
  if(item.fixture)fixtures[item.id]=await fetchJSON(item.fixture);
 }
 const settled=await Promise.allSettled(index.runs.map(row=>fetchJSON(`./runs/${row.id}.json`)));
 const runs=settled.filter(result=>result.status==='fulfilled').map(result=>result.value);
 let gallery=null;
 try{gallery=await fetchJSON('../gallery/templates.json');}catch{}
 return {index,presets,pack,contracts,fixtures,runs,gallery};
}
async function detectConnector(){
 let config=null;
 try{config=await fetchJSON('./lab-config.json');}catch{}
 const endpoints=[];
 if(config?.endpoint)endpoints.push({kind:'remote',endpoint:String(config.endpoint).replace(/\/$/,'')});
 if(['localhost','127.0.0.1','[::1]'].includes(location.hostname))endpoints.push({kind:'local',endpoint:'/api/lab'});
 for(const candidate of endpoints){
  try{
   const response=await fetch(`${candidate.endpoint}/health`,{cache:'no-store'});
   if(!response.ok)continue;
   const health=await response.json();
   if(!health.ok||!Array.isArray(health.models)||!health.models.length)continue;
   state.connector={...candidate,models:health.models};
   return;
  }catch{}
 }
}
function providerLabel(){return PROVIDERS[state.connection?.provider]?.label??state.connection?.provider??'';}
function renderLiveModelLine(){
 liveModel.replaceChildren();
 if(state.connection){
  const strong=document.createElement('strong');strong.textContent=`${providerLabel()} · 4 models`;
  const change=document.createElement('button');change.type='button';change.className='connect-link';change.textContent='Change';
  change.addEventListener('click',()=>openDialog('connect'));
  liveModel.append('Run with ',strong,' · ',change);
 }else if(state.connector){
  const strong=document.createElement('strong');strong.textContent=`${state.connector.models.length} models`;
  liveModel.append(state.connector.kind==='local'?'Free local connector · ':'Free public connector · ',strong,' · no key');
 }else{
  const button=document.createElement('button');button.type='button';button.className='connect-link';button.textContent='Connect a model';
  button.addEventListener('click',()=>openDialog('connect'));
  liveModel.append(button,' to generate four designs.');
 }
 headerConnect.textContent=state.connection?'Connected':state.connector?'Free connector':'Connect a model';
 headerConnect.classList.toggle('is-connected',!!(state.connection||state.connector));
}
function renderRunButton(){
 runLabel.textContent=state.busy?'Generating…':'Generate 4 designs';
 runButton.disabled=state.busy;
 runButton.setAttribute('aria-busy',String(state.busy));
 runButton.title=state.connection||state.connector?'Generate four designs with the harness':'Connect a model to generate four designs';
}

function switchButtons(card,side){
 for(const button of $$('[data-side]',card))button.setAttribute('aria-pressed',String(button.dataset.side===side));
 card.dataset.side=side;
}
function cardShell(label,meta){
 const card=document.createElement('article');card.className='model-card';card.dataset.side='after';
 const head=document.createElement('header');head.className='card-head';
 const identity=document.createElement('div');
 const title=document.createElement('h2');title.className='card-title';title.textContent=label;
 const subtitle=document.createElement('p');subtitle.className='card-meta';subtitle.textContent=meta;
 identity.append(title,subtitle);
 const switchGroup=document.createElement('div');switchGroup.className='card-switch';switchGroup.setAttribute('role','group');switchGroup.setAttribute('aria-label','Design state');
 for(const side of ['before','after']){
  const button=document.createElement('button');button.type='button';button.dataset.side=side;button.textContent=side==='before'?'Before':'After';button.setAttribute('aria-pressed',String(side==='after'));
  switchGroup.append(button);
 }
 head.append(identity,switchGroup);
 const view=document.createElement('div');view.className='card-view';
 card.append(head,view);
 return {card,view,switchGroup};
}
function wireSwitches(card,onSide){
 for(const button of $$('[data-side]',card))button.addEventListener('click',()=>{switchButtons(card,button.dataset.side);onSide?.(button.dataset.side);});
}
function renderRecordedCards(){
 grid.replaceChildren();
 if(showRecordedButton)showRecordedButton.hidden=true;
 state.liveCards.clear();
 const models=(data?.index.models??[]).slice();
 if(!models.length){const empty=document.createElement('p');empty.className='rail-empty';empty.textContent='No recorded designs loaded.';grid.append(empty);return;}
 let count=0;
 for(const model of models){
  const run=data.runs.find(item=>item.model.id===model.id);
  if(!run)continue;
  count+=1;
  const {card,view}=cardShell(model.label,model.free?'Free':model.via??'Open model');
  for(const side of ['before','after']){
   const image=document.createElement('img');image.className=`card-shot ${side}`;image.src=run.conditions[side].screenshot;image.alt=side==='before'?`${model.label} first draft`:`${model.label} with the harness`;image.loading='lazy';
   view.append(image);
  }
  wireSwitches(card,side=>{switchButtons(card,side);});
  switchButtons(card,'after');
  grid.append(card);
 }
 if(!count){const empty=document.createElement('p');empty.className='rail-empty';empty.textContent='No recorded designs loaded.';grid.append(empty);}
}
function liveCard(target){
 const {card,view}=cardShell(target.label??target.id,target.free?'Free':'Open model');
 const status=document.createElement('p');status.className='card-status';status.textContent='Queued';
 view.append(status);
 wireSwitches(card,side=>{
  const result=state.results.get(target.id);
  const frame=$('.card-live',view);
  if(!result||!frame)return;
  frame.srcdoc=side==='after'?result.afterHTML:result.beforeHTML;
  frame.title=`${target.label??target.id} ${side==='after'?'with the harness':'first draft'}`;
  scaleCardFrames();
 });
 for(const button of $$('[data-side]',card))button.disabled=true;
 switchButtons(card,'after');
 return {card,view,status};
}
function renderLiveCards(targets){
 grid.replaceChildren();
 if(showRecordedButton)showRecordedButton.hidden=false;
 state.liveCards.clear();
 for(const target of targets){
  const item=liveCard(target);
  state.liveCards.set(target.id,item);
  grid.append(item.card);
 }
}
function updateLiveCard(target,result){
 const item=state.liveCards.get(target.id);if(!item)return;
 item.card.classList.add('is-ready');
 item.status.remove();
 const frame=document.createElement('iframe');frame.className='card-live';frame.title=`${target.label??target.id} with the harness`;frame.setAttribute('sandbox','allow-same-origin');frame.setAttribute('tabindex','-1');frame.srcdoc=result.afterHTML;
 item.view.append(frame);
 for(const button of $$('[data-side]',item.card))button.disabled=false;
 switchButtons(item.card,'after');
 scaleCardFrames();
}
function markLiveCard(target,statusText){
 const item=state.liveCards.get(target.id);if(!item)return;
 item.status.textContent=statusText;
}
function scaleCardFrames(){
 for(const frame of $$('.card-live')){
  const view=frame.closest('.card-view');if(!view)continue;
  frame.style.transform=`scale(${Math.max(.1,view.clientWidth/1280)})`;
 }
}

function genericBrief(promptText){
 return [`# lab | ${data.pack.id}@${data.pack.version}`,`Task: ${promptText}`,'Object: the main object the screen acts on','Action: one primary action','Layout: compose around the object and the task','Preserve: every fact, label, value, permission and consequence in the request',`Rules:\n${data.pack.principles.join('\n')}`,'Verify: 1280/390px; ready state. Exercise the task, keyboard, focus, contrast and reduced motion. Preserve function, access and consequences.'].join('\n\n');
}
function briefFor(promptText){
 const item=preset();
 if(item&&promptText.trim()===item.prompt.trim()){try{return composeBrief(data.pack,data.contracts[item.id],emptyMemory,{compact:true});}catch{}}
 return genericBrief(promptText);
}
function guidanceFor(promptText){
 const item=preset();
 return item&&promptText.trim()===item.prompt.trim()?item.guidance??[]:['Identify the task, the main object and one primary action before composing.','Remove explanatory copy, repeated summaries and competing primary actions.','Keep every fact, label, value and consequence from the request.','Keep the primary action and the decision facts visible in the first 1280 by 800 screen.'];
}
function requestForPrompt(promptText){
 const item=preset(),fixture=data?.fixtures?.[item?.id];
 if(!item||!fixture||promptText.trim()!==item.prompt.trim())return promptText;
 return `${promptText}\n\nUse this fictional data exactly. Do not invent or change facts:\n\`\`\`json\n${JSON.stringify(fixture,null,2)}\n\`\`\``;
}
async function requestConnector(endpoint,{model,messages,maxTokens=16000,signal}={}){
 const response=await fetch(`${endpoint}/generate`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model,messages,maxTokens}),signal});
 const text=await response.text();
 let json=null;try{json=JSON.parse(text);}catch{}
 if(!response.ok)throw new Error(json?.error??text.slice(0,300)??`Free connector returned ${response.status}`);
 if(!json?.text?.trim())throw new Error('The free connector returned an empty response.');
 return {text:json.text,model:json.model??model,finishReason:json.finishReason??null,usage:json.usage??null};
}
function freeModelsFor(connection){
 if(!connection||connection.provider!=='openrouter')return[];
 return (connection.models??[]).filter(model=>model.free);
}
function preferredModels(connection){
 if(connection.provider==='openrouter'){
  const free=freeModelsFor(connection);
  const families=[/deepseek/i,/qwen/i,/gemma/i,/llama/i,/nemotron/i,/glm/i,/ernie/i,/dots/i,/cohere/i,/liquid/i,/mistral/i];
  const picked=[];
  for(const family of families){const model=free.find(candidate=>family.test(candidate.id)&&!picked.includes(candidate));if(model)picked.push(model);if(picked.length>=4)break;}
  for(const model of free){if(picked.length>=4)break;if(!picked.includes(model))picked.push(model);}
  return picked;
 }
 const patterns=connection.provider==='anthropic'?[/haiku/i,/sonnet/i,/opus/i,/fable/i]:[/gpt-5\.4-nano/i,/gpt-5\.4-mini/i,/gpt-5\.3-codex-spark/i,/gpt-6-luna/i,/gpt-5\.3-codex/i];
 const picked=[];
 for(const pattern of patterns){const model=(connection.models??[]).find(candidate=>pattern.test(candidate.id)&&!picked.includes(candidate));if(model)picked.push(model);}
 for(const model of connection.models??[]){if(picked.length>=4)break;if(!picked.includes(model))picked.push(model);}
 return picked;
}
function liveTargetsFor(connection){
 if(!connection)return[];
 if(connection.provider==='connector')return state.connector?.models??[];
 return preferredModels(connection).slice(0,4).map(model=>({id:model.id,label:model.label,free:!!model.free}));
}
function setBusy(busy){state.busy=busy;renderRunButton();}
async function runComparison(){
 if(state.busy)return;
 const connection=state.connection??(state.connector?{provider:'connector'}:null);
 if(!connection){runStatus.textContent='Connect a model to generate four designs.';openDialog('connect');return;}
 const promptText=prompt.value.trim();
 if(!promptText){runStatus.textContent='Write a prompt first.';prompt.focus();return;}
 state.prompt=promptText;
 const targets=liveTargetsFor(connection);
 if(!targets.length){runStatus.textContent='No models are available for this connection.';return;}
 state.results=new Map();state.targets=targets;
 renderLiveCards(targets);
 setBusy(true);
 runStatus.textContent=`Generating ${targets.length} designs. Each model drafts the screen, then applies the same harness.`;
 const controller=new AbortController();state.abort=controller;
 try{
  let completed=0;
  const results=await mapLimit(targets,2,async target=>{
   try{
    markLiveCard(target,'Drafting');
    const local=new AbortController();
    const forward=()=>local.abort();
    controller.signal.addEventListener('abort',forward);
    const timer=setTimeout(()=>local.abort(),300000);
    const connector=connection.provider==='connector';
    const maxTokens=connector?24000:connection.provider==='openrouter'?32000:16000;
    const reasoningEffort=connection.provider==='openrouter'?'low':null;
    const request=requestForPrompt(promptText);
    const call=messages=>connector
      ?requestConnector(state.connector.endpoint,{model:target.id,messages,maxTokens,signal:local.signal})
      :requestProvider(connection.provider,{key:connection.key,model:target.id,messages,maxTokens,temperature:0.3,reasoningEffort,signal:local.signal});
    try{
     const baseline=await call(buildBaselineMessages(request));
     const beforeHTML=sanitizeHTML(extractHTML(baseline.text));
     markLiveCard(target,'Harness');
     const harness=await call(buildHarnessMessages({prompt:request,beforeHTML:contentOnlyHTML(beforeHTML),brief:briefFor(promptText),guidance:guidanceFor(promptText),style:preset()?.style,gallery:data.gallery,outline:true}));
     const afterHTML=sanitizeHTML(extractHTML(harness.text));
     const result={target,beforeHTML,afterHTML};
     state.results.set(target.id,result);
     updateLiveCard(target,result);
     completed+=1;
     runStatus.textContent=`${completed} of ${targets.length} designs ready.`;
     return result;
    }finally{clearTimeout(timer);controller.signal.removeEventListener('abort',forward);}
   }catch(error){
    markLiveCard(target,controller.signal.aborted?'Cancelled':'Failed');
    throw error;
   }
  });
  const successes=results.filter(result=>result.status==='fulfilled').length;
  runStatus.textContent=controller.signal.aborted?`Cancelled. ${successes} of ${targets.length} designs finished.`:`${successes} of ${targets.length} designs ready. Use Before and After on each card.`;
 }finally{
  state.abort=null;setBusy(false);
 }
}
async function mapLimit(items,limit,worker){
 const results=new Array(items.length);let index=0;
 async function run(){while(index<items.length){const current=index++;try{results[current]={status:'fulfilled',value:await worker(items[current])};}catch(error){results[current]={status:'rejected',reason:error};}}}
 await Promise.all(Array.from({length:Math.min(limit,items.length)},run));
 return results;
}

function openDialog(id){const dialog=document.getElementById(id);if(!dialog||dialog.open)return;if(id==='connect')prepareConnect();dialog.showModal();}
function closeDialog(dialog){if(dialog?.open)dialog.close();}
function syncProviderFields(){
 const provider=PROVIDERS[$('#provider').value]??PROVIDERS.openrouter;
 $('#key-link').href=provider.keyURL;$('#key-link').textContent=provider.label;
 $('#provider-docs').href=provider.docs;
 $('#api-key').placeholder=`Paste a ${provider.label} key`;
 $('#free-row').hidden=provider.id!=='openrouter';
 $('#connect-help').firstChild.textContent='Create a key at ';
}
function prepareConnect(){
 syncProviderFields();
 $('#api-key').value='';
 $('#connect-status').textContent=state.connection?'Connected. Close this panel and generate.':state.connector?'Free connector ready. No key needed.':'Connect a model to generate four designs.';
 connectorNote.hidden=!state.connector;
 noConnectorNote.hidden=!!state.connector;
 if(state.connector)connectorNote.textContent=`Free ${state.connector.kind==='local'?'local':'public'} connector active: ${state.connector.models.map(model=>model.label).join(', ')}. No key is needed.`;
 $('#disconnect-button').hidden=!state.connection;
}
async function connectProvider(){
 const providerId=$('#provider').value,key=$('#api-key').value.trim(),status=$('#connect-status');
 if(!key){status.textContent='Paste an API key first.';$('#api-key').focus();return;}
 const button=$('#connect-button');button.disabled=true;status.textContent='Checking the key and loading models…';
 try{
  let models=await listProviderModels(providerId,{key});
  if(providerId==='openai')models=models.filter(model=>!/(embedding|moderation|tts|whisper|transcribe|image|dall-e|audio|realtime|search|computer-use|codex-mini)/i.test(model.id));
  if(!models.length)throw new Error('This key has no chat models available.');
  state.connection={provider:providerId,key,models};
  writeStore(state.connection,$('#remember').checked);
  status.textContent='Connected. Close this panel and generate.';
  $('#api-key').value='';$('#disconnect-button').hidden=false;
  renderLiveModelLine();
 }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
}
function disconnectProvider(){state.connection=null;clearStore();$('#connect-status').textContent='Disconnected. The key was removed from this browser.';$('#disconnect-button').hidden=true;renderLiveModelLine();}

function runSelfTest(){
 const results=[];const check=(name,pass,detail='')=>results.push({name,pass,detail});
 const cards=$$('.model-card');
 check('four recorded cards',cards.length===4,`${cards.length} cards`);
 check('each card has before and after',cards.every(card=>card.querySelectorAll('img.card-shot').length===2));
 check('prompt prefilled',prompt.value.includes('North Studio'));
 const first=cards[0];
 if(first){const before=first.querySelector('[data-side="before"]');before.click();check('before switch',first.dataset.side==='before');const after=first.querySelector('[data-side="after"]');after.click();check('after switch',first.dataset.side==='after');}
 const passed=results.filter(result=>result.pass).length,failed=results.length-passed;
 const output=document.createElement('script');output.id='lab-test-results';output.type='application/json';output.textContent=JSON.stringify({width:innerWidth,passed,failed,results});document.body.append(output);
 if(failed)document.documentElement.dataset.labTest='fail';
}

function wire(){
 prompt.addEventListener('input',()=>{state.prompt=prompt.value;});
 $('#prompt-form').addEventListener('submit',event=>{event.preventDefault();runComparison();});
 for(const button of $$('[data-open]'))button.addEventListener('click',()=>openDialog(button.dataset.open));
 for(const button of $$('[data-close]'))button.addEventListener('click',()=>closeDialog(button.closest('dialog')));
 for(const dialog of $$('dialog'))dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog(dialog);});
 $('#provider').addEventListener('change',syncProviderFields);
 $('#connect-button').addEventListener('click',connectProvider);
 $('#disconnect-button').addEventListener('click',disconnectProvider);
 showRecordedButton.addEventListener('click',()=>{state.results=new Map();renderRecordedCards();runStatus.textContent='Recorded designs restored.';});
 window.addEventListener('resize',scaleCardFrames);
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

async function boot(){
 restoreConnection();
 try{data=await loadData();}catch(error){runStatus.textContent=`The designs could not load: ${error.message}`;runButton.disabled=true;return;}
 await detectConnector();
 const item=preset();
 state.prompt=item?.prompt??data.runs[0]?.prompt??'';
 prompt.value=state.prompt;
 wire();
 renderRunButton();renderLiveModelLine();
 renderRecordedCards();
 if(new URLSearchParams(location.search).has('selftest')||window.frameElement?.hasAttribute('data-selftest'))runSelfTest();
}
window.__lab={state,get data(){return data;},runComparison};
try{await boot();}catch(error){runStatus.textContent=`The demo could not start: ${error.message}`;runButton.disabled=true;}
