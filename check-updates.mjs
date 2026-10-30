// GitHub metadata only: never downloads firmware or runs upstream code.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function relevantChange(files,source){
 const tracked=new Set((source.paths||[]).filter(p=>!p.endsWith('README.md')));
 return files.some(f=>tracked.has(f.filename)||/^(docs\/flasher\/LICENSE|third-party-notices\/)/.test(f.filename));
}
export async function checkSources(config,api,now=new Date().toISOString()){
 const sources=[];
 for(const source of config.sources){
  const result={id:source.id,repo:source.repo,kind:source.kind,pinned:source.revision||null,incorporatedAt:source.incorporatedAt||null};
  try{
   const repo=await api(`/repos/${source.repo}`),head=await api(`/repos/${source.repo}/commits/${encodeURIComponent(repo.default_branch)}`);
   result.repo=repo.full_name;result.latest=head.sha;result.upstreamUpdatedAt=head.commit?.committer?.date||null;
   result.sourceUrl=`https://github.com/${result.repo}`;
   if(source.kind!=='built-in')result.state=source.kind;
   else if(head.sha===source.revision)result.state='current';
   else{
    const comparison=await api(`/repos/${source.repo}/compare/${source.revision}...${head.sha}`);
    result.compareUrl=`https://github.com/${result.repo}/compare/${source.revision}...${head.sha}`;
    result.state=relevantChange(comparison.files||[],source)||(comparison.files||[]).length>=300?'update-available':'current';
   }
  }catch(e){result.state='check-failed';result.error=String(e.message).slice(0,180);}
  sources.push(result);
 }
 return {format:1,checkedAt:now,policy:'daily-review-pr',sources};
}
async function main(){
 const config=JSON.parse(await readFile(new URL('./upstreams.json',import.meta.url),'utf8'));
 const token=process.env.GITHUB_TOKEN||process.env.GH_TOKEN;
 const headers={Accept:'application/vnd.github+json',...(token?{Authorization:`Bearer ${token}`}:{})};
 const api=async path=>{const response=await fetch('https://api.github.com'+path,{headers,signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`GitHub check failed (${response.status})`);return response.json();};
 const report=await checkSources(config,api);
 await writeFile(new URL('./updates.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 const changed=report.sources.filter(s=>s.state==='update-available');
 console.log(`Checked ${report.sources.length} sources; ${changed.length} relevant built-in updates; ${report.sources.filter(s=>s.state==='check-failed').length} checks unavailable.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
