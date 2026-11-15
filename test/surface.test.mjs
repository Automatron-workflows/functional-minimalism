import test from 'node:test';
import assert from 'node:assert/strict';
import {readJSON} from '../src/node.mjs';
import {validateContract,composeBrief,auditSnapshot} from '../src/core.mjs';
const pack=await readJSON(new URL('../packs/studio/pack.json',import.meta.url));
const screen=await readJSON(new URL('../examples/appliance.screen.json',import.meta.url));
const snapshot=()=>({schema:'design-harness.snapshot/1',screen:screen.id,state:'ready',width:390,scrollWidth:390,primaryActions:1,essential:[...screen.essential],features:['timer','presets'],components:[],controls:[{id:'start',tag:'button',name:'Start timer',width:120,height:44,clipped:false}],words:{content:4,control:2,explanation:0}});
test('brief carries what to omit and what to preserve before the agent builds',()=>{
 assert.equal(validateContract(screen),screen);
 const brief=composeBrief(pack,screen,undefined,{compact:true});
 assert.match(brief,/omit: achievements/);assert.match(brief,/running: preserve duration, unit, timer-state/);assert.match(brief,/Start timer/);
});
test('fewer words cannot compensate for a lost feature, control, or essential information',()=>{
 assert.equal(auditSnapshot(pack,screen,snapshot()).status,'pass');
 for(const mutate of [s=>s.features=[],s=>s.controls=[],s=>s.essential=[],s=>s.features.push('achievements'),s=>s.features.push('invented-dashboard'),s=>delete s.features]){
  const s=snapshot();mutate(s);assert.equal(auditSnapshot(pack,screen,s).status,'fail');
 }
});
test('icon controls require a familiarity rationale and consequential actions require text',()=>{
 for(const control of [{id:'start',label:'Start',presentation:'icon',states:['ready']},{id:'start',label:'Pay',presentation:'icon',familiarity:'Familiar',risk:'consequential',states:['ready']}]){
  const changed=structuredClone(screen);changed.surface.controls=[control];assert.throws(()=>validateContract(changed),/Icon-only/);
 }
});
test('state-specific information remains mandatory after leaving the ready state',()=>{
 const s=snapshot();s.state='running';s.controls=[{...s.controls[0],id:'pause',name:'Pause timer'}];
 assert.equal(auditSnapshot(pack,screen,s).status,'pass');
 s.essential=s.essential.filter(id=>id!=='unit');assert.ok(auditSnapshot(pack,screen,s).findings.some(f=>f.code==='missing-state-information'));
 const invalid=structuredClone(screen);invalid.essentialByState={unknown:['unit']};assert.throws(()=>validateContract(invalid),/declared states/);
});
