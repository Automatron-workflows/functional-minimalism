import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const html=await readFile(new URL('../demo/index.html',import.meta.url),'utf8');
const css=await readFile(new URL('../demo/brand.css',import.meta.url),'utf8');
const lab=await readFile(new URL('../demo/compare.mjs',import.meta.url),'utf8');
const presets=JSON.parse(await readFile(new URL('../demo/presets.json',import.meta.url),'utf8'));
const index=JSON.parse(await readFile(new URL('../demo/runs/index.json',import.meta.url),'utf8'));
const runFiles=await Promise.all(index.runs.map(row=>readFile(new URL(`../demo/runs/${row.id}.json`,import.meta.url),'utf8').then(JSON.parse)));

test('landing leads with an editable prompt and a recorded comparison',()=>{
 assert.match(html,/id="prompt"/);
 assert.match(html,/Review invoice 0042/);
 assert.match(html,/id="run"/);
 assert.match(html,/id="models"/);
 assert.match(html,/id="frame"/);
 assert.match(html,/data-view="before"/);
 assert.match(html,/data-view="after"/);
 assert.match(html,/role="group" aria-label="Recorded models"/);
 assert.match(html,/id="connect"/);
 assert.match(html,/Generate design/);
 assert.match(html,/Approve this design/);
 assert.match(html,/id="benchmark-note"/);
 assert.match(html,/href="\.\.\/gallery\/"/);
 assert.ok(html.indexOf('id="prompt-form"')<html.indexOf('id="frame"'),'the prompt form must precede the comparison');
 assert.ok(html.indexOf('id="run-meta"')<html.indexOf('id="measure-grid"'),'measurements follow the run details');
 assert.ok(!html.includes('<figure class="before"'),'the authored SVG comparison must be gone');
 assert.ok(!html.includes('not actual model outputs'),'the page must not claim authored illustrations');
});

test('the recorded set has four real model runs, each with a harness pass',()=>{
 assert.equal(presets.presets.length,1);
 assert.equal(presets.presets[0].id,'invoice');
 assert.equal(presets.presets[0].approvedModel,'longcat-2.5-free');
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
   assert.ok(condition.measures.desktop.words>0,`${run.id} ${side} has no desktop measurement`);
   assert.ok(condition.measures.mobile.width===390,`${run.id} ${side} has no 390px measurement`);
  }
  assert.match(run.conditions.before.html,/North Studio/);
  assert.match(run.conditions.before.html,/1[.,]210/);
  assert.match(run.conditions.after.html,/North Studio/);
  assert.match(run.conditions.after.html,/1[.,]210/);
  assert.match(run.conditions.after.html,/20\s+(?:November|Nov)\s+2026/i);
  assert.match(run.conditions.after.html,/4421/);
 }
});

test('the four model cards are labelled as free, open or frontier',()=>{
 const labels=index.models.map(model=>model.label);
 for(const label of ['Beam','Claude Haiku 5.5','LongCat 2.5','Qwen 3.8 Flash'])assert.ok(labels.includes(label),`${label} missing`);
 assert.ok(index.models.some(model=>model.free),'at least one free model');
 assert.ok(index.models.some(model=>model.via==='Frontier'),'the frontier reference is labelled');
});

test('the measure table is derived from rendered output, not a claim',()=>{
 assert.match(html,/What changed/);
 assert.match(html,/Measured from the rendered HTML/);
 assert.match(html,/not a usability or accessibility audit/);
 assert.match(css,/\.measure-table/);
 assert.match(css,/\.measure-view/);
});

test('the prompt lab keeps provider keys out of the repository',()=>{
 assert.match(html,/type="password"/);
 assert.match(html,/Remember on this device/);
 assert.match(html,/The demo has no server/);
 assert.ok(!/sk-[a-z0-9]{20,}/i.test(html),'no API key in the page');
 assert.ok(!html.includes('OPENCODE_API_KEY'));
});

test('brand css keeps raw colors inside the token block',()=>{
 const root=css.match(/:root\s*\{[\s\S]*?\}/)?.[0]??'';
 assert.ok(root.length>0,'brand token block missing');
 const rest=css.replace(root,'');
 assert.ok(!/#[0-9a-f]{3,8}\b|rgba?\(/i.test(rest),'raw color outside brand token block');
});

test('the prompt input and comparison stay keyboard and touch reachable',()=>{
 assert.match(html,/class="skip" href="#lab"/);
 assert.match(html,/tabindex="0"/);
 assert.match(lab,/ArrowLeft/);
 assert.match(lab,/ArrowRight/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/touch-action: pan-y/);
});
