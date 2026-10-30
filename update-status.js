/* Visible provenance and daily-check status. No firmware is fetched by this file. */
(()=>{'use strict';
let selected='supermodel',lang='en',report=null,registry=null,failed=false;
const $=id=>document.getElementById(id);
const text={en:{title:'Firmware updates',checking:'Checking update status…',unavailable:'Update status unavailable',last:'Last checked',policy:'Checked daily. Built-in updates are prepared on review branches and published after review. Author-hosted installers follow their authors directly.',available:'Update available — awaiting review',current:'No relevant upstream update',hosted:'Author-hosted · follows upstream',external:'External build · follow the project',checkFailed:'Check unavailable',incorporated:'Incorporated in SPOKES',review:'Review updates',source:'Upstream source',pending:'awaiting review'},fr:{title:'Mises à jour',checking:'Vérification des mises à jour…',unavailable:'État des mises à jour indisponible',last:'Dernière vérification',policy:'Vérification quotidienne. Les mises à jour intégrées sont préparées sur des branches puis publiées après révision. Les programmes hébergés suivent directement leurs créateurs.',available:'Mise à jour disponible — en attente de révision',current:'Aucune mise à jour pertinente',hosted:'Programme du créateur · suit son projet',external:'Compilation externe · suivez le projet',checkFailed:'Vérification indisponible',incorporated:'Intégré à SPOKES',review:'Voir les mises à jour',source:'Source du projet',pending:'en attente de révision'}};
function date(value){if(!value)return '';return new Intl.DateTimeFormat(lang==='fr'?'fr-FR':'en-US',{year:'numeric',month:'short',day:'numeric'}).format(new Date(value.length===10?value+'T12:00:00Z':value));}
function state(row,source){if(row.state==='check-failed')return 'checkFailed';if(source.kind==='author-hosted')return 'hosted';if(source.kind==='external-build')return 'external';return row.state==='update-available'&&source.revision!==row.latest?'available':'current';}
function render(){
 if(!$('updates-summary'))return;
 const t=text[lang];$('updates-policy').textContent=t.policy;
 if(!report||!registry){$('updates-summary').textContent=t.title+' · '+t[failed?'unavailable':'checking'];return;}
 const rows=report.sources.map(row=>({row,source:registry.sources.find(s=>s.id===row.id)||row}));
 const pending=rows.filter(({row,source})=>state(row,source)==='available').length;
 $('updates-summary').textContent=t.title+' · '+t.last+' '+date(report.checkedAt)+(pending?' · '+pending+' '+t.pending:'');
 $('updates-list').replaceChildren();
 for(const {row,source}of rows){
  const item=document.createElement('li'),name=window.FIRMWARE_CATALOGUE.find(s=>s.id===row.id)?.name||row.id;
  const label=document.createElement('strong');label.textContent=name;item.append(label,document.createTextNode(' — '+t[state(row,source)]));
  if(source.kind==='built-in'&&source.incorporatedAt)item.append(document.createTextNode('. '+t.incorporated+' '+date(source.incorporatedAt)+' · '+source.revision.slice(0,7)));
  const a=document.createElement('a');a.href=state(row,source)==='available'?'https://github.com/AveyCole/SPOKES/compare/main...bot/upstream-updates?expand=1':`https://github.com/${source.repo}`;a.textContent=t[state(row,source)==='available'?'review':'source'];a.target='_blank';a.rel='noopener';item.append(document.createTextNode(' '),a);$('updates-list').append(item);
 }
 const source=registry.sources.find(s=>s.id===selected),row=report.sources.find(s=>s.id===selected);
 if($('selected-update')){
  $('selected-update').hidden=!source||!row;
  if(source&&row)$('selected-update').textContent=(source.kind==='built-in'?t.incorporated+' '+date(source.incorporatedAt)+' · ':'')+t[state(row,source)];
 }
}
window.SpokesUpdates={select(id,language){selected=id;lang=language;render();}};
if(typeof fetch==='function')Promise.all(['updates.json','upstreams.json'].map(async path=>{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('Update report unavailable');return r.json();})).then(([r,c])=>{if(r.format!==1||c.format!==1||!Array.isArray(r.sources)||!Array.isArray(c.sources))throw Error('Unknown update report');report=r;registry=c;render();}).catch(()=>{failed=true;render();});
})();
