// Prepare a review branch. Downloads pinned source; never executes the new code.
import {readFile,writeFile,appendFile,mkdir,cp} from 'node:fs/promises';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const config=JSON.parse(await readFile('upstreams.json','utf8')),report=JSON.parse(await readFile('updates.json','utf8'));
const changes=report.sources.filter(s=>s.state==='update-available');
if(!changes.length){if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,'candidate=false\n');console.log('No built-in update proposal needed.');process.exit(0);}
const proposal={format:1,changes:changes.map(({id,pinned,latest})=>({id,pinned,latest})).sort((a,b)=>a.id.localeCompare(b.id))};
try{
 const prior=JSON.parse(execFileSync('git',['show','origin/bot/upstream-updates:UPSTREAM-UPDATES.json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));
 if(process.env.SPOKES_FORCE_UPDATE!=='true'&&JSON.stringify(prior)===JSON.stringify(proposal)){
  if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,'candidate=false\n');console.log('The same upstream changes already have a review proposal; no repeat notification.');process.exit(0);
 }
}catch{}
const context={window:{}};vm.runInNewContext(await readFile('catalogue.js','utf8'),context);
const catalogue=context.window.FIRMWARE_CATALOGUE;
for(const change of changes){
 if(!/^[a-f0-9]{40}$/.test(change.latest))throw Error('Invalid upstream revision');
 const source=config.sources.find(s=>s.id===change.id);source.revision=change.latest;source.incorporatedAt=report.checkedAt.slice(0,10);
 const entry=catalogue.find(s=>s.id===change.id);entry.revision=change.latest;entry.version=change.latest.slice(0,7);
}
let imported=false,importError='';
try{
 await mkdir('output/upstream-candidate',{recursive:true});
 await writeFile('output/upstream-candidate/upstreams.json',JSON.stringify(config,null,2)+'\n');
 process.env.SPOKES_UPSTREAM_CONFIG='output/upstream-candidate/upstreams.json';
 process.env.SPOKES_VENDOR_DEST='output/upstream-candidate/vendor/';
 await import('./sync-upstream.mjs');
 await cp('output/upstream-candidate/vendor','vendor',{recursive:true,force:true});
 await writeFile('upstreams.json',JSON.stringify(config,null,2)+'\n');
 await writeFile('catalogue.js','/* Curated identities; built-in revisions remain pinned until this review branch is merged. */\nwindow.FIRMWARE_CATALOGUE = '+JSON.stringify(catalogue,null,2)+';\n');
 // Index version prevents browsers combining a new deployment with an old catalogue.
 const index=await readFile('index.html','utf8');await writeFile('index.html',index.replace(/src="catalogue\.js(?:\?[^"]*)?"/,`src="catalogue.js?v=${changes.map(s=>s.latest.slice(0,7)).join('-')}"`));
 const priorValidation=await readFile('VALIDATION.md','utf8');
 const banner=`<!-- upstream-validation -->\n> Upstream source pins changed on ${report.checkedAt.slice(0,10)}. Automated checks cover source integrity and simulated behavior only. The successful official-file builds and hardware status recorded below apply to the prior revisions, not these new assets. Review this branch and repeat official-file builds before merging.\n<!-- /upstream-validation -->\n\n`;
 await writeFile('VALIDATION.md',banner+priorValidation.replace(/<!-- upstream-validation -->[\s\S]*?<!-- \/upstream-validation -->\s*/,''));
 imported=true;
}catch(e){importError=String(e.message).slice(0,500);console.error('Upstream import needs adaptation:',importError);}
// Do not carry prior hardware/build validation claims onto new upstream assets.
await writeFile('UPSTREAM-UPDATES.md',`# Upstream update proposal\n\nDetected ${report.checkedAt}.\n\n${changes.map(s=>`- **${s.id}**: ${s.pinned} → ${s.latest}. [Compare](${s.compareUrl})`).join('\n')}\n\nImport: ${imported?'prepared for validation':'blocked — '+importError}.\n\nThis branch must be reviewed before publication. The validation job checks source integrity, invalid-file rejection and simulated UI/MIDI behavior. It does not build with official OS files or test hardware. Repeat official-file build checks and review adapter compatibility before merging. Prior results in VALIDATION.md apply only to the revisions recorded there.\n`);
await writeFile('UPSTREAM-UPDATES.json',JSON.stringify(proposal,null,2)+'\n');
if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`candidate=true\nimport_ok=${imported}\n`);
console.log(`Prepared ${changes.length} pinned updates for validation and review.`);
