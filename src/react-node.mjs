import path from 'node:path';
import {readFile,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {detectReact,selectReact} from './react.mjs';
import {invariant} from './core.mjs';
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])):value;

async function readInput(project,name,optional=false){
 const file=path.join(project,name);
 const info=await lstat(file).catch(e=>{if(e.code==='ENOENT'&&optional)return null;throw e;});
 if(!info)return null;
 invariant(info.isFile(),`Refusing non-regular React input: ${name}`);
 return readFile(file,'utf8');
}
export async function inspectReact(project){
 const manifest=await readInput(project,'package.json');
 const components=await readInput(project,'components.json',true);
 const config=components?JSON.parse(components):null;
 const inventory=detectReact(JSON.parse(manifest),config);
 return {inventory,inputDigest:createHash('sha256').update(JSON.stringify(stable([inventory.react,inventory.detected,config]))).digest('hex')};
}
export async function reactConnection(project,ui){
 const {inventory,inputDigest}=await inspectReact(project);
 return {...selectReact(inventory,ui),inputDigest};
}
export async function loadReactConnection(project){
 const raw=await readInput(project,'.design-harness/react.json',true);
 if(!raw)return null;
 const connection=JSON.parse(raw),current=await inspectReact(project);
 invariant(connection.inputDigest===current.inputDigest,'React dependency/config drift: review and regenerate the connection before composing a brief');
 // Recreate guidance from current input instead of trusting saved adapter instructions.
 return {...selectReact(current.inventory,connection.ui),inputDigest:current.inputDigest};
}
