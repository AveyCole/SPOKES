// Simulate ports and worker replies; no Web MIDI permission and no hardware I/O.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require(process.env.SPOKES_JSDOM||'jsdom');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
function setup(){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(html,{url:'https://example.test/firmware-hub/',runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window,d=w.document,called={fast:0,classic:0,identify:0,close:0};
 w.crypto.subtle=require('node:crypto').webcrypto.subtle;w.isSecureContext=true;
 const output={id:'out',name:'Model:Cycles',state:'connected',open:async()=>{}},input={id:'in',name:'Model:Cycles',state:'connected'};
 const access={inputs:new Map([['in',input]]),outputs:new Map([['out',output]]),sysexEnabled:true};
 w.navigator.requestMIDIAccess=async()=>access;
 let identity={device:'Model:Cycles',product:0x11};
 w.MCFlasher={verify:()=>({product:0x11}),splitMessages:()=>[new Uint8Array([240,1,247])],xferOpen:async()=>({close:()=>called.close++}),xferIdentify:async()=>{called.identify++;return identity;},upgradeFast:async(session,raw,opts)=>{called.fast++;opts.onProgress(1,1);return {sent:1,total:1,cancelled:false};},sendSysex:async()=>{called.classic++;return {sent:1,total:1,cancelled:false};}};
 w.Worker=class{postMessage(data){this.data=data;Promise.resolve().then(()=>this.onmessage({data:{done:new Uint8Array([240,1,247]).buffer}}));}terminate(){}};
 w.eval(fs.readFileSync(path.join(__dirname,'catalogue.js'),'utf8'));w.eval(fs.readFileSync(path.join(__dirname,'hub.js'),'utf8'));
 const $=id=>d.getElementById(id),click=selector=>d.querySelector(selector).click(),change=id=>$(id).dispatchEvent(new w.Event('change'));
 function file(id){Object.defineProperty($(id),'files',{configurable:true,value:[{size:3,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer}]});change(id);}
 return {dom,w,d,$,click,change,file,called,errors,identity:value=>identity=value};
}
async function ready(x){x.click('[data-id=tg]');x.file('stock');await x.$('build').onclick();await x.$('connect').onclick();x.$('midi-in').value='in';x.$('midi-out').value='out';x.$('confirm').checked=true;x.change('midi-out');x.$('confirm').checked=true;x.$('confirm').onchange();assert.equal(x.$('flash').disabled,false);}
(async()=>{
 let x=setup();assert.equal(x.d.querySelectorAll('.card').length,12);assert.equal(x.$('transfer-panel').hidden,true);
 x.click('[data-id=machinedrum]');assert.equal(x.$('existing').hidden,false);assert.equal(x.$('build-panel').hidden,true);assert.equal(x.$('transfer-panel').hidden,true);assert.match(x.$('description').textContent,/Machinedrum UW OS 1.63/);assert.equal(x.$('installer').hasAttribute('src'),false);x.$('open-existing').click();assert.equal(x.$('installer').src,'https://talachan12.github.io/Elektron-Model-Machinedrum/');assert.equal(x.d.querySelector('[data-id=tg]').disabled,true);x.$('close-installer').click();assert.equal(x.$('installer').hasAttribute('src'),false);assert.equal(x.d.querySelector('[data-id=tg]').disabled,false);
 x.click('[data-id=mc]');assert.equal(x.$('syntakt-row').hidden,false);x.file('stock');assert.equal(x.$('build').disabled,true);x.file('syntakt');assert.equal(x.$('build').disabled,false);
 x.click('[data-id=pppccc]');assert.equal(x.$('pppccc-options').hidden,false);assert.equal(x.d.querySelectorAll('[name=pppccc]:checked').length,12);
 x.click('[data-id=david]');assert.equal(x.$('transfer-panel').hidden,true);assert.equal(x.$('build-panel').hidden,true);
 x.click('[data-id=plaits]');assert.equal(x.$('manual-panel').hidden,false);assert.equal(x.$('method').value,'classic');assert.equal(x.$('method').querySelector('[value=fast]').disabled,true);
 x.$('language').click();assert.equal(x.d.documentElement.lang,'fr');assert.ok(x.$('description').textContent.includes('Onze'));
 x.$('search').value='PPPCCC';x.$('search').oninput();assert.equal(x.d.querySelectorAll('.card').length,1);assert.equal(x.errors.length,0);x.dom.window.close();
 console.log('PASS: project panels, required files, PPPCCC options, unverified entry, Plaits transport, French and search');
 x=setup();await ready(x);x.identity({device:'Model:Samples',product:0x0f});await x.$('flash').onclick();assert.equal(x.called.fast,0);assert.equal(x.called.classic,0);assert.equal(x.called.close,1);assert.match(x.$('result').textContent,/not a Model:Cycles/);assert.equal(x.$('confirm').checked,false);
 x.dom.window.close();console.log('PASS: wrong hardware identity prevents transfer and closes the session');
 x=setup();await ready(x);await x.$('flash').onclick();assert.equal(x.called.fast,1);assert.equal(x.called.close,1);assert.match(x.$('result').textContent,/Transfer complete/);assert.equal(x.$('flash').disabled,true);x.click('[data-id=motor]');assert.equal(x.$('download').disabled,true);assert.equal(x.$('hashes').hidden,true);assert.equal(x.$('confirm').checked,false);
 x.dom.window.close();console.log('PASS: successful transfer state; switching firmware discards stale build and consent');
 x=setup();await ready(x);x.w.MCFlasher.upgradeFast=async(s,r,opts)=>{x.$('cancel').click();assert.equal(opts.isCancelled(),true);return {sent:0,total:1,cancelled:true};};await x.$('flash').onclick();assert.match(x.$('result').textContent,/Transfer stopped/);assert.equal(x.$('cancel').hidden,true);x.dom.window.close();console.log('PASS: cancellation reports an incomplete update, not success');
 x=setup();await ready(x);x.w.MCFlasher.upgradeFast=async()=>{throw Error('Disconnected');};await x.$('flash').onclick();assert.match(x.$('result').textContent,/Disconnected/);assert.equal(x.$('download').disabled,false);assert.equal(x.called.close,1);x.dom.window.close();console.log('PASS: disconnect errors restore controls and close MIDI session');
})().catch(e=>{console.error(e);process.exitCode=1;});
