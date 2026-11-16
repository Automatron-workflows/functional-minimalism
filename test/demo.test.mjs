import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('../demo/index.html',import.meta.url),'utf8');
test('landing film keeps four named model drafts and one composed result',()=>{
 assert.equal((html.match(/<figure class="draft"/g)||[]).length,4);
 assert.equal((html.match(/<figure class="result"/g)||[]).length,1);
 for(const name of ['Claude','ChatGPT · Codex','Kimi','DeepSeek']) assert.ok(html.includes(name),`${name} label missing`);
 assert.match(html,/not actual model outputs/);
 assert.match(html,/No real payment occurs/);
 assert.ok(!html.includes('<figcaption'));
 assert.equal((html.match(/class="approve"/g)||[]).length,1);
 assert.match(html,/class="invoice-total">€1,210.00/);
 assert.match(html,/Review payment/);
});
test('landing stage stays silent and keeps playback controls',()=>{
 assert.ok(!html.includes('<section class="hero"'));
 assert.ok(!html.includes('class="caption"'));
 assert.match(html,/class="sr-only">Functional Minimalism/);
 assert.equal((html.match(/<div class="transport"/g)||[]).length,1);
});
