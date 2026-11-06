import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { createApp } from '../server.mjs';
import { FileStore } from '../lib/inquiries.mjs';

const valid = {contact:'hello@example.com', message:'Нужно разработать приложение для заказов', service:'Приложение', requestId:'01234567-89ab-cdef-0123-456789abcdef', website:''};
async function setup(t, options={}) {
  const dir = await mkdtemp(join(tmpdir(),'portfolio-test-'));
  const server = createApp({intakeEnabled:true,store:new FileStore(dir),...options});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await new Promise(resolve=>server.close(resolve)); await rm(dir,{recursive:true,force:true});});
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (data=valid,headers={})=>fetch(base+'/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
  return {dir,base,post};
}
test('disabled intake refuses data instead of pretending success',async t=>{
  const {post,base,dir}=await setup(t,{intakeEnabled:false});
  assert.equal((await post()).status,503);
  assert.deepEqual(await (await fetch(base+'/api/config')).json(),{intakeEnabled:false});
  assert.deepEqual(await readdir(dir),[]);
});
test('valid inquiry is saved and concurrent retry has the same id',async t=>{
  const {post,dir}=await setup(t);
  const responses=await Promise.all([post(),post()]);
  assert.deepEqual(responses.map(r=>r.status),[201,201]);
  const results=await Promise.all(responses.map(r=>r.json()));
  assert.equal(results[0].id,results[1].id);
  const files=await readdir(dir);
  assert.equal(files.length,1);
  const saved=JSON.parse(await readFile(join(dir,files[0]),'utf8'));
  assert.equal(saved.contact,'hello@example.com');
  assert.equal(saved.message,valid.message);
});
test('same key with changed content is a conflict',async t=>{
  const {post}=await setup(t);
  await post();
  assert.equal((await post({...valid,message:'Другая задача для приложения'})).status,409);
});
test('rejects empty, oversized, invalid service and request keys',async t=>{
  const {post}=await setup(t);
  for(const change of [{contact:' '},{message:'коротко'},{message:'x'.repeat(3001)},{contact:'x'.repeat(201)},{service:'crypto'},{requestId:'../../outside'}]) assert.equal((await post({...valid,...change})).status,400);
});
test('storage failure returns error without claiming acceptance',async t=>{
  const {post}=await setup(t,{store:{save:async()=>{throw new Error('disk failure');}}});
  const response=await post();
  assert.equal(response.status,500);
  assert.equal('id' in await response.json(),false);
});
test('static allowlist does not expose private files or source',async t=>{
  const {base}=await setup(t);
  for(const path of ['/server.mjs','/package.json','/data/test.json','/../research.md','/.env']) assert.equal((await fetch(base+path)).status,404);
});
test('rejects cross-origin and bot submissions',async t=>{
  const {post}=await setup(t);
  assert.equal((await post(valid,{Origin:'https://foreign.example'})).status,403);
  assert.equal((await post({...valid,website:'spam'})).status,400);
});
test('oversized raw body is rejected',async t=>{
  const {base}=await setup(t);
  const response=await fetch(base+'/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:'x'.repeat(20000)});
  assert.equal(response.status,413);
});
test('preserves Russian text when an HTTP chunk splits a UTF-8 character',async t=>{
  const {base,dir}=await setup(t);
  const body=Buffer.from(JSON.stringify(valid));
  const split=body.indexOf(Buffer.from('Нужно'))+1;
  const status=await new Promise((resolve,reject)=>{
    const req=request(base+'/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});
    req.on('error',reject);
    req.write(body.subarray(0,split));
    setTimeout(()=>req.end(body.subarray(split)),20);
  });
  assert.equal(status,201);
  const files=await readdir(dir);
  const saved=JSON.parse(await readFile(join(dir,files[0]),'utf8'));
  assert.equal(saved.message,'Нужно разработать приложение для заказов');
});
