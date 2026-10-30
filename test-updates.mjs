import assert from 'node:assert/strict';
import test from 'node:test';
import {checkSources,relevantChange} from './check-updates.mjs';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{JSDOM}=require(process.env.SPOKES_JSDOM||'jsdom');
const pinned='a'.repeat(40),latest='b'.repeat(40),now='2026-10-29T18:00:00Z';
const source={id:'demo',repo:'owner/demo',kind:'built-in',revision:pinned,incorporatedAt:'2026-10-28',paths:['docs/patcher.js','README.md']};
test('only relevant source changes require an update proposal',()=>{assert.equal(relevantChange([{filename:'README.md'}],source),false);assert.equal(relevantChange([{filename:'docs/patcher.js'}],source),true);assert.equal(relevantChange([{filename:'docs/flasher/LICENSE-New.txt'}],source),true);});
test('records real updates while isolating unavailable sources',async()=>{
 const api=async path=>{if(path.includes('broken'))throw Error('rate limited');if(path.endsWith('/compare/'+pinned+'...'+latest))return {files:[{filename:'docs/patcher.js'}]};if(path.includes('/commits/'))return {sha:latest,commit:{committer:{date:now}}};return {full_name:'owner/demo',default_branch:'main'};};
 const report=await checkSources({sources:[source,{id:'broken',repo:'owner/broken',kind:'author-hosted'}]},api,now);
 assert.equal(report.checkedAt,now);assert.equal(report.sources[0].state,'update-available');assert.equal(report.sources[0].pinned,pinned);assert.equal(report.sources[1].state,'check-failed');
});
test('docs-only updates and author-hosted installers are not native upgrades',async()=>{
 const api=async path=>path.includes('/compare/')?{files:[{filename:'README.md'}]}:path.includes('/commits/')?{sha:latest,commit:{committer:{date:now}}}:{full_name:'owner/demo',default_branch:'main'};
 const report=await checkSources({sources:[source,{id:'hosted',repo:'owner/demo',kind:'author-hosted'}]},api,now);
 assert.equal(report.sources[0].state,'current');assert.equal(report.sources[1].state,'author-hosted');
});
test('flasher shows last check and current incorporated version after a merge',async()=>{
 const dom=new JSDOM('<details><summary id="updates-summary"></summary><p id="updates-policy"></p><ul id="updates-list"></ul></details><p id="selected-update"></p>',{runScripts:'outside-only',url:'https://example.test/'}),w=dom.window;
 w.FIRMWARE_CATALOGUE=[{id:'demo',name:'Demo'}];
 let revision=pinned;
 const report={format:1,checkedAt:now,sources:[{...source,state:'update-available',latest}]};
 w.fetch=async path=>({ok:true,json:async()=>path==='updates.json'?report:{format:1,sources:[{...source,revision}]}});
 const script=await readFile(new URL('./update-status.js',import.meta.url),'utf8');w.eval(script);w.SpokesUpdates.select('demo','en');await new Promise(r=>setTimeout(r,0));
 assert.match(w.document.getElementById('updates-summary').textContent,/1 awaiting review/);assert.match(w.document.getElementById('selected-update').textContent,/Incorporated in SPOKES/);
 revision=latest;w.eval(script);w.SpokesUpdates.select('demo','fr');await new Promise(r=>setTimeout(r,0));assert.doesNotMatch(w.document.getElementById('updates-summary').textContent,/en attente/);assert.match(w.document.getElementById('selected-update').textContent,/Aucune mise à jour pertinente/);dom.window.close();
});
