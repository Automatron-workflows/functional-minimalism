import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';

test('the public connector refuses requests without a secret and lists only free models',async()=>{
 const missing=await worker.fetch(new Request('https://connector.example/health'),{});
 assert.equal(missing.status,503);
 const health=await worker.fetch(new Request('https://connector.example/health'),{OPENCODE_TOKEN:'test'});
 assert.equal(health.status,200);
 const body=await health.json();
 assert.equal(body.ok,true);
 assert.equal(body.models.length,4);
 assert.equal(body.models.filter(model=>model.free).length,3);
 const notFound=await worker.fetch(new Request('https://connector.example/nope'),{OPENCODE_TOKEN:'test'});
 assert.equal(notFound.status,404);
 const post=await worker.fetch(new Request('https://connector.example/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model:'beam-free',messages:{system:'x',user:'y'}})}),{});
 assert.equal(post.status,503);
 const cors=await worker.fetch(new Request('https://connector.example/generate',{method:'OPTIONS'}),{});
 assert.equal(cors.status,204);
 assert.equal(cors.headers.get('access-control-allow-origin'),'*');
});
