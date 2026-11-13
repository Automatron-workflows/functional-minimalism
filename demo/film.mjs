import {filmFrame,mayAdvance,duration} from '../src/timeline.mjs';
const film=document.querySelector('.film'),caption=document.querySelector('#caption'),play=document.querySelector('#play');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let elapsed=reduced.matches?8500:0,playing=!reduced.matches,visible=true,last=null,raf=0;
function draw(){const frame=filmFrame(elapsed);film.dataset.stage=frame.stage;film.style.setProperty('--progress',frame.progress);caption.textContent=frame.caption;document.querySelectorAll('[data-version]').forEach(button=>button.setAttribute('aria-pressed',String((button.dataset.version==='before')===(frame.stage==='source'))));document.querySelectorAll('.screen').forEach((screen,index)=>{screen.dataset.arrived=String(frame.stage==='remember');screen.dataset.ready=String(frame.ready[index]);});document.querySelector('.system>span').textContent=frame.stage==='remember'?'System + decisions':'Your system';play.setAttribute('aria-label',playing?'Pause illustration':'Play illustration');play.title=play.getAttribute('aria-label');play.firstElementChild.textContent=playing?'Ⅱ':'▷';}
function canRun(){return mayAdvance({playing,hidden:document.hidden,visible,dialogOpen:Boolean(document.querySelector('dialog[open]'))});}
function tick(time){raf=0;if(!canRun()){last=null;return;}if(last!==null)elapsed=(elapsed+Math.min(time-last,100))%duration;last=time;draw();raf=requestAnimationFrame(tick);}
function sync(){if(raf)cancelAnimationFrame(raf);raf=0;last=null;draw();if(canRun())raf=requestAnimationFrame(tick);}
play.addEventListener('click',()=>{playing=!playing;sync();});
document.querySelector('#replay').addEventListener('click',()=>{elapsed=reduced.matches?8500:0;playing=!reduced.matches;sync();});
document.querySelectorAll('[data-version]').forEach(button=>button.addEventListener('click',()=>{elapsed=button.dataset.version==='before'?1000:8500;playing=false;sync();}));
document.addEventListener('visibilitychange',sync);
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(film);
reduced.addEventListener('change',()=>{playing=false;elapsed=8500;sync();});
const dialogs=[...document.querySelectorAll('dialog')];
function openDialog(id){const dialog=document.getElementById(id);if(!dialog||dialog.open)return;const frame=dialog.querySelector('iframe');if(frame&&!frame.hasAttribute('src')&&!frame.hasAttribute('srcdoc'))frame.src=frame.dataset.src;dialog.showModal();sync();}
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>openDialog(button.dataset.open)));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
document.querySelectorAll('[data-next]').forEach(button=>button.addEventListener('click',()=>{button.closest('dialog').close();openDialog(button.dataset.next);}));
dialogs.forEach(dialog=>dialog.addEventListener('close',sync));
function command(){return `node bin/formthread.mjs setup ../my-app --template ${document.querySelector('#template').value} --client ${document.querySelector('#client').value}\nnode bin/formthread.mjs doctor --project ../my-app`;}
function updateCommand(){document.querySelector('#command').textContent=command();document.querySelector('#copy-status').textContent='';}
document.querySelectorAll('select').forEach(select=>select.addEventListener('change',updateCommand));
document.querySelector('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(command());document.querySelector('#copy-status').textContent='Copied. Run inside the extracted source folder.';}catch{const range=document.createRange();range.selectNodeContents(document.querySelector('#command'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.querySelector('#copy-status').textContent='Commands selected. Use your browser’s Copy command.';}});
updateCommand();sync();
// Read-only diagnostics for browser review; not model or usability measurements.
window.formthreadFilm={snapshot:()=>({elapsed,playing,stage:film.dataset.stage,running:canRun(),reducedMotion:reduced.matches})};
