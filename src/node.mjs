import { readFile, writeFile, mkdir, lstat, realpath, cp } from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { validatePack, validateMemory, invariant, composeBrief, tokensToCSS, checkCSS } from './core.mjs';

export const readJSON = async file => JSON.parse(await readFile(file,'utf8'));
export const canonical = value => Array.isArray(value)?'['+value.map(canonical).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}':JSON.stringify(value);
export const digest = value => createHash('sha256').update(canonical(value)).digest('hex');

export async function writeNew(file, content) {
  await mkdir(path.dirname(file),{recursive:true});
  await writeFile(file,content,{flag:'wx'});
}
export async function regularFile(file) {
  const stat=await lstat(file).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
  invariant(!stat || stat.isFile(), `Refusing non-regular file: ${file}`);
  return stat;
}
export async function safeDestination(root, relative) {
  const absolute=path.resolve(root,relative),base=path.resolve(root);
  invariant(absolute.startsWith(base+path.sep),'Destination is outside project');
  let cursor=base;
  for(const part of path.relative(base,absolute).split(path.sep)){
    cursor=path.join(cursor,part);const info=await lstat(cursor).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
    invariant(!info||!info.isSymbolicLink(),`Refusing symlink in destination: ${cursor}`);
  }
  return absolute;
}
const markerStart='<!-- design-harness:start -->';
const markerEnd='<!-- design-harness:end -->';
export async function appendInstructions(file, block) {
  const exists=await regularFile(file);
  const previous=exists?await readFile(file,'utf8'):'';
  if(previous.includes(markerStart)||previous.includes(markerEnd)) {
    invariant(previous.includes(markerStart)&&previous.includes(markerEnd),`Malformed harness block: ${file}`);
    return false; // Never silently overwrite user-edited instructions.
  }
  await writeFile(file,previous+(previous.endsWith('\n')?'':'\n')+`\n${markerStart}\n${block.trim()}\n${markerEnd}\n`,{flag:exists?'w':'wx'});
  return true;
}

export async function verifySources(pack, root) {
  validatePack(pack); const findings=[]; const base=await realpath(root);
  for(const c of pack.components) {
    const target=path.resolve(root,c.source);
    const resolved=await realpath(target).catch(()=>null);
    if(!resolved || (resolved!==base && !resolved.startsWith(base+path.sep))) { findings.push({severity:'error',code:'component-source',message:`${c.name}: source missing or outside project: ${c.source}`}); continue; }
    const source=await readFile(resolved,'utf8');
    const escaped=c.export.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    if(!new RegExp(`export\\s+(?:async\\s+)?(?:function|class|const|let)\\s+${escaped}\\b|export\\s*\\{[^}]*\\b${escaped}\\b`).test(source)) findings.push({severity:'warning',code:'unverified-export',message:`${c.name}: export ${c.export} was not recognized; check manually`});
  }
  return findings;
}

