// Manual before/after comparison. No autoplay, no model calls, no real payment.
const film=document.querySelector('.film');
const modelButtons=[...document.querySelectorAll('.model')];
const viewButtons=[...document.querySelectorAll('.state')];
const stageFrame=document.querySelector('.frame');
let selected='claude',view='before';
function setModel(model){
 selected=model;
 film.dataset.model=model;
 modelButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.model===model)));
}
function setView(next){
 view=next==='after'?'after':'before';
 film.dataset.view=view;
 viewButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)));
}
modelButtons.forEach(button=>button.addEventListener('click',()=>setModel(button.dataset.model)));
viewButtons.forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
let startX=null;
stageFrame.addEventListener('pointerdown',event=>{startX=event.clientX;stageFrame.setPointerCapture(event.pointerId);});
stageFrame.addEventListener('pointermove',event=>{if(startX===null)return;const delta=event.clientX-startX;if(delta>40){setView('after');startX=null;}else if(delta<-40){setView('before');startX=null;}});
stageFrame.addEventListener('pointerup',()=>{startX=null;});
stageFrame.addEventListener('pointercancel',()=>{startX=null;});
const dialogs=[...document.querySelectorAll('dialog')];
function openDialog(id){const dialog=document.getElementById(id);if(!dialog||dialog.open)return;const preview=dialog.querySelector('iframe');if(preview&&!preview.hasAttribute('src')&&!preview.hasAttribute('srcdoc'))preview.src=preview.dataset.src;dialog.showModal();}
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>openDialog(button.dataset.open)));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
document.querySelectorAll('[data-next]').forEach(button=>button.addEventListener('click',()=>{button.closest('dialog').close();openDialog(button.dataset.next);}));
const info=document.querySelector('#info'),details=document.querySelector('#demo-details');
function setInfo(open){details.hidden=!open;info.setAttribute('aria-expanded',String(open));}
info.addEventListener('click',()=>setInfo(details.hidden));
document.addEventListener('click',event=>{if(!details.hidden&&!event.target.closest('.demo-info'))setInfo(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape')setInfo(false);});
function command(){return `node bin/functional-minimalism.mjs setup ../my-app --template ${document.querySelector('#template').value} --client ${document.querySelector('#client').value}\nnode bin/functional-minimalism.mjs doctor --project ../my-app`;}
function updateCommand(){document.querySelector('#command').textContent=command();document.querySelector('#copy-status').textContent='';}
document.querySelectorAll('select').forEach(select=>select.addEventListener('change',updateCommand));
document.querySelector('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(command());document.querySelector('#copy-status').textContent='Copied. Run inside the extracted source folder.';}catch{const range=document.createRange();range.selectNodeContents(document.querySelector('#command'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.querySelector('#copy-status').textContent='Commands selected. Use your browser’s Copy command.';}});
updateCommand();setModel('claude');setView('before');
const params=new URLSearchParams(location.search);
const requestedModel=params.get('model');
if(['claude','chatgpt','kimi','deepseek'].includes(requestedModel))setModel(requestedModel);
if(params.get('view')==='after')setView('after');
window.minimalismComparison={snapshot:()=>({model:selected,view})};
