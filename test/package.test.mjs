import test from 'node:test';
import assert from 'node:assert/strict';
import {zipFiles} from '../scripts/package.mjs';
test('source archive rejects traversal paths',()=>{assert.throws(()=>zipFiles([{name:'../outside',data:'x'}]),/Unsafe/);assert.throws(()=>zipFiles([{name:'/outside',data:'x'}]),/Unsafe/);});
