// Read-only DOM instrumentation. Names here are a heuristic, not the full ARIA algorithm.
export function collectSnapshot(root, {screen,state='ready'}={}) {
  const doc=root.ownerDocument, win=doc.defaultView;
  const modal=doc.querySelector('dialog:modal');
  const visible=el=>{
    if(modal && !modal.contains(el))return false;
    if(el.closest('[hidden],[inert],[aria-hidden="true"]'))return false;
    const r=el.getBoundingClientRect(); const style=win.getComputedStyle(el);
    return !!(r.width&&r.height) && style.visibility!=='hidden' && style.display!=='none';
  };
  const name=el=>{
    const labelled=el.getAttribute('aria-labelledby');
    if(labelled)return labelled.split(/\s+/).map(id=>doc.getElementById(id)?.textContent??'').join(' ').trim();
    return (el.getAttribute('aria-label')||[...(el.labels??[])].map(l=>l.textContent).join(' ')||el.textContent||el.getAttribute('alt')||'').trim();
  };
  const controls=[...root.querySelectorAll('button,a[href],input:not([type="hidden"]),select,textarea,[role="button"]')].filter(visible).map(el=>{
    const r=el.getBoundingClientRect(); let clipped=r.left<0 || r.right>win.innerWidth+1;
    for(let parent=el.parentElement;parent&&parent!==doc.body;parent=parent.parentElement) {
      const ps=win.getComputedStyle(parent),pr=parent.getBoundingClientRect();
      if(['hidden','clip'].includes(ps.overflowX) && (r.left<pr.left-1 || r.right>pr.right+1))clipped=true;
      if(['hidden','clip'].includes(ps.overflowY) && (r.top<pr.top-1 || r.bottom>pr.bottom+1))clipped=true;
      // Native modal dialogs live in the top layer. Their DOM ancestors cannot
      // clip them; containers inside the dialog still can.
      if(parent.matches(':modal'))break;
    }
    return {tag:el.tagName.toLowerCase(),id:el.dataset.control??el.dataset.action??null,name:name(el),width:r.width,height:r.height,clipped};
  });
  const words={content:0,control:0,explanation:0,consequence:0,unclassified:0};
  const walker=doc.createTreeWalker(root,win.NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) {
    const node=walker.currentNode,el=node.parentElement;
    if(!el || !visible(el) || el.closest('script,style,svg'))continue;
    const role=el.closest('[data-copy]')?.dataset.copy??'unclassified';
    words[Object.hasOwn(words,role)?role:'unclassified']+=(node.textContent.trim().match(/\S+/g)||[]).length;
  }
  return {schema:'design-harness.snapshot/1',screen,state,width:win.innerWidth,scrollWidth:doc.documentElement.scrollWidth,
    features:[...new Set([root,...root.querySelectorAll('[data-feature]')].filter(el=>el.hasAttribute('data-feature')&&visible(el)).map(el=>el.dataset.feature))],
    primaryActions:[...root.querySelectorAll('[data-primary]')].filter(visible).length,
    essential:[...root.querySelectorAll('[data-essential]')].filter(visible).flatMap(el=>el.dataset.essential.split(/\s+/)),
    components:[...root.querySelectorAll('[data-component]')].filter(visible).map(el=>({name:el.dataset.component,variant:el.dataset.variant??'default'})),controls,words};
}
