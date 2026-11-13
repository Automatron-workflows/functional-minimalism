import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {root} from './serve.mjs';
export async function buildStandalone(){
 const read=file=>readFile(path.join(root,file),'utf8');
 const assets={};for(const name of ['forest','desert','night'])assets[name]='data:image/svg+xml;base64,'+Buffer.from(await read(`demo/assets/${name}.svg`)).toString('base64');
 const resources={};for(const file of ['packs/studio/pack.json',...['discovery','invoice','project'].map(n=>`examples/${n}.screen.json`)])resources['../'+file]=JSON.parse(await read(file));
 const modules=await Promise.all(['src/core.mjs','src/browser.mjs','demo/components.mjs','demo/self-test.mjs','demo/app.mjs'].map(read));
 let source=modules.map(code=>code.replace(/^import .*;\n/gm,'').replace(/^export /gm,'')).join('\n');
 source=source.replace(/const artworkURL = .*?;\n/,`const artworkURL = name => __assets[name];\n`);
 source=source.replace(/const read=async url=>\{.*?\};/,`const read=async url=>structuredClone(__resources[url]);`);
 source=source.replace("const {runBrowserTests}=await import('./self-test.mjs');",'');
 const documents={};for(const file of ['README.md','packs/studio/pack.json'])documents['../'+file]=await read(file);
 source+=`\ndocument.addEventListener('click',event=>{const a=event.target.closest('a');if(a&&Object.hasOwn(__documents,a.getAttribute('href'))){event.preventDefault();const blob=new Blob([__documents[a.getAttribute('href')]],{type:'text/plain'});const link=document.createElement('a');const url=URL.createObjectURL(blob);link.href=url;link.download=a.getAttribute('href').split('/').pop();link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}});`;
 const script=`const __assets=${JSON.stringify(assets)}, __resources=${JSON.stringify(resources)}, __documents=${JSON.stringify(documents)};\n${source}`.replace(/<\/script/gi,'<\\/script');
 let html=await read('demo/index.html');
 html=html.replace('<link rel="stylesheet" href="./tokens.css"/>','').replace('<link rel="stylesheet" href="./styles.css"/>',`<style>${await read('demo/tokens.css')}\n${await read('demo/styles.css')}</style>`);
 html=html.replace('<script type="module" src="./app.mjs"></script>',`<script type="module">${script}</script>`);
 html=html.replace('href="./" aria-label="Automatron','href="#" aria-label="Automatron');
 const output=path.join(root,'dist/Design_Harness_Preview.html');await writeFile(output,html);return output;
}
