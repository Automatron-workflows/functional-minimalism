// Pure, browser-compatible contracts and checks. No model or service dependency.
const keyPattern = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const strings = value => Array.isArray(value) && value.every(text);
const unique = values => new Set(values).size === values.length;
export function invariant(condition, message) { if (!condition) throw new Error(message); }

export function validatePack(pack) {
  invariant(object(pack) && pack.schema === 'design-harness.pack/1', 'Unsupported pack schema');
  invariant(keyPattern.test(pack.id ?? ''), 'Pack id must be a lowercase slug');
  invariant(text(pack.name) && /^\d+\.\d+\.\d+$/.test(pack.version ?? ''), 'Pack name/version required');
  invariant(object(pack.source) && ['synthetic', 'repository', 'figma', 'export'].includes(pack.source.kind) && text(pack.source.reference), 'Pack source and provenance required');
  invariant(object(pack.tokens) && Object.keys(pack.tokens).length > 0, 'At least one token required');
  invariant(strings(pack.principles) && pack.principles.length > 0, 'Design principles required');
  invariant(Array.isArray(pack.components) && pack.components.length > 0, 'Component registry required');
  const names = [];
  for (const component of pack.components) {
    invariant(object(component) && /^[A-Z][A-Za-z0-9]*$/.test(component.name ?? ''), 'Invalid component name');
    invariant(text(component.source) && text(component.export), `${component.name}: source and export required`);
    invariant(strings(component.variants) && component.variants.length && unique(component.variants), `${component.name}: unique variants required`);
    invariant(strings(component.states) && component.states.length && strings(component.rules), `${component.name}: states and rules required`);
    names.push(component.name);
  }
  invariant(unique(names), 'Duplicate component name');
  resolveTokens(pack.tokens);
  return pack;
}

