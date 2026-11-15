import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {reactAdapters,detectReact,selectReact,composeReactContext} from '../src/react.mjs';
import {initialize,connectReact,brief,checkProject,readJSON} from '../src/node.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const run=promisify(execFile);
test('each package adapter detects declarations without loading or installing a dependency',()=>{
 for(const a of reactAdapters.filter(a=>a.packages.length)){
  const name=a.packages[0].replace('*','dialog');
  const inventory=detectReact({dependencies:{react:'^19', [name]:'^1'}});
  assert.ok(inventory.detected.some(d=>d.id===a.id));
 }
 assert.equal(detectReact({dependencies:{react:'^19','@radix-ui/react-icons':'^1'}}).detected.length,0);
 assert.throws(()=>detectReact({dependencies:[]}),/Invalid dependencies/);
});
test('copied shadcn components retain their primitive context without selecting a rival system',()=>{
 const inventory=detectReact({dependencies:{react:'^19','@base-ui/react':'^1','lucide-react':'^1'}},{aliases:{ui:'@/components/ui'}});
 assert.equal(selectReact(inventory).ui,'shadcn');
 const context=composeReactContext(selectReact(inventory));
 assert.match(context,/@\/components\/ui/);assert.match(context,/Lucide/);assert.doesNotMatch(context,/Material UI:/);
});
test('ambiguous systems and absent declarations cannot silently become a new UI stack',()=>{
 const inventory=detectReact({dependencies:{react:'^19','@mui/material':'^9','@chakra-ui/react':'^3'}});
 assert.throws(()=>selectReact(inventory),/Multiple/);
 assert.equal(selectReact(inventory,'mui').ui,'mui');
 assert.throws(()=>selectReact(inventory,'mantine'),/not declared/);
 assert.throws(()=>selectReact(detectReact({dependencies:{'@mui/material':'^9'}})),/React is not declared/);
});
test('connection scopes context, preserves manifests, detects drift and refuses overwrite',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'fm-react-'));
 try{
  const manifest=JSON.stringify({dependencies:{react:'^19','@mui/material':'^9',motion:'^12'}});
  await writeFile(path.join(dir,'package.json'),manifest);
  await initialize(dir,path.join(root,'packs/studio/pack.json'),root);
  await connectReact(dir);
  const screen=await readJSON(path.join(root,'examples/invoice.screen.json'));
  const context=await brief(dir,screen,{compact:true});
  assert.match(context,/Material UI/);assert.match(context,/Motion:/);assert.doesNotMatch(context,/Mantine:/);
  assert.equal(await readFile(path.join(dir,'package.json'),'utf8'),manifest);
  await writeFile(path.join(dir,'package.json'),JSON.stringify({...JSON.parse(manifest),scripts:{build:'existing-user-build'}},null,2));
  assert.match(await brief(dir,screen),/Material UI/); // Formatting/scripts are not dependency drift.
  await assert.rejects(()=>connectReact(dir),/EEXIST/);
  await writeFile(path.join(dir,'package.json'),manifest.replace('^9','^10'));
  await assert.rejects(()=>brief(dir,screen),/drift/);
  assert.equal((await checkProject(dir)).status,'fail');
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('React inspection refuses symlinked input and CLI inventory is usable without initialization',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'fm-react-cli-'));
 try{
  await writeFile(path.join(dir,'package.json'),JSON.stringify({dependencies:{react:'^19',antd:'^6'}}));
  const args=[path.join(root,'bin/functional-minimalism.mjs'),'inspect-react','--project',dir];
  assert.equal(JSON.parse((await run(process.execPath,args)).stdout).inventory.detected[0].id,'antd');
  await writeFile(path.join(dir,'outside.json'),'{}');await symlink(path.join(dir,'outside.json'),path.join(dir,'components.json'));
  await assert.rejects(()=>run(process.execPath,args),/non-regular React input/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
