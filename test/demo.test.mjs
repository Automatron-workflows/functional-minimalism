import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../demo/index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../demo/brand.css',import.meta.url),'utf8');
const lab=await readFile(new URL('../demo/compare.mjs',import.meta.url),'utf8');
const presets=JSON.parse(await readFile(new URL('../demo/presets.json',import.meta.url),'utf8'));
const index=JSON.parse(await readFile(new URL('../demo/runs/index.json',import.meta.url),'utf8'));
const runFiles=await Promise.all(index.runs.map(row=>readFile(new URL(`../demo/runs/${row.id}.json`,import.meta.url),'utf8').then(JSON.parse)));

test('the page leads with an editable prompt and a four-card grid',()=>{
 assert.match(html,/id="prompt"/);
 assert.match(html,/Review invoice 0042/);
 assert.match(html,/id="run"/);
 assert.match(html,/Generate 4 designs/);
 assert.match(html,/id="models-grid"/);
 assert.match(html,/role="status"/);
 assert.ok(!html.includes('<figure class="before"'),'the authored SVG comparison must be gone');
 assert.ok(!html.includes('not actual model outputs'),'the page must not claim authored illustrations');
 assert.ok(html.indexOf('id="prompt-form"')<html.indexOf('id="models-grid"'),'the prompt must come first');
});

test('the four recorded runs contain real before and after model output',()=>{
 assert.equal(presets.presets.length,1);
 assert.equal(presets.presets[0].id,'invoice');
 assert.ok(index.runs.length>=4,`expected at least 4 runs, got ${index.runs.length}`);
 assert.equal(new Set(index.runs.map(row=>row.model)).size,index.runs.length);
 for(const run of runFiles){
  assert.equal(run.schema,'functional-minimalism.lab-run/1');
  assert.equal(run.harness.pack,'atelier@1.0.0');
  assert.ok(run.prompt.includes('North Studio'));
  for(const side of ['before','after']){
   const condition=run.conditions[side];
   assert.ok(condition.html.length>5000,`${run.id} ${side} HTML is too short`);
   assert.ok(!/<script\b/i.test(condition.html),`${run.id} ${side} keeps a script`);
   assert.ok(condition.screenshot,`${run.id} ${side} has no screenshot`);
  }
  assert.match(run.conditions.before.html,/North Studio/);
  assert.match(run.conditions.after.html,/North Studio/);
  assert.match(run.conditions.after.html,/1[.,]210/);
  assert.match(run.conditions.after.html,/20\s+(?:November|Nov)\s+2026/i);
  assert.match(run.conditions.after.html,/4421/);
 }
});

test('each recorded model has a before and after card',()=>{
 const labels=index.models.map(model=>model.label);
 for(const label of ['Beam','Claude Haiku 5.5','LongCat 2.5','Qwen 3.8 Flash'])assert.ok(labels.includes(label),`${label} missing`);
 assert.match(lab,/models-grid/);
 assert.match(lab,/card-switch/);
 assert.match(lab,/card-shot/);
 assert.match(lab,/Before and After on each card/);
});

test('the prompt lab keeps provider keys out of the repository',()=>{
 assert.match(html,/type="password"/);
 assert.match(html,/Remember on this device/);
 assert.match(html,/Keys stay in this browser/);
 assert.ok(!/sk-[a-z0-9]{20,}/i.test(html),'no API key in the page');
 assert.ok(!html.includes('OPENCODE_API_KEY'));
});

test('the page has no benchmark text-file link',()=>{
 assert.ok(!html.includes('Benchmark · 4 models'),'the old rail benchmark link must be gone');
 assert.ok(!html.includes('href="../docs/BENCHMARK.md"'),'the demo must not send people to raw Markdown');
 assert.ok(!html.includes('id="benchmark"'));
});

test('brand css keeps raw colors inside the token block',()=>{
 const root=css.match(/:root\s*\{[\s\S]*?\}/)?.[0]??'';
 assert.ok(root.length>0,'brand token block missing');
 const rest=css.replace(root,'');
 assert.ok(!/#[0-9a-f]{3,8}\b|rgba?\(/i.test(rest),'raw color outside brand token block');
});

test('the model cards stay touch and keyboard reachable',()=>{
 assert.match(html,/class="skip" href="#lab"/);
 assert.match(lab,/aria-pressed/);
 assert.match(css,/\.card-switch button/);
 assert.match(css,/prefers-reduced-motion/);
});
