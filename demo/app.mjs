import { Button, IconButton, SegmentedControl, Poster, Field, Dialog, Status, TaskRow, Receipt, EmptyState, escape, icon, artworkURL } from './components.mjs';
import { collectSnapshot } from '../src/browser.mjs';
import { auditSnapshot, composeBrief } from '../src/core.mjs';

const read=async url=>{const r=await fetch(url);if(!r.ok)throw new Error(`Cannot load ${url}`);return r.json();};
const [pack,...screens]=await Promise.all([read('../packs/studio/pack.json'),...['discovery','invoice','project'].map(id=>read(`../examples/${id}.screen.json`))]);
const contracts=Object.fromEntries(screens.map(s=>[s.id,s]));
const scene=document.querySelector('#scene');
const films=[{id:'still',title:'A quieter world',subtitle:'2026 · 1h 42m · Slow cinema',art:'forest',mood:'slow'},{id:'long',title:'The long way',subtitle:'2026 · 1h 36m · Adventure',art:'desert',mood:'adventure'},{id:'night',title:'After the light',subtitle:'2026 · 1h 28m · Slow cinema',art:'night',mood:'slow'}];
const initialTasks=()=>[{id:'1',title:'Set the creative direction',owner:'AM',date:'Today',done:true},{id:'2',title:'Explore the first three screens',owner:'JL',date:'Today',done:false},{id:'3',title:'Refine the motion language',owner:'AM',date:'16 Nov',done:false},{id:'4',title:'Review the mobile experience',owner:'SK',date:'17 Nov',done:false}];
let flow='discovery',mode='after',state='ready',mood='all',taskFilter='all',tasks=initialTasks(),saved=new Set(),lastFocus=null;
const announce=message=>{document.querySelector('#announcement').textContent=message;};
const baseline={
 discovery:['Discover your next favorite film','Welcome to your personalized film discovery experience. Browse our curated collection of films below to find something that matches your mood. Use the filters to explore different genres, save interesting titles to your collection, or preview a film to learn more before deciding what to watch.','Your entertainment, organized. Each film includes its title, release year, running time, and availability. Click the heart icon to save a film, or use the Preview button to open a visual sample. You can change your selection at any time.'],
 invoice:['Manage and review your invoice','Welcome to the invoice management center. Here you can review your current invoice, check supplier information, and inspect payment details. Please review the document and the payment summary before proceeding to the next step. This example uses fictional information and does not connect to a bank.','A clear overview of your payment. The document preview contains a breakdown of services and VAT. The summary contains the recipient, amount, due date, and payment destination. Select Review payment when you are ready to continue to the confirmation step.'],
 project:['Your project management overview','Welcome to your project workspace. Keep track of everything your team needs to do to launch the new studio experience. Review task names, ownership, and deadlines in the list below. You can mark individual tasks complete and use the filters to focus on the work that matters to you.','Stay organized and keep your team aligned. Completed tasks are shown with a checkmark and a line through the title. Use the New task button to add more work to your project. Your completion progress updates automatically as you mark tasks complete.']
};
function appHeader(){
 if(flow==='discovery')return `<div class="app-header"><div class="app-brand" data-copy="content"><i>still.</i><span class="app-label">GOOD FILMS, FOUND.</span></div>${SegmentedControl({label:'Film mood',options:[{value:'all',label:'For you'},{value:'slow',label:'Slow'},{value:'adventure',label:'Adventure'}],value:mood,action:'mood'})}</div>`;
 if(flow==='invoice')return `<div class="app-header"><h2 class="section-heading" data-copy="content">Payments</h2>${Status({label:'Invoice 0042'})}</div>`;
 return `<div class="app-header"><div class="app-brand" data-copy="content"><i>work.</i><span class="app-label">A LITTLE MORE FOCUS.</span></div>${Status({label:'4 people · Studio',variant:'success'})}</div>`;
}
function readyContent(){
 if(flow==='discovery')return `<div class="gallery">${films.filter(f=>mood==='all'||f.mood===mood).map((f,i)=>Poster({...f,featured:i===0,saved:saved.has(f.id)})).join('')}</div>`;
 if(flow==='invoice')return `<div class="invoice-layout">${Receipt()}<div class="payment-summary"><h3 data-copy="content" data-essential="supplier">North Studio</h3><p class="amount" data-copy="content" data-essential="amount">€1,210<small>.00</small></p><dl class="payment-facts" data-copy="content"><dt>Due date</dt><dd data-essential="due">20 November 2026</dd><dt>To</dt><dd data-essential="destination">North Studio · •••• 4421</dd><dt>Reference</dt><dd>INV-0042</dd></dl>${Button({label:'Review payment',action:'review-payment',iconName:'arrow',primary:true})}<p class="consequence" data-copy="consequence" data-essential="consequence">Demo payment. Confirm on the next step.<br/>No real account is connected.</p></div></div>`;
 const filtered=tasks.filter(t=>taskFilter==='all'||(taskFilter==='done'?t.done:!t.done));
 const complete=tasks.filter(t=>t.done).length;
 return `<div class="project-top"><div><h3 data-copy="content" data-essential="project">The new studio</h3><p data-copy="content">Launch · 20 November</p></div>${Button({label:'New task',action:'new-task',iconName:'plus',primary:true})}</div>${SegmentedControl({label:'Task status',options:[{value:'all',label:'All tasks'},{value:'open',label:'Open'},{value:'done',label:'Done'}],value:taskFilter,action:'task-filter'})}<div data-essential="tasks"><div class="task-head" data-copy="control"><span>TASK</span><span>DUE</span><span>WHO</span></div><ul class="tasks">${filtered.map(TaskRow).join('')}</ul>${filtered.length?'':`<p class="dialog-copy" data-copy="content">No tasks in this view.</p>`}</div><div class="progress-track" role="progressbar" aria-label="Project completion" aria-valuenow="${complete}" aria-valuemin="0" aria-valuemax="${tasks.length}"><span style="width:${Math.round(complete/tasks.length*100)}%"></span></div><div class="progress-label" data-copy="content"><span>${complete} of ${tasks.length} complete</span><span>${Math.round(complete/tasks.length*100)}%</span></div>`;
}
function render(){
 scene.className=`scene ${mode}`;
 document.querySelectorAll('[data-flow]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.flow===flow)));
 document.querySelectorAll('[data-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.mode===mode)));
 let content='';
 if(state==='loading')content='<div class="skeleton" aria-hidden="true"><div></div><div></div><div></div></div><span class="loading-label" role="status" data-copy="content">Loading…</span>';
 else if(state==='error')content=EmptyState({title:flow==='invoice'?'Payment unavailable':'Something didn’t load',detail:flow==='invoice'?'No payment was made. Try again.':'Your changes are safe. Try again.',variant:'error'});
 else if(state==='empty')content=EmptyState({title:flow==='project'?'Space for something good.':'Nothing here. Yet.',detail:flow==='project'?'Add the first task to get started.':'Try another mood to find your next film.',label:flow==='project'?'New task':'Explore all films',action:flow==='project'?'new-task':'retry'});
 else if(state==='success')content=EmptyState({title:'Payment simulated.',detail:'€1,210.00 to North Studio. No money moved.',label:'Back to invoice',variant:'success',action:'retry'});
 else content=readyContent();
 const showBaseline=mode==='before'&&['ready','confirmation','preview','editing'].includes(state);
 scene.innerHTML=appHeader()+(showBaseline?`<div class="baseline-intro"><h3 data-copy="explanation">${baseline[flow][0]}</h3><p data-copy="explanation">${baseline[flow][1]}</p></div>`:'')+content+(showBaseline?`<p class="baseline-explanation" data-copy="explanation">${baseline[flow][2]}</p>`:'');
}
function closeDialog(){const dialog=document.querySelector('dialog');if(dialog){dialog.close();dialog.remove();}if(['confirmation','preview','editing'].includes(state))state='ready';if(lastFocus?.isConnected)lastFocus.focus();}
function openDialog(props,kind='flow'){
 closeDialog(); lastFocus=document.activeElement;
 const parent=kind==='flow'?scene:document.body;
 parent.insertAdjacentHTML('beforeend',Dialog(props));const dialog=parent.querySelector('dialog');
 dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog();});dialog.showModal();
 return dialog;
}
function preview(id){
 const film=films.find(f=>f.id===id)||films[0];
 openDialog({title:film.title,content:`<div class="preview-art"><img src="${escape(artworkURL(film.art))}" alt=""/><div class="preview-playing" role="status" data-copy="content"><span class="equalizer" aria-hidden="true"><i></i><i></i><i></i></span>Visual preview</div></div><p class="dialog-copy" data-copy="content">${film.subtitle} · Studio Cinema</p><p class="consequence" data-copy="consequence">Fictional film. This is an illustrated preview, not a video stream.</p>`,actions:Button({label:saved.has(film.id)?'Saved':'Save for tonight',action:`save-dialog:${film.id}`,iconName:'heart',primary:true})}); state='preview';
}
function reviewPayment(){
 openDialog({title:'Confirm demo payment',content:'<p class="dialog-copy" data-copy="content">North Studio · Invoice 0042</p><p class="dialog-amount" data-copy="content">€1,210.00</p><p class="dialog-destination" data-copy="content">Destination: North Studio · •••• 4421</p><p class="dialog-copy" data-copy="consequence">This simulates payment only. No money will move.</p>',actions:Button({label:'Cancel',action:'close-dialog',variant:'secondary'})+Button({label:'Confirm simulation',action:'confirm-payment',primary:true})});state='confirmation';
}
function newTask(){
 const dialog=openDialog({title:'A little more progress.',content:`<form id="task-form">${Field({label:'Task name',name:'taskName',placeholder:'What needs to happen?'})}<p class="form-error" role="alert" id="task-error"></p><div class="dialog-actions">${Button({label:'Add task',action:'add-task',iconName:'plus',primary:true})}</div></form>`});state='editing';dialog.querySelector('input').focus();
 dialog.querySelector('form').addEventListener('submit',event=>{event.preventDefault();addTask();});
}
function addTask(){const input=document.querySelector('[name="taskName"]');const title=input.value.trim();if(!title){document.querySelector('#task-error').textContent='Give the task a name.';input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby','task-error');input.focus();return;}tasks.push({id:crypto.randomUUID(),title,owner:'YOU',date:'Today',done:false});closeDialog();taskFilter='all';state='ready';render();announce('Task added');scene.querySelector('[data-action="new-task"]').focus();}
function inspect(){const snapshot=collectSnapshot(scene,{screen:flow,state});const report=auditSnapshot(pack,contracts[flow],snapshot);const words=Object.values(snapshot.words).reduce((a,b)=>a+b,0);const content=`<div class="inspector"><div class="inspect-stats"><div><strong>${words}</strong><span>visible words</span></div><div><strong>${snapshot.words.explanation}</strong><span>explanatory words</span></div><div><strong>${snapshot.components.length}</strong><span>mapped instances</span></div></div><p class="dialog-copy">${report.status==='pass'?'No blocking findings in this snapshot.':'This snapshot has blocking findings.'}</p>${report.findings.length?`<ul class="findings">${report.findings.map(f=>`<li>${escape(f.message)}</li>`).join('')}</ul>`:''}<label class="state-select">Preview a state<select id="state-select">${contracts[flow].states.map(s=>`<option value="${s}" ${s===state?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select></label><p class="consequence">Checks use the same library as the CLI. This snapshot does not verify usability, visual quality, or complete accessibility. Studio is an authored reference system, not Alps.</p></div>`;
 openDialog({title:'Behind the interface',content,actions:Button({label:'Show state',action:'show-state',variant:'secondary'})},'shell');
}
function guide(){openDialog({title:'Bring the judgment with you.',content:'<p class="dialog-copy">Install the project rules once. Start each screen with your design system, the task, and the decisions you’ve already made.</p><pre class="guide-code">node bin/design-harness.mjs init ./my-app\nnode bin/design-harness.mjs brief screen.json \\\n  --project ./my-app</pre><p class="consequence">Run from the downloaded source folder. No package is published to npm. Works with Codex and Claude instruction files; other agents can read the same brief.</p><div class="guide-links"><a href="../README.md">Read the guide ↗</a><a href="../packs/studio/pack.json">View the design pack ↗</a></div>'},'shell');}
function changeFlow(next){closeDialog();flow=next;state='ready';render();announce(`${next} example`);}
function setState(next){closeDialog();state=next;render();if(next==='confirmation')reviewPayment();if(next==='preview')preview('still');if(next==='editing')newTask();}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button||button.disabled)return;
 if(button.dataset.flow){changeFlow(button.dataset.flow);return;}
 if(button.dataset.mode){closeDialog();mode=button.dataset.mode;state='ready';render();return;}
 if(button.dataset.shell){const action=button.dataset.shell;if(action==='inspect')inspect();if(action==='guide')guide();if(action==='reset'){closeDialog();tasks=initialTasks();saved.clear();mood='all';taskFilter='all';state='ready';render();announce('Example reset');}return;}
 const action=button.dataset.action;if(!action)return;
 if(action==='close-dialog')closeDialog();
 else if(action==='mood'){mood=button.dataset.value;render();scene.querySelector(`[data-value="${mood}"]`).focus();}
 else if(action==='task-filter'){taskFilter=button.dataset.value;render();scene.querySelector(`[data-value="${taskFilter}"]`).focus();}
 else if(action.startsWith('play:'))preview(action.split(':')[1]);
 else if(action.startsWith('save:')){const id=action.split(':')[1];saved.has(id)?saved.delete(id):saved.add(id);render();scene.querySelector(`[data-action="save:${id}"]`)?.focus();announce(saved.has(id)?'Film saved':'Film removed');}
 else if(action.startsWith('save-dialog:')){const id=action.split(':')[1];saved.add(id);button.querySelector('span').textContent='Saved';const underlying=scene.querySelector(`[data-action="save:${id}"]`);underlying?.setAttribute('aria-pressed','true');underlying?.setAttribute('aria-label','Remove saved film');announce('Film saved');}
 else if(action==='review-payment')reviewPayment();
 else if(action==='confirm-payment'){closeDialog();state='success';render();announce('Payment simulated. No money moved.');scene.querySelector('[data-primary]')?.focus();}
 else if(action==='new-task')newTask();
 else if(action==='add-task')addTask();
 else if(action==='retry'){closeDialog();state='ready';mood='all';render();announce('Ready');scene.querySelector('[data-primary]')?.focus();}
 else if(action==='show-state'){const next=document.querySelector('#state-select').value;setState(next);}
});
document.addEventListener('change',event=>{if(event.target.matches('[data-task]')){const id=event.target.dataset.task;const task=tasks.find(t=>t.id===id);task.done=event.target.checked;render();scene.querySelector(`[data-task="${id}"]`)?.focus();announce(task.done?'Task complete':'Task reopened');}});
document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('page-hidden',document.hidden));
window.designHarness={pack,contracts,get state(){return {flow,mode,state,mood,taskFilter};},snapshot:()=>collectSnapshot(scene,{screen:flow,state}),audit:()=>auditSnapshot(pack,contracts[flow],collectSnapshot(scene,{screen:flow,state})),brief:()=>composeBrief(pack,contracts[flow]),setState,changeFlow};
render();
if(new URLSearchParams(location.search).has('selftest')){
 const {runBrowserTests}=await import('./self-test.mjs');const result=await runBrowserTests();
 const output=document.createElement('script');output.id='harness-test-results';output.type='application/json';output.textContent=JSON.stringify(result);document.body.append(output);
}
