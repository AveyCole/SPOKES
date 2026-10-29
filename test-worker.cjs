// Node harness for the actual browser worker; importScripts loads identical sources.
const {parentPort}=require('node:worker_threads');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
global.self=global;global.crypto=require('node:crypto').webcrypto;
global.importScripts=(...files)=>{for(const file of files)vm.runInThisContext(fs.readFileSync(path.resolve(__dirname,file),'utf8'),{filename:file});};
global.fetch=async file=>{try{const data=await fs.promises.readFile(path.resolve(__dirname,file));return {ok:true,status:200,json:async()=>JSON.parse(data),arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.length)};}catch{return {ok:false,status:404};}};
global.postMessage=data=>parentPort.postMessage(data);
require('./worker.js');parentPort.on('message',data=>global.onmessage({data}));
