import test from 'node:test';
import assert from 'node:assert/strict';
import {readJSON} from '../src/node.mjs';
import {validatePack,resolveTokens,tokensToCSS,validateContract,selectDecisions,composeBrief,auditSnapshot,auditEvidence,checkCSS} from '../src/core.mjs';
const pack=await readJSON(new URL('../packs/studio/pack.json',import.meta.url));
const contract=await readJSON(new URL('../examples/invoice.screen.json',import.meta.url));
const snapshot=()=>({schema:'design-harness.snapshot/1',screen:'invoice',state:'ready',width:390,scrollWidth:390,primaryActions:1,essential:[...contract.essential],components:[{name:'Button',variant:'primary'},{name:'PaymentSummary',variant:'default'}],controls:[{tag:'button',name:'Review payment',width:180,height:44,clipped:false}],words:{content:24,control:2,explanation:0,consequence:8}});
test('reference pack resolves aliases and produces deterministic semantic CSS',()=>{assert.equal(validatePack(pack),pack);assert.equal(resolveTokens(pack.tokens)['color.focus'],'#d9ff85');assert.match(tokensToCSS(pack),/--color-focus: #d9ff85/);});
test('cycles, missing aliases, type mismatches, CSS injection and CSS name collisions are rejected',()=>{
 for(const tokens of [{a:{type:'color',value:'{b}'},b:{type:'color',value:'{a}'}},{a:{type:'color',value:'{absent}'}},{a:{type:'number',value:1},b:{type:'color',value:'{a}'}},{a:{type:'font',value:'sans-serif; background: url(x)'}},{'a.b':{type:'number',value:1},'a-b':{type:'number',value:2}}])assert.throws(()=>resolveTokens(tokens));
});
test('registry rejects duplicate names and malformed variants',()=>{assert.throws(()=>validatePack({...pack,components:[pack.components[0],pack.components[0]]}));assert.throws(()=>validatePack({...pack,components:[{...pack.components[0],variants:[]}]}));});
test('consequential task requires both confirmation and consequence information',()=>{assert.throws(()=>validateContract({...contract,states:['ready']}));assert.throws(()=>validateContract({...contract,essential:['amount']}));});
test('composition patterns are validated and enter both brief formats',()=>{
 assert.ok(pack.patterns.some(p=>p.id==='document-review'));
 assert.ok(pack.components.some(c=>c.name==='PaymentSummary'));
 assert.ok(contract.components.includes('PaymentSummary'));
 const brief=composeBrief(pack,contract);
 assert.match(brief,/## Composition pattern/);
 assert.match(brief,/Reserve the accent for the single primary action/);
 const compact=composeBrief(pack,contract,undefined,{compact:true});
 assert.match(compact,/Pattern: document-review/);
 assert.match(compact,/Reserve the accent for the single primary action/);
 assert.throws(()=>validatePack({...pack,patterns:[pack.patterns[0],pack.patterns[0]]}));
 assert.throws(()=>validatePack({...pack,patterns:[{...pack.patterns[0],rules:[]}]}));
 assert.throws(()=>composeBrief(pack,{...contract,pattern:'absent'}),/Unknown contract pattern/);
 assert.throws(()=>validateContract({...contract,pattern:'not a slug'}));
});
test('confirmation keeps every consequential fact visible',()=>{
 const confirmation={...snapshot(),state:'confirmation'};
 assert.equal(auditSnapshot(pack,contract,confirmation).status,'pass');
 for(const missing of ['amount','due','destination','consequence']){
  const incomplete={...confirmation,essential:confirmation.essential.filter(x=>x!==missing)};
  const report=auditSnapshot(pack,contract,incomplete);
  assert.equal(report.status,'fail');
  assert.ok(report.findings.some(f=>f.code==='missing-information'));
 }
});
test('missing amount fails even when fewer words look desirable',()=>{const s=snapshot();s.essential=s.essential.filter(x=>x!=='amount');assert.equal(auditSnapshot(pack,contract,s).status,'fail');});
test('unknown components, unsupported variants, unnamed and clipped controls fail',()=>{for(const mutate of [s=>s.components[0].name='Invented',s=>s.components[0].variant='neon',s=>s.controls[0].name='',s=>s.controls[0].clipped=true]){const s=snapshot();mutate(s);assert.equal(auditSnapshot(pack,contract,s).status,'fail');}});
test('horizontal overflow is blocking and small targets remain review findings',()=>{const s=snapshot();s.controls[0].width=20;assert.equal(auditSnapshot(pack,contract,s).status,'pass');assert.equal(auditSnapshot(pack,contract,s).findings[0].code,'small-target');s.scrollWidth=420;assert.equal(auditSnapshot(pack,contract,s).status,'fail');});
test('incomplete and malformed evidence cannot pass',()=>{assert.equal(auditEvidence(pack,contract,{schema:'design-harness.evidence/1',snapshots:[snapshot()]}).status,'incomplete');assert.throws(()=>auditSnapshot(pack,contract,{...snapshot(),controls:null}));assert.throws(()=>auditSnapshot(pack,contract,{...snapshot(),screen:'other'}));assert.throws(()=>auditSnapshot(pack,contract,{...snapshot(),words:{content:-1}}));});
test('state and viewport coverage must both be complete',()=>{const snapshots=contract.viewports.flatMap(width=>contract.states.map(state=>({...snapshot(),width,scrollWidth:width,state})));assert.equal(auditEvidence(pack,contract,{schema:'design-harness.evidence/1',snapshots}).status,'pass');});
const decision=(id,scope,target,status='accepted',supersedes)=>({id,scope,target,status,rule:`rule ${id}`,reason:'Explicit user correction',createdAt:'2026-11-13',...(supersedes?{supersedes}:{})});
test('memory never leaks another project, identically named screen, or proposed correction into a brief',()=>{const memory={schema:'design-harness.memory/1',decisions:[decision('a','global','*'),decision('b','project','studio-demo'),decision('c','project','other'),decision('d','pack','studio','proposed'),decision('e','screen','studio-demo/invoice'),decision('f','screen','other/invoice')]};assert.deepEqual(selectDecisions(memory,{pack:'studio',project:'studio-demo',screen:'invoice'}).map(d=>d.id),['a','b','e']);const brief=composeBrief(pack,contract,memory);assert.ok(brief.includes('rule b'));assert.ok(!brief.includes('rule c'));assert.ok(!brief.includes('rule f'));});
test('supersession is explicit, scope-safe, and acyclic',()=>{const a=decision('a','project','studio-demo');const b=decision('b','project','studio-demo','accepted','a');assert.deepEqual(selectDecisions({schema:'design-harness.memory/1',decisions:[a,b]},{project:'studio-demo'}).map(d=>d.id),['b']);assert.throws(()=>selectDecisions({schema:'design-harness.memory/1',decisions:[a,{...b,target:'other'}]},{}));assert.throws(()=>selectDecisions({schema:'design-harness.memory/1',decisions:[{...a,supersedes:'b'},b]},{}));});
test('CSS checks catch raw colors, unknown tokens, and pack overrides',()=>{assert.deepEqual(checkCSS(pack,'.x{color:var(--color-text);padding:12px}'),[]);for(const css of ['.x{color:#fff}','.x{background:rgb(0,0,0)}','.x{color:var(--color-wrong)}',':root{--color-text:red}'])assert.ok(checkCSS(pack,css).some(x=>x.severity==='error'));});
