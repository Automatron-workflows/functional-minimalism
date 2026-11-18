import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {root} from './serve.mjs';
import {packageSource} from './package.mjs';
async function buildWorkshopStandalone(){
 const read=file=>readFile(path.join(root,file),'utf8');
 const assets={};for(const name of ['forest','desert','night'])assets[name]='data:image/svg+xml;base64,'+Buffer.from(await read(`demo/assets/${name}.svg`)).toString('base64');
 const resources={};for(const file of ['packs/studio/pack.json',...['discovery','invoice','project'].map(n=>`examples/${n}.screen.json`)])resources['../'+file]=JSON.parse(await read(file));
 const modules=await Promise.all(['src/core.mjs','src/browser.mjs','demo/starter.mjs','demo/components.mjs','demo/self-test.mjs','demo/app.mjs'].map(read));
 let source=modules.map(code=>code.replace(/^import .*;\n/gm,'').replace(/^export /gm,'')).join('\n');
 source=source.replace(/const artworkURL = .*?;\n/,`const artworkURL = name => __assets[name];\n`);
 source=source.replace(/const read=async url=>\{.*?\};/,`const read=async url=>structuredClone(__resources[url]);`);
 source=source.replace("const {runBrowserTests}=await import('./self-test.mjs');",'');
 const documents={};for(const file of ['README.md','packs/studio/pack.json'])documents['../'+file]=await read(file);
 source+=`\ndocument.addEventListener('click',event=>{const a=event.target.closest('a');if(a&&Object.hasOwn(__documents,a.getAttribute('href'))){event.preventDefault();const blob=new Blob([__documents[a.getAttribute('href')]],{type:'text/plain'});const link=document.createElement('a');const url=URL.createObjectURL(blob);link.href=url;link.download=a.getAttribute('href').split('/').pop();link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}});`;
 const script=`const __assets=${JSON.stringify(assets)}, __resources=${JSON.stringify(resources)}, __documents=${JSON.stringify(documents)};\n${source}`.replace(/<\/script/gi,'<\\/script');
 let html=await read('demo/workshop.html');
 html=html.replace('<link rel="stylesheet" href="./tokens.css"/>','').replace('<link rel="stylesheet" href="./styles.css"/>',`<style>${await read('demo/tokens.css')}\n${await read('demo/styles.css')}</style>`);
 html=html.replace('<script type="module" src="./app.mjs"></script>',`<script type="module">${script}</script>`);
 html=html.replace('href="./" aria-label="Automatron','href="#" aria-label="Automatron');
 const output=path.join(root,'dist/Functional_Minimalism_Workshop.html');await writeFile(output,html);return html;
}

async function labData(){
 const read=file=>readFile(path.join(root,file),'utf8');
 const index=JSON.parse(await read('demo/runs/index.json'));
 const presets=JSON.parse(await read('demo/presets.json'));
 const pack=JSON.parse(await read('packs/atelier/pack.json'));
 const contracts={},fixtures={};
 for(const preset of presets.presets){
  const file=path.resolve(root,'demo',preset.contract);
  contracts[preset.id]=JSON.parse(await readFile(file,'utf8'));
  if(preset.fixture)fixtures[preset.id]=JSON.parse(await read(path.join('demo',preset.fixture)));
 }
 let benchmark=null;
 try{benchmark=JSON.parse(await read('docs/benchmark.json'));}catch{}
 let gallery=null;
 try{gallery=JSON.parse(await read('gallery/templates.json'));}catch{}
 const runs=[];
 for(const row of index.runs){
  const run=JSON.parse(await read(`demo/runs/${row.id}.json`));
  for(const side of ['before','after']){
   const file=path.join(root,'demo/runs',`${row.id}-${side}.png`);
   const png=await readFile(file);
   run.conditions[side].screenshot='data:image/png;base64,'+png.toString('base64');
  }
  runs.push(run);
 }
 return {index,presets,pack,contracts,fixtures,runs,benchmark,gallery};
}

function stripModule(code){return code.replace(/^import .*;\n/gm,'').replace(/^export /gm,'');}

export async function buildStandalone(){
 const read=file=>readFile(path.join(root,file),'utf8');
 const workshop=await buildWorkshopStandalone();
 const zip=await packageSource();
 let css=await read('demo/brand.css');
 const art='data:image/svg+xml;base64,'+Buffer.from(await read('demo/assets/forest.svg')).toString('base64');
 css=css.replaceAll("./assets/forest.svg",art);
 const mark='data:image/svg+xml;base64,'+Buffer.from(await read('demo/mark.svg')).toString('base64');
 const core=stripModule(await read('src/core.mjs'));
 const lab=stripModule(await read('src/lab.mjs'));
 const measure=stripModule(await read('demo/measure.mjs'));
 const compare=stripModule(await read('demo/compare.mjs'));
 const embedded=await labData();
 const embeddedJSON=JSON.stringify(embedded).replace(/<\/script/gi,'<\\/script');
 let script=`globalThis.__labData=${embeddedJSON};\n${core}\n${lab}\n${measure}\n${compare}`;
 script+=`\nconst __workshop=document.querySelector('#workshop iframe');if(__workshop)__workshop.srcdoc=${JSON.stringify(workshop)};`;
 script+=`\nconst __zip=Uint8Array.from(atob(${JSON.stringify(zip.toString('base64'))}),c=>c.charCodeAt(0));const __zipURL=URL.createObjectURL(new Blob([__zip],{type:'application/zip'}));document.querySelector('[data-source]').href=__zipURL;document.querySelector('[data-source]').download='functional-minimalism-source.zip';`;
 script+=`\nconst __guideURL=URL.createObjectURL(new Blob([${JSON.stringify(await read('README.md'))}],{type:'text/plain'}));document.querySelectorAll('a[href="../README.md"]').forEach(a=>{a.href=__guideURL;a.download='README.md';});`;
 let html=await read('demo/index.html');
 html=html.replace(/<link rel="stylesheet" href="\.\/brand\.css[^"]*">/,()=>'<style>'+css+'</style>').replaceAll('./mark.svg',mark);
 html=html.replaceAll('href="../gallery/"','href="./gallery/"').replaceAll('href="../docs/BENCHMARK.md"','href="./docs/BENCHMARK.md"');
 html=html.replace(/<script type="module" src="\.\/compare\.mjs[^"]*"><\/script>/,()=>'<script type="module">'+script.replace(/<\/script/gi,'<\\/script')+'</script>');
 const output=path.join(root,'dist/Functional_Minimalism_Preview.html');await writeFile(output,html);return output;
}
