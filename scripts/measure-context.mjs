import {readJSON} from '../src/node.mjs';
import {composeBrief} from '../src/core.mjs';
import {root} from './serve.mjs';
import path from 'node:path';
const pack=await readJSON(path.join(root,'packs/studio/pack.json')),screens=[];
for(const name of ['discovery','invoice','project']){const contract=await readJSON(path.join(root,`examples/${name}.screen.json`));const full=composeBrief(pack,contract),compact=composeBrief(pack,contract,undefined,{compact:true});screens.push({screen:name,fullBytes:Buffer.byteLength(full),compactBytes:Buffer.byteLength(compact),bytesRemoved:Buffer.byteLength(full)-Buffer.byteLength(compact)});}
console.log(JSON.stringify({measurement:'UTF-8 bytes of generated context. Not model tokens, quality, elapsed time, or end-to-end savings.',screens},null,2));
