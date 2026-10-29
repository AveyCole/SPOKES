/* Browser port of PPPCCC's tools/apply_patches.py, MIT (c) 2026 PPPCCC/gialloinfuso.
 * License and original: vendor/pppccc/LICENSE and vendor/pppccc/tools/apply_patches.py.
 * Original instructions are copied only from the user's stock file, after hash checks.
 */
(()=>{'use strict';
function materialize(stock,patches,B){
 const img=stock.slice(),used=[],have=new Set(),keyOff=0x401296b2-0x40000400;
 const hash=b=>B.hex(B.sha256(b));
 for(const p of [...patches].sort((a,b)=>a.id==='latching-mute'?-1:b.id==='latching-mute'?1:a.order-b.order)){
  const requires=p.requires||[];
  if(requires.some(r=>!have.has(r)))throw Error(`${p.id}: missing dependency`);
  if((p.conflicts||[]).some(r=>have.has(r)))throw Error(`${p.id}: conflicting patch`);
  for(const w of p.writes){
   const off=w.off,next=B.fromHex(w.new),n=w.old?Math.max(w.old.length/2,next.length):w.len,end=off+n;
   if(!Number.isInteger(off)||!Number.isInteger(n)||off<0||end>img.length)throw Error(`${p.id}: out-of-bounds write`);
   for(const f of w.from_original||[]){
    if(f.off<0||f.off+f.len>stock.length||f.at<0||f.at+f.len>next.length)throw Error(`${p.id}: invalid original-byte reference`);
    const bytes=stock.subarray(f.off,f.off+f.len);
    if(hash(bytes)!==f.sha256)throw Error(`${p.id}: original bytes differ`);next.set(bytes,f.at);
   }
   if(w.old?B.hex(img.subarray(off,off+w.old.length/2))!==w.old:(next.length!==n||hash(img.subarray(off,end))!==w.old_sha256))throw Error(`${p.id}: patch base differs`);
   if(off<keyOff+32&&end>keyOff)throw Error(`${p.id}: update-key write refused`);
   if(used.some(([a,b,who])=>end>a&&off<b&&!requires.includes(who)))throw Error(`${p.id}: write collision`);
   img.set(next,off);used.push([off,end,p.id]);
  }have.add(p.id);
 }
 return img;
}
function build(raw,device,manifest,patches,latching,selected,B){
 const wanted=new Set(selected||manifest.full_set),byId=new Map([...patches,latching].map(p=>[p.id,p]));
 if(!wanted.size)throw Error('Choose at least one PPPCCC mod / Choisissez au moins un mod PPPCCC');
 for(const id of wanted){const p=byId.get(id);if(!p)throw Error(`Unknown PPPCCC mod: ${id}`);for(const dep of p.requires||[])wanted.add(dep);}
 // MCBuilder has no mainOsOf in this pinned revision; extract the user's section directly.
 const {stream}=B.unwrap(raw),container=B.parseContainer(stream),section=container.sections.find(s=>s.id===3);
 if(!section)throw Error('MAIN OS missing');
 const stock=B.aplibDepack(container.blob.subarray(section.off,section.off+section.size)).data;
 if(B.hex(B.sha256(stock))!==device.section_sha256)throw Error('Official stock MAIN OS required');
 const image=materialize(stock,[...wanted].map(id=>byId.get(id)),B),writes=[];
 for(let i=0;i<image.length;){if(image[i]===stock[i]){i++;continue;}const start=i++;while(i<image.length&&image[i]!==stock[i])i++;writes.push({off:start,old:B.hex(stock.subarray(start,i)),new:B.hex(image.subarray(start,i))});}
 const full=wanted.size===manifest.full_set.length&&manifest.full_set.every(id=>wanted.has(id));
 const expected=full?manifest.bases.find(b=>b.target==='cycles').full_set_result_sha256:null;
 const result=B.build(raw,device,[{id:'pppccc-hub',order:0,writes}],expected?{expectMainOsSha:expected}:{});
 return {...result,fullReference:!!expected};
}
self.PPPCCC={build,materialize};
})();