export async function initialize(project, packPath, bundleRoot, client='both') {
  invariant(['both','codex','claude'].includes(client),'Client must be codex, claude, or both');
  await mkdir(project,{recursive:true});
  const directory=path.join(project,'.design-harness');
  try { await lstat(directory); throw new Error('Project is already initialized; existing files were preserved'); } catch(error) {if(error.code!=='ENOENT')throw error;}
  const original=validatePack(await readJSON(packPath));
  const pack=structuredClone(original);
  const isBundled=path.resolve(packPath)===path.resolve(bundleRoot,'packs/studio/pack.json');
  const componentTarget=path.join(project,'src/design-system/components.mjs');
  const tokensTarget=path.join(project,'src/design-system/tokens.css');
  const stylesTarget=path.join(project,'src/design-system/components.css');
  const assetsTarget=path.join(project,'src/design-system/assets');
  // Preflight every user-owned destination before writing anything.
  for(const name of client==='both'?['AGENTS.md','CLAUDE.md']:[client==='codex'?'AGENTS.md':'CLAUDE.md']) await regularFile(path.join(project,name));
  for(const file of isBundled?[componentTarget,tokensTarget,stylesTarget,assetsTarget]:[]) {
    await safeDestination(project,path.relative(project,file));
    const existing=await lstat(file).catch(e=>{if(e.code==='ENOENT')return null;throw e;});invariant(!existing,`Will not overwrite ${file}`);
  }
  if(isBundled) {
    pack.components.forEach(c=>{c.source='src/design-system/components.mjs';});
    await writeNew(componentTarget,await readFile(path.join(bundleRoot,'demo/components.mjs'),'utf8'));
    await writeNew(tokensTarget,tokensToCSS(pack));
    await writeNew(stylesTarget,await readFile(path.join(bundleRoot,'demo/styles.css'),'utf8'));
    await cp(path.join(bundleRoot,'demo/assets'),assetsTarget,{recursive:true,errorOnExist:true,force:false});
  }
  const config={schema:'design-harness.project/1',pack:'pack.json',packDigest:digest(pack),sourcePackDigest:digest(original),client};
  await writeNew(path.join(directory,'pack.json'),JSON.stringify(pack,null,2)+'\n');
  await writeNew(path.join(directory,'config.json'),JSON.stringify(config,null,2)+'\n');
  await writeNew(path.join(directory,'memory.json'),JSON.stringify({schema:'design-harness.memory/1',decisions:[]},null,2)+'\n');
  await writeNew(path.join(directory,'WORKFLOW.md'),await readFile(path.join(bundleRoot,'adapters/WORKFLOW.md'),'utf8'));
  await writeNew(path.join(directory,'DESIGN_RULES.md'),await readFile(path.join(bundleRoot,'DESIGN_RULES.md'),'utf8'));
  await writeNew(path.join(directory,'references/hardwire.md'),await readFile(path.join(bundleRoot,'references/hardwire.md'),'utf8'));
  const block='For UI design and implementation, read `.design-harness/WORKFLOW.md`, the pinned `.design-harness/pack.json`, and accepted decisions in `.design-harness/memory.json`. Start from a screen contract. Use minimum reading, maximum clarity. Render and exercise the result before delivery. Preserve current user instructions and project-specific visual identity.';
  for(const name of client==='both'?['AGENTS.md','CLAUDE.md']:[client==='codex'?'AGENTS.md':'CLAUDE.md']) await appendInstructions(path.join(project,name),block);
  return {project:path.resolve(project),pack:pack.id,digest:config.packDigest,client};
}

export async function loadProject(project) {
  const base=path.join(project,'.design-harness');
  const config=await readJSON(path.join(base,'config.json'));
  invariant(config.schema==='design-harness.project/1' && config.pack==='pack.json','Unsupported project configuration');
  const pack=validatePack(await readJSON(path.join(base,config.pack)));
  invariant(digest(pack)===config.packDigest,'Design pack drift: review changes and explicitly run pin before continuing');
  const memory=validateMemory(await readJSON(path.join(base,'memory.json')));
  return {config,pack,memory,base};
}

export async function remember(project, decision) {
  const {memory,base}=await loadProject(project);
  const record={id:randomUUID(),scope:decision.scope??'project',target:decision.target,status:decision.accept?'accepted':'proposed',rule:decision.rule,reason:decision.reason,createdAt:new Date().toISOString(),...(decision.supersedes?{supersedes:decision.supersedes}:{})};
  const next={...memory,decisions:[...memory.decisions,record]}; validateMemory(next);
  await regularFile(path.join(base,'memory.json'));
  await writeFile(path.join(base,'memory.json'),JSON.stringify(next,null,2)+'\n'); return record;
}

export async function brief(project, contract) {const {pack,memory}=await loadProject(project);return composeBrief(pack,contract,memory);}
export async function checkProject(project, cssFiles=[]) {
  const {pack}=await loadProject(project);
  const findings=await verifySources(pack,project);
  for(const file of cssFiles) findings.push(...checkCSS(pack,await readFile(file,'utf8'),file));
  return {status:findings.some(x=>x.severity==='error')?'fail':'pass',findings,renderedVerification:'not-run'};
}
