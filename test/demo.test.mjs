import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('../demo/index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../demo/brand.css',import.meta.url),'utf8');
test('landing film keeps four named sources and four adapted results',()=>{
 assert.equal((html.match(/<figure class="before"/g)||[]).length,4);
 assert.equal((html.match(/<figure class="after"/g)||[]).length,4);
 assert.equal((html.match(/<button class="model"/g)||[]).length,4);
 for(const name of ['Claude','ChatGPT · Codex','Kimi','DeepSeek']) assert.ok(html.includes(name),`${name} label missing`);
 assert.match(html,/not actual model outputs/);
 assert.match(html,/No real payment occurs/);
 assert.ok(!html.includes('<figcaption'));
 assert.equal((html.match(/class="approve"/g)||[]).length,4);
});
test('each adapted result keeps the same facts and one action',()=>{
 const afters=[...html.matchAll(/<figure class="after"[\s\S]*?<\/figure>/g)].map(m=>m[0]);
 assert.equal(afters.length,4);
 for(const after of afters){
  assert.match(after,/€1,210\.00/);
  assert.match(after,/Review payment/);
  assert.match(after,/Due 20 Nov 2026/);
  assert.match(after,/To •••• 4421/);
  assert.equal((after.match(/class="approve"/g)||[]).length,1);
 }
});
test('header and controls stay free of decorative badges and arrows',()=>{
 assert.ok(!html.includes('<a class="wordmark" href="./" aria-label="Functional Minimalism home"><img'),'wordmark must be plain text');
 assert.ok(!/[↗→↓]/.test(html.split('<div class="frame">')[0]),'header and rail must not use decorative arrows');
 assert.ok(!html.includes('class="mark"'),'rail and sources must not use decorative model icons');
});
test('landing stage stays silent and provides a manual comparison',()=>{
 assert.ok(!html.includes('<section class="hero"'));
 assert.ok(!html.includes('class="caption"'));
 assert.match(html,/class="sr-only">Functional Minimalism/);
 assert.equal((html.match(/class="switch"/g)||[]).length,1);
 assert.equal((html.match(/role="switch"/g)||[]).length,1);
 assert.match(html,/data-view="before"/);
 assert.ok(!html.includes('class="transport"'));
});
test('manual comparison switches whole before and after states',()=>{
 assert.match(css,/\.film\[data-view="before"\]\[data-model="claude"\] \.before\[data-model="claude"\]/);
 assert.match(css,/\.film\[data-view="after"\]\[data-model="claude"\] \.after\[data-model="claude"\]/);
 assert.ok(!/clip-path/.test(css),'states must switch whole, not clip');
});
test('brand css keeps raw colors inside the token block',()=>{
 const root=css.match(/:root\s*\{[\s\S]*?\}/)?.[0]??'';
 assert.ok(root.length>0,'brand token block missing');
 const rest=css.replace(root,'');
 assert.ok(!/#[0-9a-f]{3,8}\b|rgba?\(/i.test(rest),'raw color outside brand token block');
});
