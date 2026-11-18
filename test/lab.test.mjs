import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildBaselineMessages,buildHarnessMessages,contentOnlyHTML,extractHTML,parseModels,parseProviderResponse,providerBody,runSlug,sanitizeHTML} from '../src/lab.mjs';
import {composeBrief,validateContract,validatePack} from '../src/core.mjs';
import {craftScore} from '../src/craft.mjs';

const atelier=validatePack(JSON.parse(await readFile(new URL('../packs/atelier/pack.json',import.meta.url),'utf8')));
const invoice=validateContract(JSON.parse(await readFile(new URL('../examples/invoice.screen.json',import.meta.url),'utf8')));
const gallery=JSON.parse(await readFile(new URL('../gallery/templates.json',import.meta.url),'utf8'));

test('extractHTML takes the document out of fences and commentary',()=>{
 const result=extractHTML('Here is the screen:\n```html\n<!doctype html><html><body><h1>Hello</h1></body></html>\n```\nDone.');
 assert.match(result,/^<!doctype html>/i);
 assert.match(result,/Hello/);
 assert.ok(!result.includes('Here is the screen'));
});
test('extractHTML wraps a fragment',()=>{
 const result=extractHTML('<h1>Only a fragment</h1>');
 assert.match(result,/^<!doctype html>/i);
 assert.match(result,/<body><h1>Only a fragment<\/h1><\/body>/);
});
test('sanitizeHTML removes active content and external requests',()=>{
 const dirty='<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src *"></head><body onload="steal()"><script>alert(1)</script><img src="https://tracker.example/pixel" onerror="steal()"><a href="https://example.com">Link</a><button onclick="steal()">Pay</button></body></html>';
 const clean=sanitizeHTML(dirty);
 assert.ok(!/<script/i.test(clean));
 assert.ok(!/onload|onerror|onclick/i.test(clean));
 assert.ok(!/https?:\/\/tracker|https?:\/\/example/i.test(clean));
 assert.match(clean,/Content-Security-Policy/);
 assert.match(clean,/Pay/);
});
test('sanitizeHTML keeps one CSP and one viewport when the model copies them',()=>{
 const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src *"></head><body><p>Screen</p></body></html>';
 const clean=sanitizeHTML(html);
 assert.equal((clean.match(/Content-Security-Policy/g)||[]).length,1);
 assert.equal((clean.match(/name="viewport"/g)||[]).length,1);
 assert.equal((clean.match(/charset="utf-8"/g)||[]).length,1);
});
test('contentOnlyHTML strips presentation and keeps task content',()=>{
 const html='<!doctype html><html><head><style>body{color:red}</style></head><body><main class="shell" style="display:flex"><h1>North Studio</h1><button class="primary" onclick="pay()">Review payment</button></main></body></html>';
 const outline=contentOnlyHTML(html);
 assert.match(outline,/North Studio/);
 assert.match(outline,/Review payment/);
 assert.ok(!outline.includes('<style'));
 assert.ok(!outline.includes('class='));
 assert.ok(!outline.includes('style='));
 assert.ok(!outline.includes('onclick'));
});
test('baseline has no harness context and the harness pass does',()=>{
 const baseline=buildBaselineMessages('Review invoice 0042');
 assert.ok(!baseline.system.includes('Functional Minimalism'));
 const harness=buildHarnessMessages({prompt:'Review invoice 0042',beforeHTML:'<main>Invoice</main>',brief:'# invoice\nKeep the amount',guidance:['Keep one action'],outline:true});
 assert.match(harness.system,/Functional Minimalism/);
 assert.match(harness.system,/Keep the amount/);
 assert.match(harness.system,/Keep one action/);
 assert.match(harness.system,/content and structure outline/);
});
test('provider bodies use the expected wire formats',()=>{
 const messages={system:'System',user:'User'};
 const openai=providerBody('openai',{model:'gpt-5.4-mini',messages,maxTokens:1000});
 assert.equal(openai.max_completion_tokens,1000);
 assert.equal(openai.messages[0].role,'system');
 const anthropic=providerBody('anthropic',{model:'claude-haiku',messages,maxTokens:1000});
 assert.equal(anthropic.system,'System');
 assert.deepEqual(anthropic.messages,[{role:'user',content:'User'}]);
 const openrouter=providerBody('openrouter',{model:'free/model:free',messages,maxTokens:1000,reasoningEffort:'low'});
 assert.equal(openrouter.reasoning_effort,'low');
 assert.deepEqual(openrouter.usage,{include:true});
});
test('provider responses normalize usage and finish state',()=>{
 const openai=parseProviderResponse('openai',{model:'m',choices:[{message:{content:'<html></html>'},finish_reason:'stop'}],usage:{prompt_tokens:10,completion_tokens:20,total_tokens:30}});
 assert.equal(openai.text,'<html></html>');
 assert.equal(openai.usage.input,10);
 assert.equal(openai.usage.output,20);
 const anthropic=parseProviderResponse('anthropic',{model:'m',content:[{type:'text',text:'<html></html>'}],stop_reason:'end_turn',usage:{input_tokens:11,output_tokens:21}});
 assert.equal(anthropic.text,'<html></html>');
 assert.equal(anthropic.usage.total,32);
});
test('free OpenRouter models are sorted first and marked free',()=>{
 const models=parseModels('openrouter',{data:[{id:'paid/model',name:'Paid',pricing:{prompt:'0.000001',completion:'0.000002'}},{id:'free/model:free',name:'Free',pricing:{prompt:'0',completion:'0'}}]});
 assert.equal(models[0].id,'free/model:free');
 assert.equal(models[0].free,true);
 assert.equal(models[1].free,false);
});
test('run slugs are stable and filename safe',()=>{
 assert.equal(runSlug({preset:'invoice',model:'Qwen 3.8 Flash'}),'invoice-qwen-3-8-flash');
});

