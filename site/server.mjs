import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { FileStore, validateInquiry } from './lib/inquiries.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const files=new Map([
  ['/', ['index.html','text/html; charset=utf-8']],
  ['/styles.css',['styles.css','text/css; charset=utf-8']],
  ['/app.js',['app.js','text/javascript; charset=utf-8']],
  ['/motion.js',['motion.js','text/javascript; charset=utf-8']],
  ['/assets/mark.svg',['assets/mark.svg','image/svg+xml']],
]);

export function createApp({publicDir=join(here,'public'),intakeEnabled=false,store=new FileStore(join(here,'data'))}={}) {
  const attempts=new Map();
  return createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    res.setHeader('X-Robots-Tag','noindex, nofollow');
    res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    const json=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(body));};
    const path=new URL(req.url,'http://localhost').pathname;
    if(path==='/api/config'&&req.method==='GET') return json(200,{intakeEnabled});
    if(path==='/api/inquiries'&&req.method==='POST') {
      if(!intakeEnabled){req.resume();return json(503,{error:'Прием заявок пока не настроен'});}
      if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`){req.resume();return json(403,{error:'Запрос запрещен'});}
      const now=Date.now();
      for(const [key,item] of attempts) if(now-item.start>60000) attempts.delete(key);
      const ip=req.socket.remoteAddress;
      const attempt=attempts.get(ip)||{start:now,count:0};
      attempt.count++;attempts.set(ip,attempt);
      if(attempt.count>20){req.resume();res.setHeader('Retry-After','60');return json(429,{error:'Слишком много запросов. Попробуйте позже'});}
      if(!req.headers['content-type']?.startsWith('application/json')) {req.resume();return json(400,{error:'Неверный формат запроса'});}
      const chunks=[];let bytes=0;
      try {
        for await(const chunk of req){bytes+=chunk.length;if(bytes>16384){json(413,{error:'Слишком большой запрос'});req.resume();return;}chunks.push(chunk);}
        let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return json(400,{error:'Неверный формат запроса'});}
        const inquiry=validateInquiry(body);
        if(!inquiry)return json(400,{error:'Проверьте контакт и описание задачи'});
        return json(201,await store.save(inquiry));
      }catch(error){if(!res.headersSent)return json(error.status===409?409:500,{error:error.status===409?'Данные отправки изменились':'Не удалось сохранить задачу'});return;}
    }
    const asset=files.get(path);
    if(!asset||!['GET','HEAD'].includes(req.method)){res.writeHead(404);res.end('Not found');return;}
    try{const data=await readFile(join(publicDir,asset[0]));res.writeHead(200,{'Content-Type':asset[1],'Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);}
    catch{res.writeHead(404);res.end('Not found');}
  });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const port=Number(process.env.PORT||4173);
  const intakeEnabled=process.env.INTAKE_ENABLED==='true'&&Boolean(process.env.OWNER_CONTACT?.trim());
  createApp({intakeEnabled}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}\nIntake: ${intakeEnabled?'enabled':'not configured (preview)'}`));
}
