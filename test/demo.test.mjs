import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('../demo/index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../demo/brand.css',import.meta.url),'utf8');
test('landing film keeps four named model layers and one composed result',()=>{
 assert.equal((html.match(/<figure class="before"/g)||[]).length,4);
 assert.equal((html.match(/<figure class="after"/g)||[]).length,1);
 assert.equal((html.match(/<li class="model"/g)||[]).length,4);
 for(const name of ['Claude','ChatGPT · Codex','Kimi','DeepSeek']) assert.ok(html.includes(name),`${name} label missing`);
 assert.match(html,/not actual model outputs/);
 assert.match(html,/No real payment occurs/);
 assert.ok(!html.includes('<figcaption'));
 assert.equal((html.match(/class="approve"/g)||[]).length,1);
 assert.match(html,/class="invoice-total">€1,210.00/);
 assert.match(html,/Review payment/);
});
test('header and controls stay free of decorative badges and arrows',()=>{
 assert.ok(!html.includes('<a class="wordmark" href="./" aria-label="Functional Minimalism home"><img'),'wordmark must be plain text');
 assert.ok(!/[↗→↓]/.test(html.split('<div class="frame">')[0]),'header and rail must not use decorative arrows');
 assert.ok(!html.includes('class="mark"'),'rail must not use decorative model icons');
});
test('landing stage stays silent and keeps playback controls',()=>{
 assert.ok(!html.includes('<section class="hero"'));
 assert.ok(!html.includes('class="caption"'));
 assert.match(html,/class="sr-only">Functional Minimalism/);
 assert.equal((html.match(/<div class="transport"/g)||[]).length,1);
});
test('the result never composites the source',()=>{
 const start=html.indexOf('<figure class="after"');
 const afterRule=css.match(/\.after\s*\{[^}]*\}/)?.[0]??'';
 assert.ok(afterRule.length>0,'after layer rule missing');
 assert.ok(!/clip-path|transition/.test(afterRule),'result must cut, not merge');
});
test('composed result uses brand token classes, not raw colors',()=>{
 const start=html.indexOf('<figure class="after"');
 const result=html.slice(start,html.indexOf('</figure>',start));
 assert.match(result,/class="result-window"/);
 assert.ok(!result.includes('result-chrome'),'composed screen must not have fake window dots');
 assert.ok(!result.includes('result-rule'),'composed screen must not have a header rule');
 assert.match(result,/class="paper-sheet"/);
 assert.ok(!/#[0-9a-f]{3,8}\b/i.test(result),'raw color in composed result');
});
test('source screens switch without ghosting',()=>{
 const rule=css.match(/\.before\s*\{[^}]*\}/)?.[0]??'';
 assert.ok(rule.length>0,'before layer rule missing');
 assert.ok(!/transition/.test(rule),'before layers must not crossfade');
});
test('brand css keeps raw colors inside the token block',()=>{
 const root=css.match(/:root\s*\{[\s\S]*?\}/)?.[0]??'';
 assert.ok(root.length>0,'brand token block missing');
 const rest=css.replace(root,'');
 assert.ok(!/#[0-9a-f]{3,8}\b|rgba?\(/i.test(rest),'raw color outside brand token block');
});