test('the Atelier pack composes the invoice brief with the approved system',()=>{
 const brief=composeBrief(atelier,invoice,{schema:'design-harness.memory/1',decisions:[]},{compact:true});
 assert.match(brief,/atelier@1\.0\.0/);
 assert.match(brief,/Warm paper canvas/);
 assert.match(brief,/The amount is the largest element/);
});

test('the approved gallery carries provenance, rules and the core invoice components',()=>{
 assert.equal(gallery.schema,'functional-minimalism.component-gallery/1');
 assert.ok(gallery.components.length>=8);
 for(const component of gallery.components){
  assert.ok(component.id&&component.name&&component.category);
  assert.ok(component.html&&component.css);
  assert.ok(component.rules.length>=1);
  assert.equal(component.license,'MIT');
  assert.equal(component.approvedBy,'Matthias Mandiau');
 }
 const ids=gallery.components.map(component=>component.id);
 for(const id of ['page-shell','amount','summary-rail','primary-action','line-items'])assert.ok(ids.includes(id),`${id} missing`);
});

test('the craft heuristic rewards restraint and a clear action',()=>{
 const high={desktop:{words:110,paragraphWords:20,filledActions:1,primaryVisible:true,disabledPrimary:0,fontRatio:5,headings:3,uniqueColors:7,fontFamilies:2,typeSizes:6,uniqueRadii:2,shadowCount:1,coverage:.25,facts:[{visible:true}],lowContrast:0,overflowX:false},mobile:{overflowX:false,clipped:0,bodyFont:14}};
 const low={desktop:{words:260,paragraphWords:90,filledActions:3,primaryVisible:false,disabledPrimary:1,fontRatio:1.2,headings:10,uniqueColors:20,fontFamilies:5,typeSizes:14,uniqueRadii:7,shadowCount:6,coverage:.7,facts:[{visible:false}],lowContrast:8,overflowX:true},mobile:{overflowX:true,clipped:2,bodyFont:11}};
 const highScore=craftScore(high).score,lowScore=craftScore(low).score;
 assert.ok(highScore>lowScore+30,`expected a meaningful gap, got ${highScore} vs ${lowScore}`);
 assert.ok(highScore>=90);
});
