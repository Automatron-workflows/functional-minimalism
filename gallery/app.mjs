const gallery=document.querySelector('#gallery');
const data=await fetch('./templates.json',{cache:'no-store'}).then(response=>response.json());
document.querySelector('#version').textContent=`v${data.version}`;
document.querySelector('#approval').textContent=`Approved ${data.approvedAt}`;
const tokens=data.tokens;
const tokenCSS=`:root{--canvas:${tokens.canvas};--surface:${tokens.surface};--ink:${tokens.ink};--muted:${tokens.muted};--line:${tokens.line};--accent:${tokens.accent};--onaccent:${tokens.onaccent};--display:${tokens.display};--body:${tokens.body}}`;
gallery.replaceChildren();
for(const component of data.components){
 const article=document.createElement('article');article.className='component';
 const info=document.createElement('div');
 const title=document.createElement('h2');title.textContent=component.name;
 const category=document.createElement('p');category.className='category';category.textContent=component.category;
 const rules=document.createElement('ul');
 for(const rule of component.rules){const item=document.createElement('li');item.textContent=rule;rules.append(item);}
 info.append(title,category,rules);
 const preview=document.createElement('div');preview.className='preview';
 const frame=document.createElement('iframe');frame.title=`${component.name} preview`;frame.setAttribute('sandbox','allow-same-origin');frame.setAttribute('loading','lazy');
 frame.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><style>${tokenCSS}html,body{margin:0}body{padding:24px;background:var(--canvas);color:var(--ink);font-family:var(--body);font-size:14px;line-height:1.5}${component.css}</style></head><body>${component.html}</body></html>`;
 preview.append(frame);
 const code=document.createElement('details');code.className='code';
 const summary=document.createElement('summary');summary.textContent='HTML and CSS';
 const pre=document.createElement('pre');pre.textContent=`${component.html}\n\n${component.css}`;
 code.append(summary,pre);
 article.append(info,preview,code);
 gallery.append(article);
}
try{
 const approvals=JSON.parse(localStorage.getItem('functional-minimalism.gallery.approvals.v1')??'[]');
 const section=document.createElement('section');section.className='local';
 const title=document.createElement('h2');title.textContent='Local approval proposals';
 const note=document.createElement('p');note.textContent=approvals.length?`${approvals.length} design${approvals.length===1?'':'s'} approved in this browser. Download the proposal from the lab, review the HTML, then merge reviewed components into templates.json.`:'Approve a design in the lab to start a local proposal. The hosted gallery only changes when a reviewed component is merged into templates.json.';
 section.append(title,note);
 if(approvals.length){
  const list=document.createElement('ul');
  for(const approval of approvals){const item=document.createElement('li');item.textContent=`${approval.model?.label??'Model'} · ${new Date(approval.approvedAt).toLocaleDateString()} · ${approval.prompt?.slice(0,90)??''}`;list.append(item);}
  section.append(list);
 }
 gallery.append(section);
}catch{/* Local storage can be unavailable. */}
