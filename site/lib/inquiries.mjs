import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export function validateInquiry(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const {contact,message,service='Пока не знаю',requestId,website=''}=data;
  if(typeof contact!=='string'||!contact.trim()||contact.trim().length>200) return null;
  if(typeof message!=='string'||message.trim().length<10||message.trim().length>3000) return null;
  if(!['Пока не знаю','Сайт','Приложение','ИИ-агент'].includes(service)) return null;
  if(typeof requestId!=='string'||!/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(requestId)) return null;
  if(website!=='') return null;
  return {contact:contact.trim(),message:message.trim(),service,requestId};
}

export class FileStore {
  #queue=Promise.resolve();
  constructor(directory){this.directory=directory;}
  save(input){
    const next=this.#queue.then(()=>this.#save(input));
    this.#queue=next.catch(()=>{});
    return next;
  }
  async #save(input){
    await mkdir(this.directory,{recursive:true});
    const path=join(this.directory,input.requestId+'.json');
    try {
      const saved=JSON.parse(await readFile(path,'utf8'));
      if(saved.contact!==input.contact||saved.message!==input.message||saved.service!==input.service) {
        const error=new Error('Conflicting request'); error.status=409; throw error;
      }
      return {id:saved.id};
    } catch(error){if(error.code!=='ENOENT') throw error;}
    const saved={...input,id:randomUUID(),createdAt:new Date().toISOString()};
    await writeFile(path,JSON.stringify(saved,null,2),{flag:'wx',mode:0o600});
    return {id:saved.id};
  }
}
