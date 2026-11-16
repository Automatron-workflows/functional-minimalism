import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('../demo/index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../demo/brand.css',import.meta.url),'utf8');
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
test('composed result uses brand token classes, not raw colors',()=>{
 const start=html.indexOf('<figure class="result"');
 const result=html.slice(start,html.indexOf('</figure>',start));
 assert.match(result,/class="result-window"/);
 assert.match(result,/class="result-chrome"/);
 assert.match(result,/class="result-rule"/);
 assert.match(result,/class="paper-sheet"/);
 assert.ok(!/#[0-9a-f]{3,8}\b/i.test(result),'raw color in composed result');
});
test('brand css keeps raw colors inside the token block',()=>{
 const root=css.match(/:root\s*\{[\s\S]*?\}/)?.[0]??'';
 assert.ok(root.length>0,'brand token block missing');
 const rest=css.replace(root,'');
 assert.ok(!/#[0-9a-f]{3,8}\b|rgba?\(/i.test(rest),'raw color outside brand token block');
});
