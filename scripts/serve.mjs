import http from 'node:http';
import path from 'node:path';
import {readFile,realpath,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function createServer(){return http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const url=new URL(req.url,'http://localhost');const pathname=decodeURIComponent(url.pathname);
  if(pathname==='/'){res.writeHead(302,{Location:'/demo/'});res.end();return;}
  if(pathname.split('/').some(p=>p.startsWith('.')||p.includes('\\'))){res.writeHead(403);res.end();return;}
  if(!/^\/(demo|src|packs|examples|docs)\//.test(pathname)&&pathname!=='/README.md'){res.writeHead(404);res.end();return;}
  let target=path.resolve(root,'.'+pathname);if(pathname.endsWith('/'))target=path.join(target,'index.html');
  const resolved=await realpath(target);if(!resolved.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const info=await stat(resolved);if(!info.isFile()){res.writeHead(404);res.end();return;}
  const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.md':'text/plain','.txt':'text/plain'};
  res.writeHead(200,{'Content-Type':(types[path.extname(target)]??'application/octet-stream')+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'"});
  res.end(req.method==='HEAD'?undefined:await readFile(resolved));
 }catch(error){res.writeHead(error.code==='ENOENT'?404:400);res.end('Not found');}
});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const server=createServer();const port=Number(process.env.DESIGN_HARNESS_PORT??4178);
 server.listen(port,'127.0.0.1',()=>console.log(`Design Harness: http://127.0.0.1:${server.address().port}/demo/`));
 server.on('error',error=>{console.error(error.message);process.exitCode=1;});
}
