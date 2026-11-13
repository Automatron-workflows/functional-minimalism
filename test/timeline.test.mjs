import test from 'node:test';
import assert from 'node:assert/strict';
import {filmFrame,mayAdvance} from '../src/timeline.mjs';
import {zipFiles} from '../scripts/package.mjs';
test('illustration timing covers source, composition, memory and replay',()=>{assert.equal(filmFrame(0).stage,'source');assert.equal(filmFrame(2800).stage,'compose');assert.equal(filmFrame(7200).stage,'remember');assert.equal(filmFrame(12000).stage,'source');assert.equal(filmFrame(NaN).progress,0);});
test('film stops while paused, hidden, offscreen or behind an open dialog',()=>{const active={playing:true,hidden:false,visible:true,dialogOpen:false};assert.ok(mayAdvance(active));for(const [key,value] of [['playing',false],['hidden',true],['visible',false],['dialogOpen',true]])assert.equal(mayAdvance({...active,[key]:value}),false);});
test('source archive rejects traversal paths',()=>{assert.throws(()=>zipFiles([{name:'../outside',data:'x'}]),/Unsafe/);assert.throws(()=>zipFiles([{name:'/outside',data:'x'}]),/Unsafe/);});
