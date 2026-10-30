import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Worker} from 'node:worker_threads';
import vm from 'node:vm';
const base=new URL('./',import.meta.url);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest=JSON.parse(await readFile(new URL('vendor/manifest.json',base)));
const registry=JSON.parse(await readFile(new URL('upstreams.json',base)));
for(const source of registry.sources.filter(s=>s.kind==='built-in'))assert.ok(manifest.files.filter(f=>f.path.startsWith(source.id+'/')).every(f=>f.revision===source.revision&&f.repo===source.repo),'Registry and vendored revisions must match');
for(const f of manifest.files){const data=await readFile(new URL('vendor/'+f.path,base));assert.equal(sha(data),f.sha256,f.path);assert.equal(data.length,f.bytes);assert.match(f.revision,/^[a-f0-9]{40}$/);assert.doesNotMatch(f.path,/\.(syx|wav|zip)$/i);}
console.log(`PASS: ${manifest.files.length} upstream assets match their pinned checksums`);
const context={window:{}};vm.runInNewContext(await readFile(new URL('catalogue.js',base),'utf8'),context);
const catalogue=context.window.FIRMWARE_CATALOGUE;
for(const item of catalogue){assert.ok(item.en&&item.fr);if(item.revision&&item.mode==='build')assert.ok(manifest.files.some(f=>f.path.startsWith(item.id+'/')&&f.revision===item.revision));}
const refs=JSON.parse(await readFile(new URL('vendor/mc/refs.json',base)));
const upstream=await readFile(new URL('vendor/mc/docs/flasher/app.js',base),'utf8');
for(const name of ['REF_MAINOS','REF_MODS']){const expr=upstream.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});`))[1];assert.equal(JSON.stringify(refs[name]),JSON.stringify(vm.runInNewContext('('+expr+')')));}
const html=await readFile(new URL('index.html',base),'utf8'),ui=await readFile(new URL('hub.js',base),'utf8');
for(const match of ui.matchAll(/\$\('([^']+)'\)/g))assert.ok(html.includes(`id="${match[1]}"`),`Missing element ${match[1]}`);
console.log('PASS: catalogue revisions, bilingual entries, DOM references and upstream build references');
function run(data){return new Promise((resolve,reject)=>{const w=new Worker(new URL('test-worker.cjs',base)),timer=setTimeout(()=>{w.terminate();reject(Error('Worker timed out'));},120000);w.on('error',e=>{clearTimeout(timer);w.terminate();reject(e);});w.on('message',result=>{if(result.error||result.done){clearTimeout(timer);w.terminate();resolve(result);}});w.postMessage(data);});}
for(const id of ['tg','motor','mc','model27','pppccc','stock','unknown']){const result=await run({id,raw:new Uint8Array([0xf0,0xf7]).buffer});assert.ok(result.error&&!result.done,id+' must reject invalid firmware');}
assert.match((await run({id:'custom',raw:new Uint8Array([1,2,3]).buffer,expected:'0'.repeat(64)})).error,/SHA-256/);
console.log('PASS: all builders reject invalid firmware; custom build hash mismatch rejected');
// A real, locally approved image exercises container/signature verification, without distribution.
const fixture=process.env.SPOKES_SIGNED_FIXTURE||new URL('output/signed-fixture.syx',base);
try{
 await stat(fixture);const bytes=await readFile(fixture),raw=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length);
 const result=await run({id:'custom',raw,expected:sha(bytes)});assert.ok(result.done,result.error);assert.equal(sha(new Uint8Array(result.done)),sha(bytes));
 const corrupt=bytes.slice();corrupt[128]^=1;const failed=await run({id:'custom',raw:corrupt.buffer.slice(corrupt.byteOffset,corrupt.byteOffset+corrupt.length),expected:sha(corrupt)});assert.ok(failed.error&&!failed.done);
 console.log('PASS: signed image accepted byte-for-byte; corrupted image refused even with matching user hash');
}catch(e){if(e.code==='ENOENT')console.log('SKIP: local signed fixture missing');else throw e;}
if(process.argv[2]){
 const bytes=await readFile(process.argv[2]),raw=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length);
 assert.equal(sha(bytes),'44fe586269631a0ca7da25a3383fc6733c314809505fc3cc52f1e0ed9800640c');
 for(const id of ['stock','tg','motor','model27','pppccc']){const result=await run({id,raw});assert.ok(result.done,`${id}: ${result.error}`);if(id==='pppccc')assert.equal(result.mainOsSha,'995978244f98bd5a429418c098e6d05dadc0dcaf19c28a1218ec6816ad85a729');console.log(`PASS: ${id} full build; SYX ${sha(new Uint8Array(result.done))}`);}
 if(process.argv[3]){const b=await readFile(process.argv[3]);const result=await run({id:'mc',raw,syntakt:b.buffer.slice(b.byteOffset,b.byteOffset+b.length)});assert.ok(result.done,result.error);assert.ok(Object.values(refs.REF_MAINOS).includes(result.mainOsSha));console.log('PASS: Modded Cycles full build matches upstream whole-OS reference');}
}else console.log('LIMIT: official stock/Syntakt files unavailable; successful end-to-end recipe builds not tested. No hardware testing.');
