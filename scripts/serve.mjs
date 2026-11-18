import http from 'node:http';
import path from 'node:path';
import {readFile,realpath,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

const OPENCODE_BASE='https://opencode.ai/zen/go/v1';
const LAB_MODELS=[
 {id:'longcat-2.5-free',label:'LongCat 2.5',free:true},
 {id:'beam-free',label:'Beam',free:true},
 {id:'hy4-flash-free',label:'HY4 Flash',free:true},
 {id:'qwen3.8-flash',label:'Qwen 3.8 Flash',free:false}
];
const labToken=()=>process.env.OPENCODE_API_KEY||process.env.OPENCODE_TOKEN||'';
function json(res,status,body,extra={}){
 res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'GET,POST,OPTIONS',...extra});
 res.end(JSON.stringify(body));
}
async function bodyOf(req,limit=2_000_000){
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>limit)throw new Error('Request body too large');chunks.push(chunk);}
 if(!size)return null;
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new Error('Request body must be JSON');}
}
async function labHealth(req,res){
 if(!labToken()){json(res,503,{ok:false,error:'Free connector is not configured. Set OPENCODE_API_KEY on the local server.'});return;}
 json(res,200,{ok:true,models:LAB_MODELS});
}
async function labGenerate(req,res){
 const token=labToken();
 if(!token){json(res,503,{ok:false,error:'Free connector is not configured. Set OPENCODE_API_KEY on the local server.'});return;}
 let body;
 try{body=await bodyOf(req);}catch(error){json(res,400,{ok:false,error:error.message});return;}
 if(!body||!body.messages){json(res,400,{ok:false,error:'messages required'});return;}
 const model=LAB_MODELS.find(item=>item.id===body.model)??LAB_MODELS[0];
 const raw=body.messages;
 const messages=Array.isArray(raw)?raw:[
  {role:'system',content:String(raw.system??'')},
  {role:'user',content:String(raw.user??'')}
 ];
 if(!messages.some(message=>String(message.content??'').trim())){json(res,400,{ok:false,error:'empty messages'});return;}
 const maxTokens=Math.min(Number(body.maxTokens)||16000,24000);
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),300000);
 try{
  const response=await fetch(`${OPENCODE_BASE}/chat/completions`,{
   method:'POST',
   headers:{'content-type':'application/json',authorization:`Bearer ${token}`,'x-opencode-session':`local-${Date.now()}-${Math.random().toString(36).slice(2)}`},
   body:JSON.stringify({model:model.id,messages,max_tokens:maxTokens,temperature:0.3,stream:false,...(model.id.includes('hy4')?{reasoning_effort:'low'}:{})}),
   signal:controller.signal
  });
  const text=await response.text();
  let jsonBody;
  try{jsonBody=JSON.parse(text);}catch{jsonBody=null;}
  if(!response.ok){
   json(res,502,{ok:false,error:jsonBody?.error?.message??text.slice(0,300)??`Provider returned ${response.status}`});
   return;
  }
  const choice=jsonBody?.choices?.[0];
  const content=choice?.message?.content??'';
  if(!content.trim()){json(res,502,{ok:false,error:'Provider returned an empty response'});return;}
  json(res,200,{
   ok:true,
   model:jsonBody.model??model.id,
   finishReason:choice?.finish_reason??null,
   text:content,
   usage:{input:jsonBody.usage?.prompt_tokens??null,output:jsonBody.usage?.completion_tokens??null,total:jsonBody.usage?.total_tokens??null,cost:jsonBody.usage?.cost??null}
  });
 }catch(error){
  json(res,502,{ok:false,error:controller.signal.aborted?'The free connector timed out':error.message});
 }finally{clearTimeout(timer);}
}
export function createServer(){return http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='OPTIONS'){json(res,204,{});return;}
  if(url.pathname==='/api/lab/health'){await labHealth(req,res);return;}
  if(url.pathname==='/api/lab/generate'){if(req.method!=='POST'){json(res,405,{ok:false,error:'POST required'});return;}await labGenerate(req,res);return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const pathname=decodeURIComponent(url.pathname);
  if(pathname==='/'){res.writeHead(302,{Location:'/demo/'});res.end();return;}
  if(pathname.split('/').some(p=>p.startsWith('.')||p.includes('\\'))){res.writeHead(403);res.end();return;}
  if(!/^\/(demo|src|packs|examples|docs|references|gallery)\//.test(pathname)&&pathname!=='/README.md'&&pathname!=='/functional-minimalism-source.zip'){res.writeHead(404);res.end();return;}
  let target=pathname==='/functional-minimalism-source.zip'?path.join(root,'dist/functional-minimalism-source.zip'):path.resolve(root,'.'+pathname);if(pathname.endsWith('/'))target=path.join(target,'index.html');
  const resolved=await realpath(target);if(!resolved.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const info=await stat(resolved);if(!info.isFile()){res.writeHead(404);res.end();return;}
  const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.md':'text/plain','.txt':'text/plain'};
  res.writeHead(200,{'Content-Type':(types[path.extname(target)]??'application/octet-stream')+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://openrouter.ai; object-src 'none'; base-uri 'self'"});
  res.end(req.method==='HEAD'?undefined:await readFile(resolved));
 }catch(error){res.writeHead(error.code==='ENOENT'?404:400);res.end('Not found');}
});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const server=createServer();const port=Number(process.env.DESIGN_HARNESS_PORT??4178);
 server.listen(port,'127.0.0.1',()=>{
  console.log(`Functional Minimalism: http://127.0.0.1:${server.address().port}/demo/`);
  console.log(labToken()?'Free local connector enabled: no browser key needed.':'Set OPENCODE_API_KEY to enable the free local connector.');
 });
 server.on('error',error=>{console.error(error.message);process.exitCode=1;});
}
