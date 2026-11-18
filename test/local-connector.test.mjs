import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../scripts/serve.mjs';

test('the local free connector is unavailable without a token and never leaks one',async()=>{
 const saved={key:process.env.OPENCODE_API_KEY,token:process.env.OPENCODE_TOKEN};
 delete process.env.OPENCODE_API_KEY;
 delete process.env.OPENCODE_TOKEN;
 const server=createServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const health=await fetch(`${base}/api/lab/health`);
  assert.equal(health.status,503);
  const healthBody=await health.json();
  assert.equal(healthBody.ok,false);
  assert.ok(!JSON.stringify(healthBody).includes('Bearer'));
  const generate=await fetch(`${base}/api/lab/generate`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model:'beam-free',messages:{system:'x',user:'y'}})});
  assert.equal(generate.status,503);
  const options=await fetch(`${base}/api/lab/generate`,{method:'OPTIONS'});
  assert.equal(options.status,204);
  assert.equal(options.headers.get('access-control-allow-origin'),'*');
 }finally{
  await new Promise(resolve=>server.close(resolve));
  if(saved.key!==undefined)process.env.OPENCODE_API_KEY=saved.key;
  if(saved.token!==undefined)process.env.OPENCODE_TOKEN=saved.token;
 }
});
