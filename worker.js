/* Local-only build adapters. Upstream code remains unchanged in vendor/. */
'use strict';
self.window = self;
const status = text => self.postMessage({status:text});
async function json(path) {
 const r=await fetch(path); if(!r.ok)throw Error(`Cannot load ${path}: ${r.status}`); return r.json();
}
function loadMC(id) {
 importScripts(`vendor/${id}/docs/flasher/builder.js`,`vendor/${id}/docs/flasher/tweaks.js`);
 return self.MC_TWEAKS;
}
function stockCheck(raw, tw) {
 const sha=self.MCBuilder.hex(self.MCBuilder.sha256(raw));
 if(sha!==tw.device.stock_syx_sha256)throw Error('Use the unmodified official Model:Cycles OS 1.13 .syx. / Utilisez le fichier officiel Model:Cycles OS 1.13 non modifié.');
}
self.onmessage=async ({data})=>{
 try {
  const {id,options={}}=data, raw=new Uint8Array(data.raw); let out, mainOsSha;
  status('Checking / Vérification…');
  if(id==='custom') {
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');
   if(!/^[a-f0-9]{64}$/i.test(data.expected||'')||hash!==data.expected.toLowerCase())throw Error('SHA-256 mismatch / Empreinte SHA-256 différente');
   out=raw;
  } else if(id==='tg') {
   importScripts('vendor/tg/flasher/elektron.js','vendor/tg/flasher/patch.js');
   if(self.Elektron.hex(self.Elektron.sha256(raw))!=='44fe586269631a0ca7da25a3383fc6733c314809505fc3cc52f1e0ed9800640c')throw Error('Use the unmodified official Model:Cycles OS 1.13 .syx.');
   const patch=await json('vendor/tg/flasher/model-tg.json');
   out=self.ModelTG.flash(raw,patch,(_,label)=>status(label)); mainOsSha=patch.result_sha256;
  } else if(id==='motor') {
   const motor=await import('./vendor/motor/docs/patcher.js');
   const response=await fetch('vendor/motor/docs/motorcycles.mcpatch');
   if(!response.ok)throw Error('Motor:Cycles patch kit unavailable');
   const kit=motor.readKit(new Uint8Array(await response.arrayBuffer()));
   out=await motor.convert(raw,kit,status);
  } else if(id==='mc'||id==='stock') {
   const tw=loadMC('mc'); stockCheck(raw,tw);
   if(id==='stock')out=raw;
   else {
    if(!data.syntakt)throw Error('The official Syntakt OS file is required. / Le fichier OS Syntakt officiel est requis.');
    const refs=await json('vendor/mc/refs.json');
    const chosen=tw.os.tweaks.map(id=>{const t=tw.tweaks.find(t=>t.id===id);if(!t)throw Error('Missing tweak '+id);return t;});
    const expected=refs.REF_MAINOS[tw.os.key]; if(!expected)throw Error('Missing whole-build reference');
    status('Building / Construction…');
    const r=self.MCBuilder.build(raw,tw.device,chosen,{syntakt:new Uint8Array(data.syntakt),refMods:refs.REF_MODS,expectMainOsSha:expected});
    if(!r.modsChecked)throw Error('Some mods did not match their references');
    out=r.raw; mainOsSha=r.mainOsSha;
   }
  } else if(id==='pppccc') {
   const tw=loadMC('mc');stockCheck(raw,tw);importScripts('pppccc.js');
   const manifest=await json('vendor/pppccc/patches/manifest.json');
   const patches=await Promise.all(manifest.patches.map(p=>json('vendor/pppccc/patches/'+p)));
   const latch=await json('vendor/tg/tweaks/model-cycles_OS1.13/01-latching-mute.json');
   status('Building PPPCCC / Construction PPPCCC…');
   const result=self.PPPCCC.build(raw,tw.device,manifest,patches,latch,options.pppccc,self.MCBuilder);
   out=result.raw;mainOsSha=result.mainOsSha;
  } else if(id==='model27') {
   const tw=loadMC('model27');stockCheck(raw,tw);
   importScripts('vendor/model27/docs/flasher/composer.js');
   const ids=options.packages||['sampler'];
   if(ids.some(id=>!Object.hasOwn(tw.packages,id)))throw Error('Unknown Model27 machine');
   const chosen=[];
   if(options.controlAll)chosen.push(tw.tweaks.find(t=>t.id==='control-all-config'));
   if(ids.length)chosen.push(self.MCComposer.compose(self.MCBuilder.mainOsOf(raw,tw.device),tw.registrar,ids.map(id=>tw.packages[id]),tw.tweaks,tw.parts||{},tw.claims||{}).tweak);
   if(!chosen.length)throw Error('Choose at least one Model27 feature. / Choisissez au moins une fonction Model27.');
   status('Composing Model27 / Composition Model27…');
   const r=self.MCBuilder.build(raw,tw.device,chosen);out=r.raw;mainOsSha=r.mainOsSha;
  } else throw Error('No integrated builder for this project');
  // Independently check the resulting container and its signature before transfer.
  importScripts('vendor/tg/flasher/elektron.js','vendor/mc/docs/flasher/flasher.js');
  const fw=self.Elektron.parseSyx(out);
  if(fw.device!==0x11||!fw.key)throw Error('Output signature or Model:Cycles product check failed');
  self.MCFlasher.verify(out);
  const messages=self.MCFlasher.splitMessages(out);
  if(messages.reduce((n,m)=>n+m.length,0)!==out.length)throw Error('Invalid SysEx framing');
  self.postMessage({done:out.buffer,mainOsSha},[out.buffer]);
 } catch(e){self.postMessage({error:e.message||String(e)});}
};