export function resolveTokens(tokens) {
  const result = Object.create(null);
  const visiting = new Set();
  function resolve(name) {
    invariant(Object.hasOwn(tokens, name), `Missing token: ${name}`);
    if (Object.hasOwn(result, name)) return result[name];
    invariant(keyPattern.test(name), `Unsafe token name: ${name}`);
    invariant(!visiting.has(name), `Token cycle: ${name}`);
    const token = tokens[name];
    invariant(object(token) && text(token.type), `Invalid token: ${name}`);
    visiting.add(name);
    const alias = typeof token.value === 'string' && token.value.match(/^\{([^{}]+)\}$/);
    let value = alias ? resolve(alias[1]) : token.value;
    if (alias) invariant(tokens[alias[1]].type === token.type, `Token type mismatch: ${name}`);
    const valid = {
      color: v => typeof v === 'string' && /^(#[0-9a-f]{3,8}|transparent|currentColor)$/i.test(v) && (!v.startsWith('#') || [4,5,7,9].includes(v.length)),
      dimension: v => typeof v === 'string' && /^(0|\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw))$/.test(v),
      duration: v => typeof v === 'string' && /^\d+(?:\.\d+)?m?s$/.test(v),
      number: v => typeof v === 'number' && Number.isFinite(v),
      font: v => typeof v === 'string' && /^[a-zA-Z0-9 ,"'\-]+$/.test(v),
    }[token.type];
    invariant(valid && valid(value), `Unsupported or unsafe ${token.type} value for ${name}`);
    visiting.delete(name); result[name] = value; return value;
  }
  Object.keys(tokens).forEach(resolve);
  const cssNames = Object.keys(tokens).map(name => name.replaceAll('.', '-'));
  invariant(unique(cssNames), 'Token names collide after CSS normalization');
  return result;
}

export function tokensToCSS(pack, selector = ':root') {
  validatePack(pack);
  invariant(/^(:root|\[data-theme="[a-z-]+"\])$/.test(selector), 'Unsupported CSS selector');
  const tokens = resolveTokens(pack.tokens);
  return `/* Generated from ${pack.id}@${pack.version}; do not hand edit. */\n${selector} {\n${Object.entries(tokens).map(([name,value]) => `  --${name.replaceAll('.', '-')}: ${value};`).join('\n')}\n}\n`;
}

export function validateContract(contract) {
  invariant(object(contract) && contract.schema === 'design-harness.screen/1', 'Unsupported screen schema');
  for (const field of ['id', 'project', 'goal', 'object', 'primaryAction', 'composition']) invariant(text(contract[field]), `Screen ${field} required`);
  invariant(keyPattern.test(contract.id) && keyPattern.test(contract.project),'Screen and project identifiers must be lowercase slugs');
  invariant(strings(contract.essential) && contract.essential.length && unique(contract.essential), 'Unique essential information IDs required');
  invariant(strings(contract.states) && contract.states.includes('ready') && unique(contract.states), 'Unique states including ready required');
  invariant(Array.isArray(contract.viewports) && contract.viewports.length > 0 && unique(contract.viewports) && contract.viewports.every(v => Number.isInteger(v) && v >= 280), 'Unique viewport widths required');
  invariant(strings(contract.components) && unique(contract.components), 'Component names required');
  invariant(Number.isInteger(contract.maxPrimaryActions) && contract.maxPrimaryActions >= 1, 'Primary-action limit required');
  if(contract.explanationBudget!==undefined)invariant(Number.isInteger(contract.explanationBudget)&&contract.explanationBudget>=0,'Explanation budget must be a nonnegative integer');
  if(contract.consequential) invariant(contract.states.includes('confirmation') && contract.essential.includes('consequence'), 'Consequential actions require confirmation and consequence information');
  return contract;
}

export function validateMemory(memory) {
  invariant(object(memory) && memory.schema === 'design-harness.memory/1' && Array.isArray(memory.decisions), 'Unsupported memory schema');
  invariant(unique(memory.decisions.map(d => d.id)), 'Duplicate decision id');
  for(const d of memory.decisions) {
    invariant(text(d.id) && ['global','pack','project','screen'].includes(d.scope) && text(d.target), 'Decision scope and target required');
    invariant(['proposed','accepted','rejected'].includes(d.status) && text(d.rule) && text(d.reason) && text(d.createdAt), 'Decision status, rule, reason and date required');
    invariant(d.scope !== 'global' || d.target === '*', 'Global decisions must target *');
    if(d.scope==='screen')invariant(d.target.split('/').length===2 && d.target.split('/').every(x=>keyPattern.test(x)),'Screen decisions target project-id/screen-id');
    if(d.supersedes) {
      const previous = memory.decisions.find(p=>p.id===d.supersedes);
      invariant(previous && previous.id !== d.id && previous.scope===d.scope && previous.target===d.target, 'Can only supersede a different decision in the same scope and target');
    }
  }
  for(const d of memory.decisions) {
    const visited = new Set(); let cursor=d;
    while(cursor) { invariant(!visited.has(cursor.id), 'Decision supersession cycle'); visited.add(cursor.id); cursor=memory.decisions.find(x=>x.id===cursor.supersedes); }
  }
  return memory;
}

export function selectDecisions(memory, context) {
  validateMemory(memory);
  const accepted = memory.decisions.filter(d => d.status==='accepted');
  const superseded = new Set(accepted.map(d=>d.supersedes).filter(Boolean));
  const targets = { global:'*', pack:context.pack, project:context.project, screen:context.project&&context.screen?`${context.project}/${context.screen}`:undefined };
  return accepted.filter(d=>!superseded.has(d.id) && d.target===targets[d.scope]).sort((a,b)=>['global','pack','project','screen'].indexOf(a.scope)-['global','pack','project','screen'].indexOf(b.scope));
}

export function composeBrief(pack, contract, memory={schema:'design-harness.memory/1',decisions:[]}, options={}) {
  validatePack(pack); validateContract(contract);
  const components=contract.components.map(name=>{ const c=pack.components.find(c=>c.name===name); invariant(c, `Unknown contract component: ${name}`); return c; });
  const decisions=selectDecisions(memory,{pack:pack.id,project:contract.project,screen:contract.id});
  if(options.compact)return [
    `# ${contract.id} | ${pack.id}@${pack.version}`,
    `Task: ${contract.goal}\nObject: ${contract.object}\nAction: ${contract.primaryAction}\nLayout: ${contract.composition}`,
    `Preserve: ${contract.essential.join('; ')}`,
    `Rules:\n${pack.principles.join('\n')}`,
    `Components:\n${components.map(c=>`${c.name}=${c.source}#${c.export} [${c.variants.join('|')}] ${c.rules.join(' ')}`).join('\n')}`,
    `Accepted:\n${decisions.length?decisions.map(d=>`${d.scope}:${d.target}: ${d.rule} (${d.reason})`).join('\n'):'None.'}`,
    `Verify: ${contract.viewports.join('/')}px; ${contract.states.join(', ')}. Exercise the task, keyboard, focus, contrast, enlarged text and reduced motion. Capture evidence; repair up to three passes, then report limits. Current instructions and task requirements override older preferences. Preserve function, access and consequences.`
  ].join('\n\n')+'\n';
  return [
    `# ${contract.id} · ${pack.name} ${pack.version}`,
    `Goal: ${contract.goal}\nObject: ${contract.object}\nPrimary action: ${contract.primaryAction}\nComposition: ${contract.composition}`,
    `## Preserve\n${contract.essential.map(x=>`- ${x}`).join('\n')}`,
    `## Design judgment\n${pack.principles.map(x=>`- ${x}`).join('\n')}`,
    `## Components\n${components.map(c=>`- ${c.name}: ${c.source} → ${c.export}; variants: ${c.variants.join(', ')}. ${c.rules.join(' ')}`).join('\n')}`,
    `## Accepted decisions\n${decisions.length?decisions.map(d=>`- [${d.scope}:${d.target}] ${d.rule} Reason: ${d.reason}`).join('\n'):'No accepted scoped decisions yet.'}`,
    `## Evidence before delivery\nRender ${contract.viewports.join(', ')}px widths. Exercise: ${contract.states.join(', ')}. Keep essential information visible in ready state. Check keyboard, focus, contrast, enlarged text, and reduced motion. Record actual evidence; a model opinion is not a test.`,
    '## Work loop\nBuild → render → interact → inspect → repair. At most three repair passes before reporting unresolved findings. Current user instructions and the screen contract take priority over older taste preferences. Never trade function, accessibility, or consequences for fewer words.',
  ].join('\n\n')+'\n';
}

export function auditSnapshot(pack, contract, snapshot) {
  validatePack(pack); validateContract(contract);
  invariant(object(snapshot) && snapshot.schema==='design-harness.snapshot/1', 'Unsupported snapshot schema');
  invariant(snapshot.screen===contract.id && contract.states.includes(snapshot.state), 'Snapshot screen/state does not match contract');
  invariant(Number.isFinite(snapshot.width) && snapshot.width>0 && Number.isFinite(snapshot.scrollWidth) && snapshot.scrollWidth>0, 'Snapshot dimensions required');
  invariant(Array.isArray(snapshot.controls) && Array.isArray(snapshot.components) && strings(snapshot.essential) && Number.isInteger(snapshot.primaryActions) && snapshot.primaryActions>=0 && object(snapshot.words), 'Incomplete snapshot');
  const findings=[];
  const add=(severity,code,message)=>findings.push({severity,code,message});
  if(snapshot.scrollWidth>snapshot.width+2) add('error','horizontal-overflow',`Content overflows ${snapshot.width}px viewport by ${snapshot.scrollWidth-snapshot.width}px`);
  if(snapshot.primaryActions>contract.maxPrimaryActions) add('warning','competing-actions',`${snapshot.primaryActions} equally primary actions; expected at most ${contract.maxPrimaryActions}`);
  if(snapshot.state==='ready' && !snapshot.primaryActions) add('error','missing-primary','The ready state has no primary action');
  if(snapshot.state==='ready') for(const id of contract.essential) if(!snapshot.essential.includes(id)) add('error','missing-information',`Essential information is not visible: ${id}`);
  for(const c of snapshot.components) {
    invariant(object(c) && text(c.name) && text(c.variant), 'Malformed component evidence');
    const definition=pack.components.find(d=>d.name===c.name);
    if(!definition) add('error','unknown-component',`${c.name} is not in ${pack.id}`);
    else if(!definition.variants.includes(c.variant)) add('error','unknown-variant',`${c.name}.${c.variant} is not supported`);
  }
  for(const c of snapshot.controls) {
    invariant(object(c) && typeof c.name==='string' && Number.isFinite(c.width) && Number.isFinite(c.height), 'Malformed control evidence');
    if(!c.name.trim()) add('error','unnamed-control',`${c.tag??'Control'} has no accessible name`);
    if(c.width<24 || c.height<24) add('warning','small-target',`${c.name||c.tag} is ${Math.round(c.width)}×${Math.round(c.height)}px; review target spacing and exceptions`);
    if(c.clipped) add('error','clipped-control',`${c.name||c.tag} is clipped`);
  }
  for(const value of Object.values(snapshot.words)) invariant(Number.isInteger(value) && value>=0, 'Invalid word count');
  if((snapshot.words.explanation??0) > (contract.explanationBudget??40)) add('warning','explanation-budget',`${snapshot.words.explanation} explanatory words; review redundancy without removing essential information`);
  return {status:findings.some(f=>f.severity==='error')?'fail':'pass',findings,words:snapshot.words};
}

export function auditEvidence(pack, contract, evidence) {
  validatePack(pack); validateContract(contract);
  invariant(object(evidence) && evidence.schema==='design-harness.evidence/1' && Array.isArray(evidence.snapshots), 'Unsupported evidence schema');
  const results=evidence.snapshots.map(s=>({state:s.state,width:s.width,...auditSnapshot(pack,contract,s)}));
  const missing=[];
  for(const width of contract.viewports) for(const state of contract.states) if(!evidence.snapshots.some(s=>s.width===width && s.state===state)) missing.push(`${state}@${width}`);
  const failures=results.flatMap(r=>r.findings.filter(f=>f.severity==='error'));
  return {status:failures.length?'fail':missing.length?'incomplete':'pass',missing,results,limitations:['Evidence is supplied by the caller; this does not prove authenticity, aesthetics, task completion, or full accessibility.']};
}

export function checkCSS(pack, css, file='styles.css') {
  validatePack(pack);
  const findings=[];
  const clean=css.replace(/\/\*[\s\S]*?\*\//g,'');
  const known=new Set(Object.keys(pack.tokens).map(k=>'--'+k.replaceAll('.','-')));
  for(const match of clean.matchAll(/var\(\s*(--[\w-]+)/g)) if(!known.has(match[1])) findings.push({severity:'error',code:'unknown-token',message:`${file}: ${match[1]} is not in ${pack.id}`});
  for(const match of clean.matchAll(/(?:^|[;{])\s*([\w-]+)\s*:\s*([^;{}]+)/g)) {
    if(match[1].startsWith('--')) { findings.push({severity:'error',code:'token-override',message:`${file}: token declarations belong in the pack`}); continue; }
    if(/#[0-9a-f]{3,8}\b|\b(?:rgb|hsl|oklch|lab)a?\(/i.test(match[2])) findings.push({severity:'error',code:'raw-color',message:`${file}: raw color in ${match[1]}; use a semantic token`});
  }
  return findings;
}
