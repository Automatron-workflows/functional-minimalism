import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {root} from './serve.mjs';
import {readJSON,verifySources} from '../src/node.mjs';
import {validatePack,validateContract,checkCSS,tokensToCSS,composeBrief} from '../src/core.mjs';
const pack=validatePack(await readJSON(path.join(root,'packs/studio/pack.json')));
const findings=await verifySources(pack,root);
findings.push(...checkCSS(pack,await readFile(path.join(root,'demo/styles.css'),'utf8'),'demo/styles.css'));
if(await readFile(path.join(root,'demo/tokens.css'),'utf8')!==tokensToCSS(pack))findings.push({severity:'error',code:'stale-tokens',message:'Run npm run build to regenerate tokens'});
for(const name of ['discovery','invoice','project'])composeBrief(pack,validateContract(await readJSON(path.join(root,`examples/${name}.screen.json`))));
const atelier=validatePack(await readJSON(path.join(root,'packs/atelier/pack.json')));
composeBrief(atelier,validateContract(await readJSON(path.join(root,'examples/invoice.screen.json'))));
const gallery=await readJSON(path.join(root,'gallery/templates.json'));
if(gallery.schema!=='functional-minimalism.component-gallery/1')findings.push({severity:'error',code:'gallery-schema',message:'Unsupported component gallery schema'});
if(!Array.isArray(gallery.components)||gallery.components.length<8)findings.push({severity:'error',code:'gallery-components',message:'The approved gallery needs at least eight components'});
const galleryIds=new Set();
for(const component of gallery.components??[]){
 if(!component.id||galleryIds.has(component.id))findings.push({severity:'error',code:'gallery-id',message:'Duplicate or missing gallery component id'});
 galleryIds.add(component.id);
 if(component.license!=='MIT'||!component.approvedBy||!component.rules?.length)findings.push({severity:'error',code:'gallery-provenance',message:`${component.id??'component'} needs MIT license, approval and rules`});
}
console.log(JSON.stringify({status:findings.some(f=>f.severity==='error')?'fail':'pass',components:pack.components.length,atelierComponents:atelier.components.length,galleryComponents:gallery.components.length,screens:3,findings,renderedVerification:'not-run'},null,2));
if(findings.some(f=>f.severity==='error'))process.exitCode=1;
