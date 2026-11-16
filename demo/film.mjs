import {filmFrame,mayAdvance,duration} from '../src/timeline.mjs';
const film=document.querySelector('.film'),play=document.querySelector('#play');
const models=[...document.querySelectorAll('.model')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const icons={
 pause:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10M13 5v10"/></svg>',
 play:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5l8 5-8 5Z"/></svg>'
};
const still=11000;
let elapsed=reduced.matches?still:0,playing=!reduced.matches,visible=true,last=null,raf=0;
function draw(){
 const frame=filmFrame(elapsed);
 film.dataset.stage=frame.stage;
 film.dataset.model=frame.model;
 film.dataset.settled=String(frame.settled);
 film.style.setProperty('--wipe',String(frame.wipe));
 film.classList.toggle('restarting',frame.fading);
 models.forEach((model,index)=>{model.dataset.done=String(index<frame.done);});
 const label=playing?'Pause illustration':'Play illustration';
 play.setAttribute('aria-label',label);
 play.title=label;
 if(play.dataset.playing!==String(playing)){play.dataset.playing=String(playing);play.innerHTML=playing?icons.pause:icons.play;}
}
function canRun(){return mayAdvance({playing,hidden:document.hidden,visible,dialogOpen:Boolean(document.querySelector('dialog[open]'))});}
function tick(time){raf=0;if(!canRun()){last=null;return;}if(last!==null)elapsed=(elapsed+Math.min(time-last,100))%duration;last=time;draw();raf=requestAnimationFrame(tick);}
function sync(){if(raf)cancelAnimationFrame(raf);raf=0;last=null;draw();if(canRun())raf=requestAnimationFrame(tick);}
play.addEventListener('click',()=>{playing=!playing;sync();});
document.querySelector('#replay').addEventListener('click',()=>{elapsed=reduced.matches?still:0;playing=!reduced.matches;sync();});
document.addEventListener('visibilitychange',sync);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(film);
reduced.addEventListener('change',()=>{playing=false;elapsed=still;sync();});
const dialogs=[...document.querySelectorAll('dialog')];
function openDialog(id){const dialog=document.getElementById(id);if(!dialog||dialog.open)return;const frame=dialog.querySelector('iframe');if(frame&&!frame.hasAttribute('src')&&!frame.hasAttribute('srcdoc'))frame.src=frame.dataset.src;dialog.showModal();sync();}
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>openDialog(button.dataset.open)));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
document.querySelectorAll('[data-next]').forEach(button=>button.addEventListener('click',()=>{button.closest('dialog').close();openDialog(button.dataset.next);}));
dialogs.forEach(dialog=>dialog.addEventListener('close',sync));
const info=document.querySelector('#info'),details=document.querySelector('#demo-details');
function setInfo(open){details.hidden=!open;info.setAttribute('aria-expanded',String(open));}
info.addEventListener('click',()=>setInfo(details.hidden));
document.addEventListener('click',event=>{if(!details.hidden&&!event.target.closest('.demo-info'))setInfo(false);});
document.addEventListener('keydown',event=>{if(event.key==='Escape')setInfo(false);});
function command(){return `node bin/functional-minimalism.mjs setup ../my-app --template ${document.querySelector('#template').value} --client ${document.querySelector('#client').value}\nnode bin/functional-minimalism.mjs doctor --project ../my-app`;}
function updateCommand(){document.querySelector('#command').textContent=command();document.querySelector('#copy-status').textContent='';}
document.querySelectorAll('select').forEach(select=>select.addEventListener('change',updateCommand));
document.querySelector('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(command());document.querySelector('#copy-status').textContent='Copied. Run inside the extracted source folder.';}catch{const range=document.createRange();range.selectNodeContents(document.querySelector('#command'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.querySelector('#copy-status').textContent='Commands selected. Use your browser’s Copy command.';}});
updateCommand();sync();
// Read-only diagnostics for browser review; not model or usability measurements.
window.minimalismFilm={snapshot:()=>{const frame=filmFrame(elapsed);return {elapsed,playing,stage:frame.stage,model:frame.model,wipe:frame.wipe,done:frame.done,settled:frame.settled,fading:frame.fading,running:canRun(),reducedMotion:reduced.matches};}};
