import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBaselineMessages,buildHarnessMessages,contentOnlyHTML,extractHTML,parseModels,parseProviderResponse,providerBody,runSlug,sanitizeHTML} from '../src/lab.mjs';

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
